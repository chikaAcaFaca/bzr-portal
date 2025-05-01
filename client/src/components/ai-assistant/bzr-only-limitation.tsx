import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Send, ArrowUp } from "lucide-react";

type BZROnlyLimitationProps = {
  onSubmit: (question: string) => void;
};

/**
 * Komponenta koja ograničava FREE korisnike samo na BZR pitanja
 * Koristi jednostavnu proveru da li je pitanje vezano za BZR
 */
export function BZROnlyLimitation({ onSubmit }: BZROnlyLimitationProps) {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Funkcija koja proverava da li je pitanje vezano za bezbednost i zdravlje na radu
  function isBZRRelated(text: string): boolean {
    const text_lower = text.toLowerCase();
    
    // Lista ključnih pojmova vezanih za BZR
    const bzrKeywords = [
      "bezbednost", "zdravlje", "rad", "rizik", "opasnost", "povrede", "zaštita",
      "oprema", "obuka", "zakon", "pravilnik", "propis", "mera", "procena",
      "nezgoda", "nesreća", "inspekcija", "kontrola", "audit", "pregled",
      "btzbr", "bzr", "upozorenje", "zop", "akt", "provera", "osposobljavanje",
      "evakuacija", "prve pomoći", "protivpožarne", "zaštitna oprema", "štetan",
      "opasan", "licenca", "ispit", "obuka", "požar", "eksplozija", "lice za bzr",
      "zaštita od požara", "pravilnik", "zakon o bezbednosti", "službeni glasnik",
      "elaborat", "identifikacija", "mere za smanjenje rizika"
    ];
    
    // Proveravamo da li pitanje sadrži neku od ključnih reči
    return bzrKeywords.some(keyword => text_lower.includes(keyword));
  }
  
  // Handler za slanje pitanja
  const handleSubmit = () => {
    // Resetujemo prethodno stanje greške
    setError(null);
    
    // Ako je korisnik PRO, može da postavlja sva pitanja
    if (user?.subscriptionType === 'pro') {
      onSubmit(question);
      setQuestion("");
      return;
    }
    
    // Ako je FREE korisnik, proveravamo da li je pitanje vezano za BZR
    if (isBZRRelated(question)) {
      onSubmit(question);
      setQuestion("");
    } else {
      setError("Kao FREE korisnik, možete postavljati samo pitanja vezana za bezbednost i zdravlje na radu. Ažurirajte na PRO za neograničen pristup AI asistentu.");
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ograničenje pitanja</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white text-primary border-primary hover:bg-primary hover:text-white"
              onClick={() => window.location.href = "/settings"}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Nadogradi na PRO
            </Button>
          </div>
        </Alert>
      )}
      
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Postavite pitanje vezano za BZR..."
          className="min-h-[120px] resize-none"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        
        <div className="flex justify-between items-center">
          {user?.subscriptionType !== 'pro' && (
            <div className="text-sm text-muted-foreground">
              {user?.subscriptionType === 'free' ? "FREE korisnici: samo BZR pitanja" : ""}
            </div>
          )}
          
          <Button 
            onClick={handleSubmit} 
            disabled={!question.trim()}
            className="ml-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            Pošalji
          </Button>
        </div>
      </div>
    </div>
  );
}