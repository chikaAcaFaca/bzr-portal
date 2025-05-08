import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRightIcon, 
  CheckIcon, 
  CalendarIcon,
  TagIcon,
  EyeIcon,
  CheckCircleIcon,
  ChevronDownIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import QualificationQuestionnaire from '@/components/questionnaire/qualification-questionnaire';
import { FeatureCard } from "@/components/ui/feature-card";

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

export default function LandingPage() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const { toast } = useToast();
  const insuranceSectionRef = useRef<HTMLElement>(null);
  const [isInsuranceVisible, setIsInsuranceVisible] = useState(false);

  // Učitaj najnovije blog postove
  const { data: recentPostsData, isLoading } = useQuery({
    queryKey: ['/api/blog', 'recent'],
    queryFn: async () => {
      const response = await fetch('/api/blog?status=published&limit=3');
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje blog postova');
      }
      const data = await response.json();
      return data;
    },
  });
  
  const recentPosts = recentPostsData?.blogs || [];
  
  // Dodajemo IntersectionObserver da bismo detektovali kada je sekcija osiguranja vidljiva
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInsuranceVisible(true);
          // Možemo zaustaviti posmatranje nakon što je komponenta postala vidljiva
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 } // Aktivira se kada je 20% elementa vidljivo
    );
    
    if (insuranceSectionRef.current) {
      observer.observe(insuranceSectionRef.current);
    }

    return () => {
      if (insuranceSectionRef.current) {
        observer.unobserve(insuranceSectionRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Bezbednost na radu <br />
              <span className="text-yellow-300">nikad jednostavnije</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Automatizovano rešenje koje štedi vaše vreme i osigurava usklađenost sa zakonskim propisima.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => setShowQuestionnaire(true)}
              >
                Da li se kvalifikujete za Član 47?
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-white hover:bg-white/10"
              >
                <Link href="/auth">Registrujte se besplatno</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="bg-white p-5 rounded-lg shadow-2xl transform rotate-2 z-10 relative">
              <img 
                src="https://placehold.co/600x400/2563eb/FFFFFF?text=BZR+Portal"
                alt="BZR Portal Dashboard" 
                className="rounded w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-yellow-400 p-4 rounded-lg shadow-lg z-20 transform -rotate-3">
              <p className="text-blue-900 font-bold">✓ Usklađeno sa zakonom</p>
            </div>
            <div className="absolute -top-6 -right-6 bg-green-500 p-4 rounded-lg shadow-lg z-20 transform rotate-6">
              <p className="text-white font-bold">✓ Ušteda vremena do 70%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Osiguranje na klik mini hero section */}
      <section 
        ref={insuranceSectionRef}
        className={`bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 rounded-xl mx-4 my-6 shadow-xl overflow-hidden relative
          ${isInsuranceVisible ? 'animate-fade-in-scale transform-gpu' : 'opacity-0'}
        `}
        style={{
          transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Ukrasni elementi u pozadini */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-orange-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-amber-200 rounded-full opacity-20"></div>
        
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="md:w-2/3 mb-6 md:mb-0 md:pr-10">
              <div className="w-fit mb-4 px-3 py-1 bg-orange-700/30 rounded-full text-white text-sm font-medium border border-white/20">
                NOVO!
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${isInsuranceVisible ? 'animate-slide-in-right' : ''}`}
                  style={{ animationDelay: '0.3s' }}>
                Osiguranje zaposlenih - zakonska obaveza
              </h2>
              <p className={`md:text-lg mb-4 opacity-90 ${isInsuranceVisible ? 'animate-slide-in-right' : ''}`}
                 style={{ animationDelay: '0.5s' }}>
                Ispunite zakonsku obavezu osiguranja zaposlenih od povreda na radu i profesionalnih oboljenja.
              </p>
              <Button 
                className={`bg-white text-orange-600 hover:bg-orange-50 shadow-md hover:shadow-lg ${isInsuranceVisible ? 'animate-bounce-in' : ''}`}
                style={{ animationDelay: '0.7s', transition: 'all 0.3s ease' }}
              >
                <Link href="/osiguranje-na-klik">Saznajte više o osiguranju</Link>
              </Button>
            </div>
            <div className={`md:w-1/3 bg-white/10 p-5 rounded-lg backdrop-blur-sm border border-white/20 shadow-2xl 
              hover:shadow-orange-300/30 hover:border-white/40 transition-all duration-300
              ${isInsuranceVisible ? 'animate-slide-in-left' : ''}`}
              style={{ animationDelay: '0.6s' }}
            >
              <div className="flex items-start space-x-3">
                <CheckIcon className="h-6 w-6 text-amber-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white">Zakonska obaveza</h3>
                  <p className="text-sm text-white/80">Izbegnite kazne do 1.000.000 RSD</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 mt-4">
                <CheckIcon className="h-6 w-6 text-amber-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white">Jednostavno ugovaranje</h3>
                  <p className="text-sm text-white/80">Brza procedura bez papirologije</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button variant="link" className="text-white px-0 hover:text-amber-200">
                  <Link href="/osiguranje-na-klik">Ugovorite odmah →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qualification Questionnaire Modal */}
      {showQuestionnaire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Procena kvalifikacije za Član 47</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowQuestionnaire(false)}
                >
                  ✕
                </Button>
              </div>
              
              <QualificationQuestionnaire 
                onComplete={() => {
                  setShowQuestionnaire(false);
                  toast({
                    title: "Upitnik uspešno popunjen",
                    description: "Rezultati su poslati na vašu e-mail adresu.",
                    variant: "default",
                  });
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-base bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-full">
              Bezbednost i zdravlje na radu
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Zašto odabrati BZR Portal?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Naš portal pruža sveobuhvatno rešenje za upravljanje svim aspektima bezbednosti i zdravlja na radu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Automatizacija procesa"
              description="Automatsko prepoznavanje radnih mesta, procena rizika i kreiranje akata o proceni rizika. Smanjite vreme potrebno za administraciju."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              borderColor="border-t-4 border-blue-500"
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
              route="/document-processor"
              requiresAuth={true}
              requiresPro={true}
            />
            
            <FeatureCard
              title="Usklađenost sa zakonima"
              description="Portal se redovno ažurira u skladu sa najnovijim propisima i zakonima vezanim za bezbednost i zdravlje na radu u Srbiji."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              }
              borderColor="border-t-4 border-green-500"
              bgColor="bg-green-100"
              iconColor="text-green-600"
              route="/regulatory-updates"
              requiresAuth={true}
              requiresPro={false}
            />
            
            <FeatureCard
              title="Centralizovana dokumentacija"
              description="Sve važne dokumente možete čuvati na jednom mestu, organizovati ih i pristupiti im u bilo kom trenutku."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              borderColor="border-t-4 border-purple-500"
              bgColor="bg-purple-100"
              iconColor="text-purple-600"
              route="/document-storage"
              requiresAuth={true}
              requiresPro={true}
            />
            
            <FeatureCard
              title="AI asistent za BZR"
              description="Specijalizovani AI asistent sa znanjem o zakonskoj regulativi i praksi BZR u Srbiji odgovara na vaša pitanja."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              borderColor="border-t-4 border-yellow-500"
              bgColor="bg-yellow-100"
              iconColor="text-yellow-600"
              route="/ai-assistant"
              requiresAuth={true}
              requiresPro={false}
            />
            
            <FeatureCard
              title="Upravljanje rizicima"
              description="Identifikujte, procenite i upravljajte rizicima na radnom mestu. Kreirajte mere za smanjenje rizika."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              borderColor="border-t-4 border-red-500"
              bgColor="bg-red-100"
              iconColor="text-red-600"
              route="/risk-categories"
              requiresAuth={true}
              requiresPro={true}
            />
            
            <FeatureCard
              title="Referalni program"
              description="Podelite BZR Portal sa kolegama i partnerima i zaradite dodatni prostor za skladištenje."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              }
              borderColor="border-t-4 border-indigo-500"
              bgColor="bg-indigo-100"
              iconColor="text-indigo-600"
              route="/referral-program"
              requiresAuth={true}
              requiresPro={false}
            />
          </div>
        </div>
      </section>

      {/* Article 47 Information Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 bg-blue-100 rounded-full w-40 h-40 opacity-70"></div>
            <div className="relative z-10">
              <Badge className="mb-6 px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                Član 47 Zakona o BZR
              </Badge>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Možete li sami obavljati poslove bezbednosti i zdravlja na radu?</h2>
              <p className="text-lg text-gray-700 mb-8 max-w-3xl">
                Prema <span className="font-semibold">Članu 47</span> Zakona o bezbednosti i zdravlju na radu, 
                poslodavci u određenim delatnostima sa manje od 20 zaposlenih mogu sami obavljati poslove bezbednosti i zdravlja na radu,
                bez angažovanja spoljnog lica sa licencom.
              </p>
              
              <div className="bg-white rounded-lg p-6 shadow-md mb-8">
                <h3 className="text-xl font-bold mb-4 text-blue-800">Kvalifikovane delatnosti</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    'Trgovina na malo',
                    'Usluge smeštaja i ishrane',
                    'Informisanje i komunikacije',
                    'Finansijske delatnosti',
                    'Delatnosti osiguranja',
                    'Poslovanje nekretninama',
                    'Stručne i naučne delatnosti',
                    'Inovacione delatnosti',
                    'Administrativne delatnosti',
                    'Pomoćne uslužne delatnosti',
                    'Obavezno socijalno osiguranje',
                    'Obrazovanje',
                    'Umetnost, zabava i rekreacija',
                    'Ostale uslužne delatnosti'
                  ].map((delatnost, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{delatnost}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowQuestionnaire(true)}
              >
                Proverite da li se kvalifikujete
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 text-base bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded-full">
              Naš blog
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Najnoviji članci</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Korisni saveti i informacije iz oblasti bezbednosti i zdravlja na radu
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post: BlogPost) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
                    <Badge variant="outline">{post.category}</Badge>
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

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <Link href="/blog">Pogledajte sve blogove</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Spremni ste da unapredite bezbednost na radu?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Registrujte se besplatno i isprobajte BZR Portal – sveobuhvatno rešenje za vašu kompaniju.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => setShowQuestionnaire(true)}
            >
              Proverite kvalifikaciju za Član 47
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
              <Link href="/auth">Registrujte se besplatno</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">BZR Portal</h3>
              <p className="text-gray-400 mb-4">
                Sveobuhvatno rešenje za upravljanje bezbednošću i zdravljem na radu.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Linkovi</h3>
              <ul className="space-y-2">
                <li><Link href="/auth" className="text-gray-400 hover:text-white">Prijava</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
                <li><Link href="/osiguranje-na-klik" className="text-gray-400 hover:text-white">Osiguranje na klik</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">O nama</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Kontakt</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Uslovi korišćenja</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Kontakt</h3>
              <address className="not-italic text-gray-400">
                <p className="mb-2">Email: bzr.portal.com@gmail.com</p>
                <p className="mb-2">Telefon: +381 64 125 8686</p>
                <p>Adresa: Karađorđeva 18a, Pančevo</p>
              </address>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} BZR Portal. Sva prava zadržana.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}