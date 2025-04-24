import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Upload, FileTextIcon, Users, FileText, PanelTopCloseIcon, Layers } from "lucide-react";

export function DocumentProcessorUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("job-positions");
  const [processingResults, setProcessingResults] = useState<any>(null);
  const { toast } = useToast();

  const identifyDocumentType = (fileName: string): string => {
    const lowerCaseName = fileName.toLowerCase();
    
    if (lowerCaseName.includes("sistematizacija") && !lowerCaseName.includes("imen")) {
      return "job-positions"; // Sistematizacija bez imena
    } else if (lowerCaseName.includes("imen") || lowerCaseName.includes("zaposlen")) {
      return "employees"; // Sistematizacija sa imenima ili zaposleni
    } else if (lowerCaseName.includes("opis") || lowerCaseName.includes("posl")) {
      return "job-descriptions"; // Opis poslova
    }
    
    return activeTab; // Zadržava trenutni tab ako nije prepoznato
  };

  const processJobPositionsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/process/job-positions-file', formData, true);
    },
    onSuccess: (data: any) => {
      setProcessingResults(data);
      toast({
        title: "Obrada uspešna",
        description: data.message || "Dokument o sistematizaciji radnih mesta je uspešno obrađen.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-positions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Greška pri obradi",
        description: error.message || "Došlo je do greške prilikom obrade dokumenta.",
        variant: "destructive",
      });
    }
  });

  const processEmployeesMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/process/employees-file', formData, true);
    },
    onSuccess: (data: any) => {
      setProcessingResults(data);
      toast({
        title: "Obrada uspešna",
        description: data.message || "Dokument o zaposlenima je uspešno obrađen.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: any) => {
      toast({
        title: "Greška pri obradi",
        description: error.message || "Došlo je do greške prilikom obrade dokumenta.",
        variant: "destructive",
      });
    }
  });

  const processJobDescriptionsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/process/job-descriptions-file', formData, true);
    },
    onSuccess: (data: any) => {
      setProcessingResults(data);
      toast({
        title: "Obrada uspešna",
        description: data.message || "Dokument o opisima poslova je uspešno obrađen.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-descriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Greška pri obradi",
        description: error.message || "Došlo je do greške prilikom obrade dokumenta.",
        variant: "destructive",
      });
    }
  });

  const generateRiskCategoriesMutation = useMutation({
    mutationFn: () => {
      return apiRequest('POST', '/api/generate/risk-categories', {});
    },
    onSuccess: (data: any) => {
      setProcessingResults(data);
      toast({
        title: "Kategorizacija uspešna",
        description: data.message || "Kategorije rizika su uspešno generisane.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/risk-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Greška pri kategorizaciji",
        description: error.message || "Došlo je do greške prilikom kategorizacije rizika.",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Automatski prepoznaj tip dokumenta prema imenu fajla
      const detectedType = identifyDocumentType(selectedFile.name);
      setActiveTab(detectedType);
    }
  };

  const handleSubmit = async () => {
    if (!file && activeTab !== "risk-categories") {
      toast({
        title: "Dokument nije izabran",
        description: "Molimo vas da izaberete dokument za obradu.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "risk-categories") {
        await generateRiskCategoriesMutation.mutateAsync();
      } else {
        const formData = new FormData();
        formData.append("file", file as File);
        
        switch (activeTab) {
          case "job-positions":
            await processJobPositionsMutation.mutateAsync(formData);
            break;
          case "employees":
            await processEmployeesMutation.mutateAsync(formData);
            break;
          case "job-descriptions":
            await processJobDescriptionsMutation.mutateAsync(formData);
            break;
          default:
            break;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setProcessingResults(null);
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case "job-positions":
        return <PanelTopCloseIcon className="h-5 w-5" />;
      case "employees":
        return <Users className="h-5 w-5" />;
      case "job-descriptions":
        return <FileText className="h-5 w-5" />;
      case "risk-categories":
        return <Layers className="h-5 w-5" />;
      default:
        return <FileTextIcon className="h-5 w-5" />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "job-positions":
        return "Obrada sistematizacije radnih mesta";
      case "employees":
        return "Obrada podataka o zaposlenima";
      case "job-descriptions":
        return "Obrada opisa poslova";
      case "risk-categories":
        return "Generisanje kategorija rizika";
      default:
        return "Obrada dokumenata";
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case "job-positions":
        return "Upload dokumenta koji sadrži sistematizaciju radnih mesta.";
      case "employees":
        return "Upload dokumenta koji sadrži podatke o zaposlenima i njihovim radnim mestima.";
      case "job-descriptions":
        return "Upload dokumenta koji sadrži detaljne opise poslova za radna mesta.";
      case "risk-categories":
        return "Automatski generišite kategorije rizika na osnovu postojećih radnih mesta u sistemu.";
      default:
        return "Upload dokumenta za obradu pomoću AI.";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload i automatska obrada dokumenata</CardTitle>
        <CardDescription>
          Otpremite dokument i sistem će ga automatski obraditi. Tip dokumenta se prepoznaje na osnovu imena.
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mx-6">
          <TabsTrigger value="job-positions" className="flex items-center gap-2">
            <PanelTopCloseIcon className="h-4 w-4" />
            <span>Sistematizacija</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Zaposleni</span>
          </TabsTrigger>
          <TabsTrigger value="job-descriptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Opisi poslova</span>
          </TabsTrigger>
          <TabsTrigger value="risk-categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Kategorije rizika</span>
          </TabsTrigger>
        </TabsList>

        <CardContent className="pt-6">
          <div className="mb-4">
            <Alert>
              <FileTextIcon className="h-4 w-4" />
              <AlertTitle>{getTabTitle()}</AlertTitle>
              <AlertDescription>{getTabDescription()}</AlertDescription>
            </Alert>
          </div>

          {activeTab !== "risk-categories" && (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="document-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Kliknite za otpremanje</span> ili prevucite dokument ovde
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOCX, XLSX, PPTX, TXT (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    id="document-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt"
                  />
                </label>
              </div>
              
              {file && (
                <div className="border rounded-md p-4 bg-primary/5">
                  <FileTextIcon className="h-4 w-4" />
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
                        onClick={() => setFile(null)}
                      >
                        Ukloni
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
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