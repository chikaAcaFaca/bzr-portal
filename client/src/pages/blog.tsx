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
      {/* Hero section sa predstavljanjem BZR Portala */}
      <div className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-2/3 text-white mb-8 md:mb-0 md:pr-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              BZR Portal - Bezbednost i zdravlje na radu
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Kompletno rešenje za upravljanje bezbednošću i zdravljem na radu, koje štedi vreme i povećava usklađenost sa zakonskom regulativom.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                <Link href="/auth">Registrujte se</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                <Link href="#prednosti">Saznajte više</Link>
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="bg-white p-4 rounded-lg transform rotate-3 shadow-xl">
              <img 
                src="/images/bzr-dashboard.png" 
                alt="BZR Portal Dashboard" 
                className="rounded w-full h-auto max-w-xs" 
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/400x300/2563eb/FFFFFF?text=BZR+Portal";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Prednosti portala */}
      <div id="prednosti" className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Zašto odabrati BZR Portal?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-t-4 border-blue-500">
            <CardHeader>
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle>Automatizacija procesa</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Automatsko prepoznavanje radnih mesta, procena rizika i kreiranje akte o proceni rizika. Smanjite vreme potrebno za administraciju i fokusirajte se na bezbednost.</p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-green-500">
            <CardHeader>
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <CardTitle>Usklađenost sa zakonima</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Portal se redovno ažurira u skladu sa najnovijim propisima i zakonima vezanim za bezbednost i zdravlje na radu u Srbiji, čime se osigurava potpuna usklađenost.</p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-purple-500">
            <CardHeader>
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <CardTitle>Centralizovana dokumentacija</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Sve važne dokumente možete čuvati na jednom mestu, organizovati ih i pristupiti im u bilo kom trenutku. Sigurno skladištenje i jednostavan pristup.</p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-yellow-500">
            <CardHeader>
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <CardTitle>AI asistent za BZR</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Specijalizovani AI asistent sa znanjem o zakonskoj regulativi i praksi BZR u Srbiji koji može odgovoriti na vaša pitanja i pomoći vam rešiti izazove.</p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-red-500">
            <CardHeader>
              <div className="bg-red-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle>Upravljanje rizicima</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Identifikujte, procenite i upravljajte rizicima na radnom mestu. Kreirajte mere za smanjenje rizika i pratite njihovu implementaciju.</p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-indigo-500">
            <CardHeader>
              <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <CardTitle>Referalni program</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Podelite BZR Portal sa kolegama i partnerima i zaradite dodatni prostor za skladištenje. Što više preporuka pošaljete, veći prostor dobijate.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Blog section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Naši blog postovi</h2>
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