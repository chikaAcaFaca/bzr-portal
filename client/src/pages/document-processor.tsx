import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileTextIcon, Users, FileText, PanelTopCloseIcon, CopyCheck, Layers, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/page-header";

export default function DocumentProcessor() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("job-positions");
  const [documentText, setDocumentText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const { toast } = useToast();

  const processJobPositionsMutation = useMutation({
    mutationFn: (data: { documentText: string }) => {
      return apiRequest('/api/process/job-positions', 'POST', data);
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
    mutationFn: (data: { documentText: string }) => {
      return apiRequest('/api/process/employees', 'POST', data);
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
    mutationFn: (data: { documentText: string }) => {
      return apiRequest('/api/process/job-descriptions', 'POST', data);
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
      return apiRequest('/api/generate/risk-categories', 'POST', {});
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

  const handleSubmit = async () => {
    if (!documentText || documentText.trim() === "") {
      toast({
        title: "Nedostaje tekst dokumenta",
        description: "Molimo vas da unesete ili nalepite tekst dokumenta za obradu.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      switch (activeTab) {
        case "job-positions":
          await processJobPositionsMutation.mutateAsync({ documentText });
          break;
        case "employees":
          await processEmployeesMutation.mutateAsync({ documentText });
          break;
        case "job-descriptions":
          await processJobDescriptionsMutation.mutateAsync({ documentText });
          break;
        case "risk-categories":
          await generateRiskCategoriesMutation.mutateAsync();
          break;
        default:
          break;
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
        return "Nalepite tekst dokumenta koji sadrži sistematizaciju radnih mesta.";
      case "employees":
        return "Nalepite tekst dokumenta koji sadrži podatke o zaposlenima i njihovim radnim mestima.";
      case "job-descriptions":
        return "Nalepite tekst dokumenta koji sadrži detaljne opise poslova za radna mesta.";
      case "risk-categories":
        return "Automatski generišite kategorije rizika na osnovu postojećih radnih mesta u sistemu.";
      default:
        return "Obrada dokumenta pomoću AI.";
    }
  };

  return (
    <>
      <PageHeader
        title="AI Procesor Dokumenata"
        description="Automatska obrada i analiza dokumenata za bezbednost i zdravlje na radu"
      />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Izaberite tip dokumenta za obradu</CardTitle>
                <CardDescription>
                  Izaberite tip dokumenta i unesite tekst za automatsku ekstrakciju podataka
                </CardDescription>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
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
                <>
                  <div className="grid w-full gap-2">
                    <Label htmlFor="document-text">Tekst dokumenta</Label>
                    <Textarea
                      id="document-text"
                      placeholder="Nalepite tekst dokumenta koji želite da obradite..."
                      className="min-h-[200px]"
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                    />
                  </div>
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
              <Button variant="outline" onClick={() => setDocumentText("")}>
                Očisti
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || (activeTab !== "risk-categories" && (!documentText || documentText.trim() === ""))}
                className="flex items-center gap-2"
              >
                {getTabIcon()}
                <span>
                  {loading ? "Obrađujem..." : activeTab === "risk-categories" ? "Generiši kategorije" : "Obradi dokument"}
                </span>
              </Button>
            </CardFooter>
          </Tabs>
        </Card>

        {processingResults && processingResults.data && (
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
        )}
      </div>
    </>
  );
}