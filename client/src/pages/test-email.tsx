import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TestEmail() {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const { toast } = useToast();

  const handleTestSupabase = async () => {
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
      const response = await apiRequest('GET', `/api/questionnaire/test-supabase-email?email=${emailAddress}`);
      
      setTestResult({
        provider: 'Supabase',
        success: response.ok,
        data: await response.json()
      });
      
      toast({
        title: response.ok ? "Uspeh" : "Greška",
        description: response.ok 
          ? `Test email uspešno poslat na ${emailAddress} preko Supabase-a` 
          : `Greška pri slanju test emaila preko Supabase-a`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error('Greška pri testiranju Supabase-a:', error);
      setTestResult({
        provider: 'Supabase',
        success: false,
        error: error.message
      });
      
      toast({
        title: "Greška",
        description: `Greška pri testiranju Supabase-a: ${error.message}`,
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

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Test Email Funkcionalnosti</h1>
      
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
                  onClick={handleTestSupabase} 
                  disabled={sendingEmail}
                  variant="outline"
                >
                  Test Supabase Email
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