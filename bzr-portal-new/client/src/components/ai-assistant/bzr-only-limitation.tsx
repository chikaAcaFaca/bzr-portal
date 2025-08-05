import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Form } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const BZR_KEYWORDS = [
  'bezbednost', 'zdravlje', 'rad', 'zaštita', 'rizik', 'opasnost', 'povreda', 
  'nezgoda', 'pravila', 'zakon', 'propisi', 'obuka', 'trening', 'sigurnost', 
  'procena', 'mere', 'zaštitna', 'oprema', 'inspekcija', 'akt', 'procena rizika', 
  'ppe', 'lična zaštitna', 'primena', 'pravilnik', 'obaveze', 'radnog mesta', 
  'osposobljavanje', 'instrukcije', 'pružanje prve pomoći', 'prva pomoć', 
  'hitna pomoć', 'evakuacija', 'požar', 'protivpožarna', 'ventilacija', 'buka',
  'vibracije', 'zračenje', 'temperatura', 'ergonomija', 'hemikalije', 'materije',
  'otpad', 'inspektor', 'odgovornost', 'lice za bzr', 'licenca', 'provera', 
  'nadzor', 'prevencija', 'uputstva'
];

interface BZROnlyLimitationProps {
  onSubmit: (question: string) => void;
}

export function BZROnlyLimitation({ onSubmit }: BZROnlyLimitationProps) {
  const [question, setQuestion] = useState("");
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [isBzrRelated, setIsBzrRelated] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();
  
  // Reset state when user changes
  useEffect(() => {
    setChecked(false);
    setIsBzrRelated(null);
    setShowWarning(false);
  }, [user]);
  
  // Za PRO korisnike, ova komponenta ne ograničava pitanja
  if (user?.subscriptionType === 'pro') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea 
            placeholder="Unesite vaše pitanje ovde..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => onSubmit(question)} 
            disabled={!question.trim()}
          >
            Pošalji pitanje
          </Button>
        </div>
      </div>
    );
  }
  
  // Check if the question is related to BZR by keywords
  const checkIfBzrRelated = () => {
    if (!question.trim()) {
      toast({
        title: "Greška",
        description: "Molimo unesite pitanje",
        variant: "destructive"
      });
      return;
    }
    
    setChecked(true);
    const questionLower = question.toLowerCase();
    
    // Provera pitanja prema ključnim rečima BZR-a
    const containsBzrKeyword = BZR_KEYWORDS.some(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    
    setIsBzrRelated(containsBzrKeyword);
    
    if (containsBzrKeyword) {
      setShowWarning(false);
      onSubmit(question); // Prosleđujemo pitanje roditeljskoj komponenti
    } else {
      setShowWarning(true);
    }
  };
  
  // Prikaz forme za unos pitanja sa upozorenjem za FREE korisnike
  return (
    <div className="space-y-4">
      {!checked && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Ograničenje za FREE korisnike</AlertTitle>
          <AlertDescription>
            <p>FREE korisnici mogu koristiti AI asistenta samo za teme vezane za bezbednost i zdravlje na radu.</p>
          </AlertDescription>
        </Alert>
      )}
      
      {checked && showWarning && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pitanje nije vezano za BZR</AlertTitle>
          <AlertDescription className="mt-2">
            <p>Vaše pitanje nije prepoznato kao tema vezana za bezbednost i zdravlje na radu. FREE korisnici mogu postavljati samo pitanja vezana za BZR teme.</p>
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
      )}
      
      <div className="space-y-2">
        <Textarea 
          placeholder="Unesite vaše pitanje ovde..."
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            if (checked) {
              setChecked(false);
              setShowWarning(false);
            }
          }}
          className="min-h-[120px] resize-none"
        />
      </div>
      <div className="flex justify-end">
        <Button 
          onClick={checkIfBzrRelated}
          disabled={!question.trim()}
        >
          {checked && !showWarning ? 'Pošalji novo pitanje' : 'Proveri i pošalji pitanje'}
        </Button>
      </div>
    </div>
  );
}