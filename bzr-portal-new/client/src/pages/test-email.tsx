import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Info, Mail } from 'lucide-react';

export default function TestEmail() {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [emailServices, setEmailServices] = useState<{
    resend: boolean;
    supabase: boolean;
    active: string;
    activeWithFallback: boolean;
  } | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const { toast } = useToast();
  
  // Učitavanje statusa email servisa
  useEffect(() => {
    const fetchEmailServices = async () => {
      setLoadingServices(true);
      try {
        const response = await apiRequest('GET', '/api/questionnaire/test-email?checkOnly=true');
        if (response.ok) {
          const data = await response.json();
          setEmailServices(data.emailServices || null);
        }
      } catch (error) {
        console.error('Greška pri učitavanju statusa email servisa:', error);
      } finally {
        setLoadingServices(false);
      }
    };
    
    fetchEmailServices();
  }, []);

  const handleTestEmail = async () => {
    if (!emailAddress) {
      toast({
        title: "Greška",
        description: "Unesite email adresu za testiranje",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const response = await apiRequest('GET', `/api/questionnaire/test-email?email=${emailAddress}`);
      
      setTestResult({
        provider: 'Email',
        success: response.ok,
        data: await response.json()
      });
      
      toast({
        title: response.ok ? "Uspeh" : "Greška",
        description: response.ok 
          ? `Test email uspešno poslat na ${emailAddress}` 
          : `Greška pri slanju test emaila`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error('Greška pri testiranju email servisa:', error);
      setTestResult({
        provider: 'Email',
        success: false,
        error: error.message
      });
      
      toast({
        title: "Greška",
        description: `Greška pri testiranju email servisa: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleTestQuestionnaire = async () => {
    if (!emailAddress) {
      toast({
        title: "Greška",
        description: "Unesite email adresu za testiranje",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const testData = {
        email: emailAddress,
        companyName: "Test Kompanija d.o.o.",
        fullName: "Test Korisnik",
        result: {
          qualified: true,
          message: "Vaša kompanija se kvalifikuje prema Članu 47!",
          recommendations: [
            "Polaganje stručnog ispita za poslove BZR",
            "Izrada kompletne BZR dokumentacije"
          ]
        }
      };

      const response = await apiRequest('POST', '/api/questionnaire/send-results', testData);
      const responseData = await response.json();
      
      setTestResult({
        provider: 'Questionnaire',
        success: response.ok,
        data: responseData
      });
      
      toast({
        title: response.ok ? "Uspeh" : "Greška",
        description: response.ok 
          ? `Test rezultati upitnika poslati na ${emailAddress}` 
          : `Greška pri slanju rezultata upitnika`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error('Greška pri testiranju slanja rezultata upitnika:', error);
      setTestResult({
        provider: 'Questionnaire',
        success: false,
        error: error.message
      });
      
      toast({
        title: "Greška",
        description: `Greška pri testiranju slanja rezultata upitnika: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const loadLocalResults = async () => {
    setLoadingResults(true);
    try {
      const response = await apiRequest('GET', '/api/questionnaire/results');
      
      if (response.ok) {
        const data = await response.json();
        setLocalResults(data.results || []);
      } else {
        toast({
          title: "Greška",
          description: "Greška pri učitavanju lokalnih rezultata",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Greška pri učitavanju lokalnih rezultata:', error);
      toast({
        title: "Greška",
        description: `Greška pri učitavanju lokalnih rezultata: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingResults(false);
    }
  };

  // Komponenta za prikaz statusa email servisa
  const EmailServiceStatus = () => {
    if (loadingServices) {
      return (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span>Učitavanje informacija o email servisu...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!emailServices) {
      return (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Nije moguće dobiti informacije o email servisu.</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Status Email Servisa
          </CardTitle>
          <CardDescription>
            Pregled dostupnih servisa za slanje emailova
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Resend</h3>
              <div className="flex items-center gap-2">
                {emailServices.resend ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Dostupan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> Nije dostupan
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Supabase</h3>
              <div className="flex items-center gap-2">
                {emailServices.supabase ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Dostupan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> Nije dostupan
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Aktivni servis:</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {emailServices.active}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Fallback mehanizam:</h3>
              {emailServices.activeWithFallback ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" /> Aktivan
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Info className="h-3 w-3 mr-1" /> Neaktivan
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Test Email Funkcionalnosti</h1>
      
      <EmailServiceStatus />
      
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Slanje Test Emaila</TabsTrigger>
          <TabsTrigger value="local">Lokalni Rezultati</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testiranje slanja emaila</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email adresa za testiranje</Label>
                <Input
                  id="email"
                  placeholder="Unesite email adresu"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button 
                  onClick={handleTestEmail} 
                  disabled={sendingEmail}
                  variant="outline"
                >
                  Test Email API
                </Button>
                <Button 
                  onClick={handleTestQuestionnaire} 
                  disabled={sendingEmail}
                  variant="default"
                >
                  Test Slanja Rezultata
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start">
              {testResult && (
                <div className="w-full p-4 rounded border mt-4">
                  <h3 className="font-medium mb-2">Rezultat testa ({testResult.provider})</h3>
                  <pre className="text-xs p-4 bg-gray-100 rounded overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                  
                  {testResult.data?.resultId && (
                    <div className="mt-4">
                      <p className="text-sm mb-2">Rezultat sačuvan lokalno. Možete ga pregledati ovde:</p>
                      <a 
                        href={`/api/questionnaire/results/${testResult.data.resultId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                      >
                        Pregledaj rezultat
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="local">
          <Card>
            <CardHeader>
              <CardTitle>Pregled lokalnih rezultata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={loadLocalResults} 
                disabled={loadingResults}
                variant="outline"
              >
                Učitaj rezultate
              </Button>
              
              {localResults.length > 0 ? (
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 text-left">ID</th>
                        <th className="py-2 px-4 text-left">Datum kreiranja</th>
                        <th className="py-2 px-4 text-left">Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localResults.map((result, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-4">{result.id}</td>
                          <td className="py-2 px-4">{new Date(result.createdAt).toLocaleString()}</td>
                          <td className="py-2 px-4">
                            <a 
                              href={`/api/questionnaire/results/${result.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary/90"
                            >
                              Pregledaj
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : loadingResults ? (
                <p className="text-center py-4 text-gray-500">Učitavanje rezultata...</p>
              ) : (
                <p className="text-center py-4 text-gray-500">Nema sačuvanih rezultata ili kliknite na "Učitaj rezultate"</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}