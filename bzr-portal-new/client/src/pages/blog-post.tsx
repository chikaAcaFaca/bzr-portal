import React from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  TagIcon, 
  ArrowLeftIcon, 
  UserIcon, 
  EyeIcon, 
  ThumbsUpIcon,
  ThumbsDownIcon,
  Share2Icon,
  EditIcon,
  AlertTriangleIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  category: string;
  tags: string[] | null;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  originalQuestion: string | null;
  callToAction: string | null;
  adminFeedback: string | null;
  authorId: number | null;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export default function BlogPostPage() {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const isAuthor = (post: BlogPost) => post.authorId === user?.id;

  const { data: postData, isLoading, error } = useQuery<{ success: boolean, blog: BlogPost }>({
    queryKey: ['/api/blog/get-by-slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/get-by-slug/${slug}`);
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje blog posta');
      }
      return response.json();
    },
  });
  
  // Izvlačimo stvarni post iz odgovora
  const post = postData?.blog;

  const approvePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest('PATCH', `/api/blog/${postId}/status`, {
        status: 'approved'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/get-by-slug', slug] });
      toast({
        title: "Post odobren",
        description: "Blog post je uspešno odobren.",
      });
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom odobravanja posta.",
        variant: "destructive",
      });
    }
  });

  const publishPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest('PATCH', `/api/blog/${postId}/status`, {
        status: 'published'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/get-by-slug', slug] });
      toast({
        title: "Post objavljen",
        description: "Blog post je uspešno objavljen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom objavljivanja posta.",
        variant: "destructive",
      });
    }
  });

  const rejectPostMutation = useMutation({
    mutationFn: async ({ postId, feedback }: { postId: number, feedback: string }) => {
      return apiRequest('PATCH', `/api/blog/${postId}/status`, {
        status: 'rejected',
        adminFeedback: feedback
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/get-by-slug', slug] });
      toast({
        title: "Post odbijen",
        description: "Blog post je označen kao odbijen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom odbijanja posta.",
        variant: "destructive",
      });
    }
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt || 'Pogledajte ovaj blog post',
        url: window.location.href,
      })
      .then(() => {
        toast({
          title: "Podeljeno",
          description: "Uspešno podeljeno!",
        });
      })
      .catch((error) => {
        console.error('Greška prilikom deljenja:', error);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link kopiran",
        description: "Link do članka je kopiran u clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Greška pri učitavanju blog posta. Molimo pokušajte ponovo kasnije.
        </div>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/blog">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Nazad na blog
          </Link>
        </Button>
      </div>
    );
  }

  const canEdit = isAdmin || isAuthor(post);
  const isPending = post.status === 'pending_approval';
  const isDraft = post.status === 'draft';
  const isRejected = post.status === 'rejected';
  const isApproved = post.status === 'approved';

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Nazad na blog
            </Link>
          </Button>

          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" asChild>
                <Link href={`/blog/edit/${post.id}`}>
                  <EditIcon className="mr-2 h-4 w-4" /> Izmeni
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={handleShare}>
              <Share2Icon className="mr-2 h-4 w-4" /> Podeli
            </Button>
          </div>
        </div>

        {/* Status bar za administratore i autore */}
        {(isAdmin || isAuthor(post)) && (post.status !== 'published') && (
          <Card className="p-4 bg-gray-50 border-l-4 border-yellow-500">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="font-medium flex items-center">
                  <AlertTriangleIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  Status posta: <Badge className="ml-2">{post.status}</Badge>
                </h3>
                {isRejected && post.adminFeedback && (
                  <p className="mt-2 text-sm text-gray-700">
                    <strong>Povratna informacija:</strong> {post.adminFeedback}
                  </p>
                )}
              </div>

              {/* Admin akcije */}
              {isAdmin && isPending && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => approvePostMutation.mutate(post.id)}
                    disabled={approvePostMutation.isPending}
                  >
                    <ThumbsUpIcon className="mr-2 h-4 w-4" /> Odobri
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <ThumbsDownIcon className="mr-2 h-4 w-4" /> Odbij
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Odbijanje blog posta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Unesite povratnu informaciju za autora. Ova informacija će pomoći autoru da razume razloge odbijanja.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <textarea 
                        id="feedback" 
                        className="w-full p-2 border rounded-md h-32" 
                        placeholder="Unesite povratnu informaciju o razlozima odbijanja"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Otkaži</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            const feedback = (document.getElementById('feedback') as HTMLTextAreaElement).value;
                            if (feedback) {
                              rejectPostMutation.mutate({ postId: post.id, feedback });
                            } else {
                              toast({
                                title: "Potreban je feedback",
                                description: "Molimo vas da unesete povratnu informaciju pre odbijanja.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Odbij post
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Admin akcije za odobrene postove */}
              {isAdmin && isApproved && (
                <Button 
                  size="sm" 
                  onClick={() => publishPostMutation.mutate(post.id)}
                  disabled={publishPostMutation.isPending}
                >
                  Objavi post
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Glavni sadržaj posta */}
        <div>
          {post.imageUrl && (
            <div className="w-full h-64 md:h-96 overflow-hidden rounded-xl mb-6">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="outline">{post.category}</Badge>
            {post.tags && post.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1">
              <CalendarIcon size={16} />
              {post.publishedAt 
                ? formatDate(post.publishedAt)
                : formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <EyeIcon size={16} />
              {post.viewCount} pregleda
            </span>
            {post.originalQuestion && (
              <span className="flex items-center gap-1 italic">
                Pitanje: {post.originalQuestion}
              </span>
            )}
          </div>

          <div className="prose prose-lg max-w-none mb-8">
            {post.content.split('\n').map((paragraph, index) => (
              paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
            ))}
          </div>

          {post.callToAction && (
            <div className="bg-primary/10 p-6 rounded-lg border border-primary/20 my-8">
              <h3 className="font-semibold text-lg mb-2">Saznajte više</h3>
              <p>{post.callToAction}</p>
              <Button className="mt-4">Kontaktirajte nas</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}