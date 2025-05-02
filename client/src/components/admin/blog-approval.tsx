import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageCircle,
  AlertCircle 
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  authorId: number | null;
  originalQuestion: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  adminFeedback: string | null;
}

export function BlogApproval() {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState<boolean>(false);
  const [viewPostDialogOpen, setViewPostDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();

  // Učitaj blogove koji čekaju odobrenje
  const { data: pendingPosts = [], isLoading: isPendingLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog', 'pending_approval'],
    queryFn: async () => {
      const response = await fetch('/api/blog?status=pending_approval');
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje blog postova koji čekaju odobrenje');
      }
      return response.json();
    },
  });

  // Učitaj nedavno odobrene/odbijene blogove
  const { data: recentlyProcessedPosts = [], isLoading: isRecentLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog', 'approved,rejected'],
    queryFn: async () => {
      const response = await fetch('/api/blog?status=approved,rejected&limit=10');
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje nedavno obrađenih blog postova');
      }
      return response.json();
    },
  });

  // Mutacija za odobravanje bloga
  const approveMutation = useMutation({
    mutationFn: async (blogId: number) => {
      const response = await apiRequest('PUT', `/api/blog/${blogId}/approve`, {});
      if (!response.ok) {
        throw new Error('Greška pri odobravanju blog posta');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Blog post odobren',
        description: 'Blog post je uspešno odobren i biće objavljen.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      setSelectedPost(null);
    },
    onError: (error) => {
      toast({
        title: 'Greška pri odobravanju',
        description: error.message || 'Došlo je do greške pri odobravanju blog posta. Pokušajte ponovo.',
        variant: 'destructive',
      });
    },
  });

  // Mutacija za odbijanje bloga
  const rejectMutation = useMutation({
    mutationFn: async ({ blogId, reason }: { blogId: number; reason: string }) => {
      const response = await apiRequest('PUT', `/api/blog/${blogId}/reject`, { adminFeedback: reason });
      if (!response.ok) {
        throw new Error('Greška pri odbijanju blog posta');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Blog post odbijen',
        description: 'Blog post je uspešno odbijen sa navedenim razlogom.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      setSelectedPost(null);
      setRejectionReason('');
      setFeedbackDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Greška pri odbijanju',
        description: error.message || 'Došlo je do greške pri odbijanju blog posta. Pokušajte ponovo.',
        variant: 'destructive',
      });
    },
  });

  // Helper funkcija za formatiranje datuma
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const handleApprove = (post: BlogPost) => {
    approveMutation.mutate(post.id);
  };

  const handleReject = () => {
    if (!selectedPost) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: 'Potreban razlog odbijanja',
        description: 'Molimo unesite razlog odbijanja kako bismo mogli poboljšati kvalitet sadržaja.',
        variant: 'destructive',
      });
      return;
    }
    
    rejectMutation.mutate({ 
      blogId: selectedPost.id, 
      reason: rejectionReason 
    });
  };

  const openRejectionDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setRejectionReason('');
    setFeedbackDialogOpen(true);
  };

  const openViewPostDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setViewPostDialogOpen(true);
  };

  if (isPendingLoading && isRecentLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="pending">
            Čekaju odobrenje
            <Badge variant="secondary" className="ml-2">{pendingPosts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="recent">Nedavno obrađeni</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CheckCircle size={50} className="text-green-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Svi blog postovi su obrađeni</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Trenutno nema blog postova koji čekaju odobrenje. Proverite ponovo kasnije.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {post.imageUrl && (
                      <div className="w-full md:w-64 h-48 overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className="mb-2">AI Generisano</Badge>
                            <CardTitle>{post.title}</CardTitle>
                            <CardDescription>
                              Kreirano {formatDate(post.createdAt)}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="uppercase"
                          >
                            {post.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {post.excerpt || post.content.substring(0, 150) + '...'}
                          </p>
                        </div>
                        {post.originalQuestion && (
                          <div className="bg-slate-50 p-3 rounded-md mb-4">
                            <p className="text-sm font-medium mb-1">Originalno pitanje:</p>
                            <p className="text-sm text-gray-600 italic">{post.originalQuestion}</p>
                          </div>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewPostDialog(post)}
                          >
                            <Eye size={16} className="mr-1" /> Pregledaj
                          </Button>
                          {post.status === 'pending_approval' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(post)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle size={16} className="mr-1" /> Odobri
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openRejectionDialog(post)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle size={16} className="mr-1" /> Odbij
                              </Button>
                            </>
                          )}
                        </div>
                        <Link 
                          href={`/blog/${post.slug}`} 
                          className="text-sm text-primary hover:underline"
                        >
                          Otvori u pregledniku
                        </Link>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {recentlyProcessedPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertCircle size={50} className="text-slate-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">Nema nedavnih aktivnosti</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Nijedan blog post nije nedavno odobren ili odbijen.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recentlyProcessedPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{post.title}</CardTitle>
                            <CardDescription>
                              {post.status === 'approved' 
                                ? `Odobreno ${formatDate(post.updatedAt)}` 
                                : `Odbijeno ${formatDate(post.updatedAt)}`}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={post.status === 'approved' ? 'default' : 'destructive'}
                          >
                            {post.status === 'approved' ? 'Odobreno' : 'Odbijeno'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        {post.status === 'rejected' && post.adminFeedback && (
                          <div className="bg-red-50 p-3 rounded-md mb-3">
                            <p className="text-sm font-medium mb-1 text-red-700">Razlog odbijanja:</p>
                            <p className="text-sm text-red-600">{post.adminFeedback}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewPostDialog(post)}
                        >
                          <Eye size={16} className="mr-1" /> Pregledaj
                        </Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog za unos razloga odbijanja */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Odbijanje blog posta</DialogTitle>
            <DialogDescription>
              Unesite razlog odbijanja kako bismo mogli poboljšati kvalitet sadržaja.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Unesite razlog odbijanja..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setFeedbackDialogOpen(false)}
            >
              Odustani
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Odbijanje...' : 'Odbij blog post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog za pregled blog posta */}
      <Dialog open={viewPostDialogOpen} onOpenChange={setViewPostDialogOpen}>
        <DialogContent className="sm:max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              {selectedPost && formatDate(selectedPost.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedPost?.imageUrl && (
              <div className="mb-6 overflow-hidden rounded-lg">
                <img
                  src={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {selectedPost?.originalQuestion && (
              <div className="bg-slate-50 p-4 rounded-md mb-6">
                <h4 className="text-sm font-medium mb-1 flex items-center">
                  <MessageCircle size={16} className="mr-2" />
                  Originalno pitanje korisnika:
                </h4>
                <p className="text-sm text-gray-600 italic">{selectedPost.originalQuestion}</p>
              </div>
            )}

            <div className="prose prose-slate max-w-none">
              {selectedPost?.content && (
                <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              )}
            </div>
          </div>

          <DialogFooter>
            {selectedPost?.status === 'pending_approval' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setViewPostDialogOpen(false)}
                >
                  Zatvori
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setViewPostDialogOpen(false);
                    handleApprove(selectedPost);
                  }}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle size={16} className="mr-1" /> Odobri
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewPostDialogOpen(false);
                    openRejectionDialog(selectedPost);
                  }}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle size={16} className="mr-1" /> Odbij
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setViewPostDialogOpen(false)}
              >
                Zatvori
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}