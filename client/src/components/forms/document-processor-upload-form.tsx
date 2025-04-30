import { useState, useRef, ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
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
  const [processingResults, setProcessingResults] = useState<{
    success: boolean;
    message?: string;
    data?: any;
  } | null>(null);
  
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
        const response = await fetch(`/api/process/${activeTab}-file`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          let errorText = '';
          const contentType = response.headers.get('content-type');
          
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
          
          throw new Error(errorText || `HTTP greška: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server nije vratio JSON odgovor. Proverite podešavanja servera.');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Greška pri slanju zahteva:', error);
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
        const response = await fetch('/api/process/generate-risk-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          let errorText = '';
          const contentType = response.headers.get('content-type');
          
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
          
          throw new Error(errorText || `HTTP greška: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server nije vratio JSON odgovor. Proverite podešavanja servera.');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Greška pri slanju zahteva:', error);
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
        const response = await fetch(`/api/process/${activeTab}-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
          let errorText = '';
          const contentType = response.headers.get('content-type');
          
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
          
          throw new Error(errorText || `HTTP greška: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server nije vratio JSON odgovor. Proverite podešavanja servera.');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Greška pri slanju zahteva:', error);
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
                  <Button 
                    variant={textInputMode ? "outline" : "default"} 
                    size="sm"
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
                    onClick={() => {
                      setTextInputMode(true);
                      setFile(null);
                    }}
                  >
                    <span className="h-4 w-4 mr-2">T</span>
                    Unesi tekst
                  </Button>
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
                    accept=".txt,.doc,.docx,.pdf,.xls,.xlsx,.csv"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-primary/10 rounded-full">
                      {getTabIcon()}
                    </div>
                    <h3 className="text-lg font-medium">
                      Izaberite ili prevucite {getTabTitle().toLowerCase()} dokument
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Podržani formati: TXT (preporučeno), DOC, DOCX, PDF, XLS, XLSX, CSV
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
            <Alert variant={processingResults ? "default" : "destructive"} className={processingResults ? "bg-primary/10" : ""}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {processingResults
                  ? `${processingResults.message || "Obrada uspešna"}`
                  : "Važno upozorenje"}
              </AlertTitle>
              <AlertDescription>
                {processingResults
                  ? `AI je uspešno obradio dokument i ekstrahovao podatke.`
                  : activeTab === "risk-categories"
                  ? "Ova operacija će automatski generisati kategorije rizika na osnovu postojećih radnih mesta. Obavezno prvo unesite radna mesta!"
                  : "Obrada dokumenata može potrajati nekoliko sekundi. Molimo vas za strpljenje tokom obrade."}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setFile(null)}
            disabled={!file && activeTab !== "risk-categories"}
          >
            Očisti
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (activeTab !== "risk-categories" && !file)}
            className="flex items-center gap-2"
          >
            {getTabIcon()}
            <span>
              {loading ? "Obrađujem..." : activeTab === "risk-categories" ? "Generiši kategorije" : "Obradi dokument"}
            </span>
          </Button>
        </CardFooter>
      </Tabs>

      {processingResults && processingResults.data && (
        <CardContent className="pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Rezultati obrade</CardTitle>
              <CardDescription>
                AI je uspešno obradio vaš dokument i ekstrahovao sledeće podatke
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                {JSON.stringify(processingResults.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
}