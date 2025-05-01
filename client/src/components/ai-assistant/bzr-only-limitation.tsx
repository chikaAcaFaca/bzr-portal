import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

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
  
  useEffect(() => {
    // Resetuj stanje kada se pitanje promeni
    setChecked(false);
    setIsBzrRelated(null);
    setShowWarning(false);
  }, [question]);
  
  // Za PRO korisnike, ova komponenta nema efekta
  if (user?.subscriptionType === 'pro') {
    return null;
  }
  
  // Check if the question is related to BZR by keywords
  const checkIfBzrRelated = () => {
    setChecked(true);
    const questionLower = question.toLowerCase();
    
    // Provera pitanja prema ključnim rečima BZR-a
    const containsBzrKeyword = BZR_KEYWORDS.some(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    
    setIsBzrRelated(containsBzrKeyword);
    
    if (containsBzrKeyword) {
      setShowWarning(false);
      onValidQuestion();
    } else {
      setShowWarning(true);
      onInvalidQuestion();
    }
  };
  
  // Ako pitanje nije provereno, onda samo prikaži info poruku
  if (!checked) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Ograničenje za FREE korisnike</AlertTitle>
        <AlertDescription className="mt-2">
          <p>FREE korisnici mogu koristiti AI asistenta samo za teme vezane za bezbednost i zdravlje na radu.</p>
          <div className="mt-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={checkIfBzrRelated}
              disabled={!question.trim()}
            >
              Proveri pitanje
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Ako je pitanje provereno i nije BZR-vezano, prikaži upozorenje
  if (checked && showWarning) {
    return (
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
    );
  }
  
  // Ako je pitanje provereno i jeste BZR-vezano, ne prikazuj ništa (ili samo malu potvrdu)
  return null;
}