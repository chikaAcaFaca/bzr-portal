import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DailyQuestionLimitProps {
  onQuestionLimitReached?: () => void;
}

export function DailyQuestionLimit({ onQuestionLimitReached }: DailyQuestionLimitProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Za PRO korisnike, ova komponenta nema efekta
  if (user?.subscriptionType === 'pro') {
    return null;
  }
  
  // Dobavljanje informacija o dnevnom broju pitanja
  const { data: usageData, isLoading } = useQuery({
    queryKey: ['/api/ai-usage/daily-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai-usage/daily-stats', { method: 'GET' });
      const data = await response.json();
      return data;
    },
    refetchOnWindowFocus: true,
  });
  
  // Ako korisnik nije ulogovan ili se podaci učitavaju, ne prikazuj ništa
  if (!user || isLoading) {
    return null;
  }
  
  const questionsAsked = usageData?.questionsAsked || 0;
  const dailyLimit = usageData?.dailyLimit || 3;
  const limitReached = questionsAsked >= dailyLimit;
  
  // Ako je limit dostignut, prikaži upozorenje
  if (limitReached) {
    // Pozovi callback ako je prosleđen
    if (onQuestionLimitReached) {
      onQuestionLimitReached();
    }
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dnevni limit pitanja dostignut</AlertTitle>
        <AlertDescription>
          <p>Iskoristili ste svih {dailyLimit} pitanja za danas. Kao FREE korisnik, imate ograničenje od {dailyLimit} pitanja dnevno.</p>
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-primary border-primary hover:bg-primary hover:text-white"
              asChild
            >
              <Link href="/settings">
                <ArrowUp className="mr-2 h-4 w-4" />
                Nadogradi na PRO za neograničen pristup
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Ako limit nije dostignut, prikaži informaciju o preostalim pitanjima
  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Preostala pitanja: {dailyLimit - questionsAsked}</AlertTitle>
      <AlertDescription>
        <p>Kao FREE korisnik, imate ograničenje od {dailyLimit} pitanja dnevno. Iskoristili ste {questionsAsked} pitanja.</p>
      </AlertDescription>
    </Alert>
  );
}