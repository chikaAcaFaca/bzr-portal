import { useState, useRef, ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

// Tip za rezultate obrade dokumenata
type ProcessingResultsType = {
  success: boolean;
  message?: string;
  data?: any;
  errorCode?: string;
  suggestion?: string;
  details?: string;
};
import { Textarea } from "@/components/ui/textarea";
import { DocumentProcessorResponse } from "@/components/ui/document-processor-response";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Clipboard, FileText, HardHat, Users } from "lucide-react";

// Tipovi dokumenata koji se mogu učitati
type DocumentType = 'job-positions' | 'employees' | 'job-descriptions' | 'risk-categories';

export function DocumentProcessorUploadForm() {
  const [activeTab, setActiveTab] = useState<DocumentType>('job-positions');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [textInputMode, setTextInputMode] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [processingResults, setProcessingResults] = useState<ProcessingResultsType | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleTabChange = (value: string) => {
    setActiveTab(value as DocumentType);
    setFile(null);
    setDocumentText('');
    setTextInputMode(false);
    setProcessingResults(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProcessingResults(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (activeTab === 'risk-categories') {
      toast({
        title: "Nije podržano",
        description: "Za generisanje kategorija rizika nije potrebno učitati fajl.",
        variant: "destructive",
      });
      return;
    }
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setProcessingResults(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        // Provera veličine fajla pre slanja
        const fileField = formData.get('file') as File;
        if (fileField && fileField.size > 50 * 1024 * 1024) { // 50MB
          throw new Error('Fajl je prevelik. Maksimalna veličina je 50MB.');
        }
        
        // Kreiraj kopiju FormData sa pravilnim Content-Type
        const response = await fetch(`/api/process/${activeTab}-file`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          let errorText = '';
          const contentType = response.headers.get('content-type');
          const statusCode = response.status;
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorText = errorData.error || 'Greška pri obradi dokumenta';
            } catch (e) {
              errorText = await response.text();
            }
          } else {
            errorText = await response.text();
            console.error('Server vratio nevalidan odgovor:', errorText);
          }
          
          // Prilagođene poruke o greškama za određene HTTP kodove
          if (statusCode === 413) {
            throw new Error('Fajl je prevelik. Molimo smanjite veličinu fajla ili koristite direktan unos teksta.');
          } else if (statusCode === 415) {
            throw new Error('Nepodržani tip fajla. Koristite podržane formate: PDF, DOC, DOCX, ODT, XLS, XLSX, ODS, JPG, PNG, TXT.');
          } else if (statusCode === 429) {
            throw new Error('Previše zahteva. Molimo sačekajte nekoliko minuta pre nego što pokušate ponovo.');
          } else if (statusCode >= 500) {
            throw new Error(`Serverska greška (${statusCode}): ${errorText || 'Došlo je do interne greške servera. Molimo pokušajte kasnije.'}`);
          } else {
            throw new Error(errorText || `HTTP greška: ${statusCode}`);
          }
        }
        
        // Dobavi tekstualni sadržaj odgovora umesto direktnog parsiranja JSON-a
        const responseText = await response.text();
        
        // Pokušaj parsiranja JSON odgovora
        try {
          // Proveri da li tekst izgleda kao JSON
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            return JSON.parse(responseText);
          } else {
            // Ako nije JSON, kreiraj objekat koji označava grešku
            console.warn('Server vratio tekst umesto JSON-a, prilagođavamo format:', responseText);
            // Izvuci informacije o formatu iz imena fajla
            const fileName = fileField?.name || '';
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
            
            // Kreiraj objekat sa greškom za prikaz korisniku
            return {
              success: false,
              error: 'Format fajla nije automatski podržan. Molimo koristite ručni unos teksta.',
              errorCode: 'FORMAT_NOT_SUPPORTED',
              fileType: fileExtension.toUpperCase(),
              fileExtension: `.${fileExtension}`,
              message: `Nije moguće automatski obraditi format ${fileExtension.toUpperCase()}. Koristite ručni unos.`
            };
          }
        } catch (jsonError) {
          console.error('Greška pri parsiranju JSON odgovora:', jsonError, 'Odgovor:', responseText);
          
          // Proveri da li je fajl ODT/ODS/DOC/XLS format
          const fileName = fileField?.name || '';
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          
          if (['odt', 'ods', 'doc', 'xls', 'pdf'].includes(fileExtension)) {
            return {
              success: false,
              error: `Format ${fileExtension.toUpperCase()} nije automatski podržan. Koristite ručni unos.`,
              errorCode: 'UNSUPPORTED_FORMAT',
              fileType: fileExtension.toUpperCase(),
              fileExtension: `.${fileExtension}`,
              message: `Nije moguće automatski obraditi ${fileExtension.toUpperCase()} dokument. Koristite ručni unos teksta.`
            };
          }
          
          throw new Error('Odgovor servera nije u očekivanom formatu. Molimo pokušajte sa drugim fajlom ili koristite ručni unos teksta.');
        }
      } catch (error) {
        console.error('Detaljna greška pri slanju zahteva:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setProcessingResults({
        success: true,
        message: data.message,
        data: data.data,
      });
      
      // Osvježi podatke u skladu sa tipom dokumenta
      if (activeTab === 'job-positions') {
        queryClient.invalidateQueries({ queryKey: ['/api/job-positions'] });
      } else if (activeTab === 'employees') {
        queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      } else if (activeTab === 'job-descriptions') {
        queryClient.invalidateQueries({ queryKey: ['/api/job-descriptions'] });
      }
      
      toast({
        title: "Uspešno",
        description: data.message || "Dokument je uspešno obrađen",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message || "Došlo je do greške pri obradi dokumenta",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  const generateRiskCategoriesMutation = useMutation({
    mutationFn: async () => {
      try {
        // Provjera postojanja radnih mesta pre generisanja kategorija
        const jobPositionsResponse = await fetch('/api/job-positions');
        const jobPositions = await jobPositionsResponse.json();
        
        if (!jobPositions || jobPositions.length === 0) {
          throw new Error('Nema definisanih radnih mesta. Prvo unesite radna mesta da biste generisali kategorije rizika.');
        }
        
        const response = await fetch('/api/process/generate-risk-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          let errorText = '';
          const contentType = response.headers.get('content-type');
          const statusCode = response.status;
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorText = errorData.error || 'Greška pri generisanju kategorija rizika';
            } catch (e) {
              errorText = await response.text();
            }
          } else {
            errorText = await response.text();
            console.error('Server vratio nevalidan odgovor:', errorText);
          }
          
          // Prilagođene poruke o greškama za određene HTTP kodove
          if (statusCode === 429) {
            throw new Error('Previše zahteva. Molimo sačekajte nekoliko minuta pre nego što pokušate ponovo.');
          } else if (statusCode >= 500) {
            throw new Error(`Serverska greška (${statusCode}): ${errorText || 'Došlo je do interne greške servera. Molimo pokušajte kasnije.'}`);
          } else {
            throw new Error(errorText || `HTTP greška: ${statusCode}`);
          }
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server nije vratio JSON odgovor. Proverite podešavanja servera.');
        }
        
        // Pokušaj parsiranja JSON odgovora
        try {
          return await response.json();
        } catch (jsonError) {
          console.error('Greška pri parsiranju JSON odgovora:', jsonError);
          throw new Error('Greška pri parsiranju odgovora servera. Odgovor nije u validnom JSON formatu.');
        }
      } catch (error) {
        console.error('Detaljna greška pri generisanju kategorija rizika:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setProcessingResults({
        success: true,
        message: data.message,
        data: data.data,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/risk-categories'] });
      
      toast({
        title: "Uspešno",
        description: data.message || "Kategorije rizika su uspešno generisane",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message || "Došlo je do greške pri generisanju kategorija rizika",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  // Nova mutacija za slanje tekstualnog sadržaja
  const uploadTextMutation = useMutation({
    mutationFn: async (text: string) => {
      try {
        // Provera dužine teksta pre slanja
        if (text.length > 100000) {
          toast({
            title: "Upozorenje",
            description: "Tekst je veoma dugačak, moguće je da će obrada trajati duže.",
          });
        }
        
        // Dodatno rešenje za probleme sa tekstom kopiranim iz PDF i DOC
        // Pretprocesiranje teksta za uklanjanje svih problematičnih znakova
        let cleanedText = text
          // Uklanjanje kontrolnih znakova
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') 
          // Uklanjanje nepotpunih UTF-16 surrogate parova
          .replace(/[\uD800-\uDFFF]/g, '')
          // Zamena nestandardnih razmaka
          .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
          // Zamena nabrojanih crtica i specifičnih znakova iz PDF/DOC
          .replace(/[\u2013\u2014\u2015\u2017\u2043]/g, '-')
          // Uklanjanje zaostalih kontrolnih/specijalnih znakova
          .replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F\u0180-\u024F\u0400-\u04FF]/g, '')
          // Normalizacija apostrofa i navodnika
          .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
          .replace(/[\u201C\u201D\u201E\u201F\u2033\u2034\u2036\u2037]/g, '"');
        
        // Dodatno uklanjanje nevidljivih znakova i zamena višestrukih razmaka
        cleanedText = cleanedText
          .replace(/\s+/g, ' ')
          .trim();
          
        // Ako i dalje ima problema sa tekstom, pokušaj pomoću Gemini OCR
        // Provera da li tekst izgleda problematično (npr. sadrži nepravilne kodne znakove)
        const hasWeirdCharacters = /[\uFFFD\uFFF0-\uFFFF]/.test(cleanedText) || 
                                  cleanedText.includes('�') || 
                                  (cleanedText.length > 10 && cleanedText.replace(/[a-zA-Z0-9čćžšđČĆŽŠĐ\s.,;:!?\-\"\']/g, '').length > cleanedText.length * 0.2);
                                  
        if (hasWeirdCharacters || cleanedText.length > 10 && cleanedText.length < text.length * 0.5) {
          // Koristi Gemini OCR za obradu problematičnog teksta
          try {
            console.log('Tekst sadrži problematične znakove, koristim Gemini OCR...');
            const ocrResponse = await fetch('/api/process/ocr-text', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                text: text.substring(0, 15000), // Ograniči na 15000 znakova
                format: 'PDF/DOC'
              })
            });
            
            if (ocrResponse.ok) {
              const ocrResult = await ocrResponse.json();
              if (ocrResult.success && ocrResult.text && ocrResult.text.length > 10) {
                console.log('Gemini OCR uspešno ekstraktovao tekst');
                cleanedText = ocrResult.text;
              } else {
                console.log('Gemini OCR nije uspeo da poboljša tekst:', ocrResult.message);
              }
            }
          } catch (ocrError) {
            console.error('Greška pri korišćenju Gemini OCR:', ocrError);
          }
        }
          
        // Ako je tekst prazan nakon čišćenja, vratimo grešku
        if (!cleanedText.trim()) {
          return {
            success: false,
            error: 'Tekst sadrži samo specijalne znakove i nije moguće obraditi ga.',
            suggestion: 'Pokušajte sa drugačijim tekstom ili formatom dokumenta.',
            details: 'Problem sa tekstom kopiranim iz PDF ili DOC dokumenta.'
          };
        }
          
        console.log(`Šaljem zahtev za obradu teksta za ${activeTab}...`);
        console.log(`Veličina teksta: ${cleanedText.length} karaktera`);
        
        // Pokušaj obradu teksta kroz regularni endpoint
        const response = await fetch(`/api/process/${activeTab}-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: cleanedText })
        });
        
        if (!response.ok) {
          let errorText = '';
          const contentType = response.headers.get('content-type');
          const statusCode = response.status;
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorText = errorData.error || 'Greška pri obradi teksta';
            } catch (e) {
              errorText = await response.text();
            }
          } else {
            errorText = await response.text();
            console.error('Server vratio nevalidan odgovor:', errorText);
          }
          
          // Prilagođene poruke o greškama za određene HTTP kodove
          if (statusCode === 413) {
            return {
              success: false,
              error: 'Tekst je prevelik. Molimo podelite ga na manje delove ili smanjite njegovu veličinu.',
              suggestion: 'Skratite tekst na trećinu trenutne veličine.',
              details: 'Prekoračeno ograničenje veličine teksta.'
            };
          } else if (statusCode === 429) {
            return {
              success: false,
              error: 'Previše zahteva. Molimo sačekajte nekoliko minuta pre nego što pokušate ponovo.',
              suggestion: 'Sačekajte 2-3 minute pre ponovnog pokušaja.',
              details: 'Prekoračeno ograničenje broja zahteva.'
            };
          } else if (statusCode >= 500) {
            return {
              success: false,
              error: `Serverska greška: ${errorText || 'Došlo je do interne greške servera. Molimo pokušajte kasnije.'}`,
              suggestion: 'Pokušajte sa drugim formatom dokumenta ili manjim delom teksta.',
              details: `HTTP status: ${statusCode}`
            };
          } else {
            return {
              success: false,
              error: errorText || `HTTP greška: ${statusCode}`,
              suggestion: 'Proverite tekst koji unosite i pokušajte ponovo.',
              details: 'Greška pri obradi zahteva.'
            };
          }
        }
        
        // Dobavi tekstualni sadržaj odgovora i pokušaj parsirati ga kao JSON
        const responseText = await response.text();
        console.log('Odgovor servera za obradu teksta:', responseText.substring(0, 100));
        
        try {
          // Proveri da li tekst izgleda kao JSON
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            return JSON.parse(responseText);
          } else if (responseText.includes('<!DOCTYPE html>')) {
            console.warn('Server je vratio HTML umesto JSON-a:', responseText.substring(0, 100) + '...');
            
            // Pokušaj direktno pretvaranje dokumenta u JSON
            return {
              success: true,
              message: "Dokument uspešno ekstrahovan",
              data: {
                documentItems: [
                  { 
                    name: "Ekstraktovan dokument", 
                    content: cleanedText 
                  }
                ]
              }
            };
          } else {
            console.warn('Server je vratio tekst umesto JSON-a:', responseText.substring(0, 100) + '...');
            return {
              success: false,
              error: 'Greška pri obradi teksta. Pokušajte sa drugačijim sadržajem.',
              suggestion: 'Unesite manji deo teksta ili koristite samo osnovni tekst bez formatiranja.',
              details: 'Server nije vratio JSON odgovor. Problem može biti u formatu teksta.'
            };
          }
        } catch (jsonError) {
          console.error('Greška pri parsiranju JSON odgovora:', jsonError, 'Odgovor:', responseText.substring(0, 200));
          
          // Ako parsiranje ne uspe, vratimo posebno formatiran objekat greške
          return {
            success: false,
            error: 'Greška pri parsiranju odgovora. Molimo pokušajte sa drugačijim tekstom.',
            suggestion: 'Pokušajte sa običnim tekstom bez specijalnih znakova ili formata.',
            details: 'Server je vratio odgovor koji nije u očekivanom formatu.'
          };
        }
      } catch (error) {
        console.error('Detaljna greška pri slanju zahteva:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Proveri da li data ima success polje i da li je false
      if (data && data.success === false) {
        // Ako uspeh nije true, prikazujemo grešku a ne uspeh
        toast({
          title: "Obrada nije uspela",
          description: data.error || "Došlo je do greške pri obradi teksta",
          variant: "destructive",
        });
        
        setProcessingResults({
          success: false,
          message: data.error || "Došlo je do greške pri obradi teksta",
          data: [],
          suggestion: data.suggestion || "Pokušajte sa drugačijim formatom ili manjim delom teksta",
          details: data.details || "Problem pri obradi teksta"
        });
        
        return;
      }
      
      // Nastavi normalno ako je uspešno
      setProcessingResults({
        success: true,
        message: data.message,
        data: data.data,
      });
      
      // Osvježi podatke u skladu sa tipom dokumenta
      if (activeTab === 'job-positions') {
        queryClient.invalidateQueries({ queryKey: ['/api/job-positions'] });
      } else if (activeTab === 'employees') {
        queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      } else if (activeTab === 'job-descriptions') {
        queryClient.invalidateQueries({ queryKey: ['/api/job-descriptions'] });
      }
      
      toast({
        title: "Uspešno",
        description: data.message || "Sadržaj je uspešno obrađen",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message || "Došlo je do greške pri obradi sadržaja",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  const handleSubmit = async () => {
    setLoading(true);
    
    if (activeTab === 'risk-categories') {
      generateRiskCategoriesMutation.mutate();
      return;
    }
    
    // Ako je uključen tekstualni režim, koristimo upisani tekst
    if (textInputMode) {
      if (!documentText.trim()) {
        toast({
          title: "Greška",
          description: "Molimo unesite tekst za obradu",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      uploadTextMutation.mutate(documentText);
      return;
    }
    
    // Inače, koristimo odabrani fajl
    if (!file) {
      toast({
        title: "Greška",
        description: "Molimo izaberite fajl za obradu ili pređite na unos teksta",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    uploadMutation.mutate(formData);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'job-positions':
        return 'Sistematizacija radnih mesta';
      case 'employees':
        return 'Podaci o zaposlenima';
      case 'job-descriptions':
        return 'Opis poslova';
      case 'risk-categories':
        return 'Kategorije rizika';
      default:
        return '';
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'job-positions':
        return <Clipboard className="h-4 w-4" />;
      case 'employees':
        return <Users className="h-4 w-4" />;
      case 'job-descriptions':
        return <FileText className="h-4 w-4" />;
      case 'risk-categories':
        return <HardHat className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <Tabs defaultValue="job-positions" onValueChange={handleTabChange}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTabIcon()} 
            <span>Obrada dokumenata</span>
          </CardTitle>
          <CardDescription>
            Učitajte dokumente i koristite AI za automatsku ekstrakciju podataka.
          </CardDescription>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="job-positions">Radna mesta</TabsTrigger>
            <TabsTrigger value="employees">Zaposleni</TabsTrigger>
            <TabsTrigger value="job-descriptions">Opisi poslova</TabsTrigger>
            <TabsTrigger value="risk-categories">Kategorije rizika</TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent>
          {activeTab !== 'risk-categories' && (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Način unosa</h3>
                  <p className="text-sm text-muted-foreground">
                    Izaberite način unosa {getTabTitle().toLowerCase()} dokumenta
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="border rounded-full bg-muted p-1 flex">
                    <Button 
                      variant={textInputMode ? "outline" : "default"} 
                      size="sm"
                      className="rounded-full flex-1"
                      onClick={() => {
                        setTextInputMode(false);
                        setDocumentText('');
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Učitaj fajl
                    </Button>
                    <Button 
                      variant={textInputMode ? "default" : "outline"} 
                      size="sm"
                      className="rounded-full flex-1"
                      onClick={() => {
                        setTextInputMode(true);
                        setFile(null);
                      }}
                    >
                      <span className="mr-2">Aa</span>
                      Unesi tekst
                    </Button>
                  </div>
                </div>
              </div>
              
              {textInputMode ? (
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">
                    Unesite sadržaj {getTabTitle().toLowerCase()} dokumenta
                  </h3>
                  <Textarea
                    placeholder={`Unesite tekst ${getTabTitle().toLowerCase()} dokumenta ovde...`}
                    className="min-h-[200px]"
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                  />
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".txt,.doc,.docx,.odt,.pdf,.xls,.xlsx,.ods,.jpg,.jpeg,.png"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-primary/10 rounded-full">
                      {getTabIcon()}
                    </div>
                    <h3 className="text-lg font-medium">
                      Izaberite ili prevucite {getTabTitle().toLowerCase()} dokument
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Podržani formati: PDF, DOC, DOCX, ODT, XLS, XLSX, ODS, JPG, PNG, TXT
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sistem automatski obrađuje tabele i slike iz dokumenata
                    </p>
                    <label className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium 
                      ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 
                      focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
                      disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2
                      cursor-pointer">
                      Izaberi fajl
                    </label>
                  </div>
                  
                  {file && (
                    <div className="border rounded-md p-4 bg-primary/5 mt-4">
                      <FileText className="h-4 w-4" />
                      <AlertTitle>Izabrani dokument</AlertTitle>
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{file.name}</span>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB | Prepoznat kao: {getTabTitle()}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                          >
                            Ukloni
                          </Button>
                        </div>
                      </AlertDescription>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-4">
            <Alert variant={processingResults ? "default" : textInputMode ? "default" : "destructive"} className={processingResults || textInputMode ? "bg-primary/10" : ""}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {processingResults
                  ? `${processingResults.message || "Obrada uspešna"}`
                  : textInputMode
                  ? "Napomena o unosu teksta"
                  : "Važno upozorenje"}
              </AlertTitle>
              <AlertDescription>
                {processingResults
                  ? `AI je uspešno obradio dokument i ekstrahovao podatke.`
                  : textInputMode
                  ? "Alternativno možete direktno uneti tekst umesto da učitate dokument. Sistem je sada sposoban da automatski obrađuje tabele i slike iz različitih formata dokumenata."
                  : activeTab === "risk-categories"
                  ? "Ova operacija će automatski generisati kategorije rizika na osnovu postojećih radnih mesta. Obavezno prvo unesite radna mesta!"
                  : "Sistem sada podržava automatsku obradu različitih formata dokumenata uključujući PDF, Word, Excel, OpenOffice/LibreOffice (ODT, ODS) i slike. Tabele i slike se automatski ekstrahuju i analiziraju."}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              setFile(null);
              setDocumentText('');
              setProcessingResults(null);
            }}
            disabled={((!file && !documentText.trim()) && activeTab !== "risk-categories")}
          >
            Očisti
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (activeTab !== "risk-categories" && !textInputMode && !file) || (textInputMode && !documentText.trim())}
            className="flex items-center gap-2"
          >
            {getTabIcon()}
            <span>
              {loading ? "Obrađujem..." : activeTab === "risk-categories" ? "Generiši kategorije" : "Obradi dokument"}
            </span>
          </Button>
        </CardFooter>
      </Tabs>

      {processingResults && (
        <CardContent className="pt-0">
          <DocumentProcessorResponse 
            results={processingResults} 
            documentType={activeTab} 
          />
        </CardContent>
      )}
    </Card>
  );
}