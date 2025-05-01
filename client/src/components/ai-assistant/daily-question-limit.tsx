import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, HelpCircle, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface DailyQuestionLimitProps {
  onQuestionLimitReached?: () => void;
}

export function DailyQuestionLimit({ onQuestionLimitReached }: DailyQuestionLimitProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usedQuestions, setUsedQuestions] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(3); // Default limit for FREE users
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [resetTime, setResetTime] = useState<string>('');
  
  useEffect(() => {
    async function fetchQuestionLimit() {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await apiRequest('/api/ai/usage/daily', {
          method: 'GET'
        });
        
        const data = await response.json();
        
        if (data.success) {
          setUsedQuestions(data.usedQuestions);
          setMaxQuestions(data.maxQuestions);
          setIsLimitReached(data.usedQuestions >= data.maxQuestions);
          setResetTime(data.resetTime);
          
          if (data.usedQuestions >= data.maxQuestions && onQuestionLimitReached) {
            onQuestionLimitReached();
          }
        } else {
          throw new Error(data.error || 'Greška pri dohvatanju limita pitanja');
        }
      } catch (error: any) {
        console.error('Error fetching question limit:', error);
        toast({
          variant: 'destructive',
          title: 'Greška',
          description: 'Nije moguće dohvatiti podatke o dnevnom limitu pitanja.'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchQuestionLimit();
  }, [user, onQuestionLimitReached, toast]);
  
  // Funkcija za inkrementiranje broja pitanja (poziva se nakon uspešnog postavljanja pitanja)
  const incrementUsedQuestions = () => {
    const newCount = usedQuestions + 1;
    setUsedQuestions(newCount);
    
    if (newCount >= maxQuestions) {
      setIsLimitReached(true);
      if (onQuestionLimitReached) {
        onQuestionLimitReached();
      }
    }
  };
  
  // Preskačemo prikaz za PRO korisnike
  if (user?.subscriptionType === 'pro') {
    return null;
  }
  
  // Prikazujemo učitavanje dok se podaci dohvaćaju
  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // Prikazujemo obaveštenje ako je limit dostignut
  if (isLimitReached) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dnevni limit pitanja dostugnut</AlertTitle>
        <AlertDescription className="mt-2">
          <p>Potrošili ste svih {maxQuestions} pitanja za danas. Limit će se resetovati u {resetTime}.</p>
          <div className="mt-4">
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
  
  // Prikazujemo progres ako limit nije dostignut
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <HelpCircle className="h-3 w-3 mr-1" /> 
          Preostala pitanja danas ({usedQuestions}/{maxQuestions})
        </div>
        {resetTime && (
          <div className="text-xs text-muted-foreground">
            Resetuje se u {resetTime}
          </div>
        )}
      </div>
      <Progress value={(usedQuestions / maxQuestions) * 100} className="h-2" />
    </div>
  );
}

// Eksportujemo funkciju za inkrementiranje broja pitanja kako bi mogla biti pozivana iz drugih komponenti
export function useDailyQuestionLimit() {
  const [instance, setInstance] = useState<{ incrementUsedQuestions: () => void } | null>(null);
  
  const registerInstance = (incrementFn: () => void) => {
    setInstance({ incrementUsedQuestions: incrementFn });
  };
  
  return {
    instance,
    registerInstance
  };
}