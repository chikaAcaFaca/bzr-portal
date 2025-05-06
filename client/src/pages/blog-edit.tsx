import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftIcon, ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Tipovi za blog post
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

export default function BlogEditPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Provera da li je korisnik prijavljen
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Učitavanje blog posta
  const { data: postData, isLoading, error } = useQuery<{ success: boolean, blog: BlogPost }>({
    queryKey: [`/api/blog/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/blog/${id}`);
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje blog posta');
      }
      return response.json();
    },
    enabled: !!id, // Učitaj samo ako imamo ID
  });

  // Popunjavanje forme podacima iz blog posta
  useEffect(() => {
    if (postData?.blog) {
      const blog = postData.blog;
      setTitle(blog.title);
      setContent(blog.content);
      setExcerpt(blog.excerpt || '');
      setCategory(blog.category);
      setImageUrl(blog.imageUrl || '');
      setTags(blog.tags ? blog.tags.join(', ') : '');
    }
  }, [postData]);

  // Mutacija za ažuriranje blog posta
  const updateBlogMutation = useMutation({
    mutationFn: async (blogData: any) => {
      return apiRequest('PUT', `/api/blog/${id}`, blogData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/${id}`] });
      toast({
        title: "Blog post ažuriran",
        description: "Blog post je uspešno ažuriran.",
      });
      navigate(`/blog`);
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja blog posta: " + error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  // Slanje forme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Priprema podataka za slanje
      const blogData = {
        title,
        content,
        excerpt: excerpt || null,
        category,
        imageUrl: newImageUrl || imageUrl,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : null,
      };

      // Slanje zahteva za ažuriranje
      await updateBlogMutation.mutateAsync(blogData);
    } catch (error) {
      console.error('Greška prilikom ažuriranja:', error);
      setIsSubmitting(false);
    }
  };

  // Funkcija za dodavanje slike
  const handleImageUrlUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImageUrl) {
      setImageUrl(newImageUrl);
      toast({
        title: "Slika dodata",
        description: "URL slike je ažuriran. Izmene će biti sačuvane kada ažurirate blog post.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !postData?.blog) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Greška pri učitavanju blog posta ili nemate dozvolu za uređivanje.
        </div>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/blog">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Nazad na blog
          </Link>
        </Button>
      </div>
    );
  }

  const blog = postData.blog;
  const isAuthor = blog.authorId === user?.id;
  const isAdmin = user?.role === 'admin';

  // Provera prava pristupa
  if (!isAuthor && !isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Nemate dozvolu za uređivanje ovog blog posta.
        </div>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/blog">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Nazad na blog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Uređivanje blog posta</h1>
        <Button variant="outline" asChild>
          <Link href="/blog">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Nazad na blog
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Naslov</Label>
          <Input 
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="excerpt">Kratak opis (excerpt)</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="mt-1 h-20"
          />
        </div>

        <div>
          <Label htmlFor="category">Kategorija</Label>
          <Input 
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="tags">Tagovi (odvojeni zarezima)</Label>
          <Input 
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1"
            placeholder="npr. bezbednost, procena rizika, oprema"
          />
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <ImageIcon className="mr-2" /> Slika blog posta
          </h3>
          
          {imageUrl && (
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-500">Trenutna slika:</p>
              <div className="w-full h-48 overflow-hidden rounded-md mb-2">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-gray-500 break-all">{imageUrl}</p>
            </div>
          )}
          
          <Separator className="my-4" />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <Label htmlFor="newImageUrl">URL nove slike</Label>
              <Input 
                id="newImageUrl"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Unesite URL slike (npr. sa Unsplash, Pexels, itd.)
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline"
              className="mt-auto"
              onClick={handleImageUrlUpdate}
              disabled={!newImageUrl}
            >
              Prikaži novu sliku
            </Button>
          </div>
        </Card>

        <div>
          <Label htmlFor="content">Sadržaj</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="mt-1 min-h-[500px]"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate('/blog')}
          >
            Otkaži
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sačuvaj izmene
          </Button>
        </div>
      </form>
    </div>
  );
}