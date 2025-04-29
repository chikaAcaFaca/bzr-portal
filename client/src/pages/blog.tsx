import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  TagIcon, 
  UserIcon, 
  BookOpenIcon, 
  ArrowRightIcon,
  FilterIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

const statusLabels: Record<string, string> = {
  'draft': 'Nacrt',
  'pending_approval': 'Čeka odobrenje',
  'approved': 'Odobreno',
  'published': 'Objavljeno',
  'rejected': 'Odbijeno'
};

const statusColors: Record<string, string> = {
  'draft': 'bg-gray-200 text-gray-800',
  'pending_approval': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-blue-100 text-blue-800',
  'published': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800'
};

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('published');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: posts = [], isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog', activeTab, filterCategory],
    queryFn: async () => {
      let url = '/api/blog';
      if (activeTab !== 'all') {
        url += `?status=${activeTab}`;
      }
      if (filterCategory) {
        url += `${url.includes('?') ? '&' : '?'}category=${filterCategory}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje blog postova');
      }
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/blog/categories'],
    queryFn: async () => {
      // Privremeno ekstrahujemo kategorije iz postova
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje kategorija');
      }
      const allPosts = await response.json();
      const categorySet = new Set(allPosts.map((post: BlogPost) => post.category));
      return Array.from(categorySet);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Blog</h1>
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Blog</h1>
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Greška pri učitavanju blog postova. Molimo pokušajte ponovo kasnije.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog</h1>
        {isAdmin && (
          <Link href="/blog/create">
            <Button className="flex items-center gap-2">
              <PlusIcon size={16} />
              Novi post
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="published">Objavljeno</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="pending_approval">Čeka odobrenje</TabsTrigger>
                <TabsTrigger value="draft">Nacrti</TabsTrigger>
                <TabsTrigger value="all">Svi postovi</TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="outline" className={`cursor-pointer ${!filterCategory ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setFilterCategory(null)}>
            Sve kategorije
          </Badge>
          {categories.map((category) => (
            <Badge 
              key={category} 
              variant="outline" 
              className={`cursor-pointer ${filterCategory === category ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setFilterCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <BookOpenIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">Nema pronađenih blog postova</h3>
          <p className="text-gray-500 mt-2">
            {activeTab === 'published' 
              ? 'Trenutno nema objavljenih blog postova.' 
              : `Nema blog postova sa statusom "${statusLabels[activeTab]}"`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
              {post.imageUrl && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" 
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={statusColors[post.status]}>
                    {statusLabels[post.status]}
                  </Badge>
                  <Badge variant="outline">{post.category}</Badge>
                </div>
                <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarIcon size={14} />
                  {post.publishedAt 
                    ? formatDate(post.publishedAt)
                    : formatDate(post.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-gray-600 mb-4">
                  {post.excerpt || post.content.substring(0, 150) + '...'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <EyeIcon size={14} />
                    {post.viewCount} pregleda
                  </span>
                  {post.tags && post.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <TagIcon size={14} />
                      {post.tags.slice(0, 2).join(', ')}
                      {post.tags.length > 2 && '...'}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="flex items-center gap-1" asChild>
                  <Link href={`/blog/${post.slug}`}>
                    Pročitaj više <ArrowRightIcon size={14} />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}