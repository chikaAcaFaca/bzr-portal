import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, FileText, AlertCircle, UploadCloud, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { BZROnlyLimitation } from "@/components/ai-assistant/bzr-only-limitation";
import { DailyQuestionLimit } from "@/components/ai-assistant/daily-question-limit";
import { RequirePro } from "@/lib/route-guards";


const AIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const { toast } = useToast();
  const [context, setContext] = useState("");
  const [activeTab, setActiveTab] = useState("ask");
  const [responseStyle, setResponseStyle] = useState("professional");
  const [faqItems, setFaqItems] = useState<Array<{question: string, answer: string}>>([]);
  const [references, setReferences] = useState<any[]>([]);

  // Učitavanje često postavljanih pitanja
  const { data: faqData } = useQuery({
    queryKey: ['/api/agent/faq'],
    queryFn: async () => {
      const response = await apiRequest("/api/agent/faq", { method: "GET" });
      const data = await response.json();
      if (data.success) {
        return data.items;
      }
      throw new Error(data.error || 'Greška pri učitavanju FAQ');
    }
  });

  useEffect(() => {
    if (faqData) {
      setFaqItems(faqData);
    }
  }, [faqData]);

  // Generisanje dokumenta
  const generateDocumentSchema = z.object({
    baseDocumentText: z.string().min(1, "Bazni dokument je obavezan"),
    documentType: z.string().min(1, "Tip dokumenta je obavezan"),
    additionalParams: z.string().optional()
  });

  const generateDocumentForm = useForm<z.infer<typeof generateDocumentSchema>>({
    resolver: zodResolver(generateDocumentSchema),
    defaultValues: {
      baseDocumentText: "",
      documentType: "",
      additionalParams: ""
    }
  });

  // Analiza usklađenosti
  const complianceSchema = z.object({
    documentText: z.string().min(1, "Tekst dokumenta je obavezan")
  });

  const complianceForm = useForm<z.infer<typeof complianceSchema>>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      documentText: ""
    }
  });

  // Funkcija za automatsku konverziju AI odgovora u blog post
  const convertToBlogPost = async (aiResponse: string, originalQuestion: string) => {
    try {
      // Određivanje kategorije na osnovu pitanja ili odgovora
      const questionLower = originalQuestion.toLowerCase();
      let category = 'general';
      
      if (questionLower.includes('zakon') || questionLower.includes('propis')) {
        category = 'regulative';
      } else if (questionLower.includes('rizik') || questionLower.includes('opasnost')) {
        category = 'procena-rizika';
      } else if (questionLower.includes('obuka') || questionLower.includes('trening')) {
        category = 'obuke-zaposlenih';
      } else if (questionLower.includes('zdravlje') || questionLower.includes('medicina')) {
        category = 'zaštita-zdravlja';
      } else if (questionLower.includes('procedur') || questionLower.includes('postupak')) {
        category = 'procedure';
      } else {
        category = 'bezbednost-na-radu';
      }
      
      // Generisanje tagova na osnovu pitanja
      const potentialTags = questionLower.split(' ')
        .filter((word: string) => word.length > 3)
        .map((word: string) => word.toLowerCase());
      
      const uniqueTags = Array.from(new Set(potentialTags)).slice(0, 5);
      
      // Slanje zahteva za konverziju u blog post
      await apiRequest("/api/blog/ai-to-blog", {
        method: "POST",
        body: JSON.stringify({
          originalQuestion,
          aiResponse,
          category,
          tags: uniqueTags
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Obaveštavanje korisnika
      toast({
        title: "Blog post kreiran",
        description: "AI odgovor je uspešno konvertovan u blog post koji čeka odobrenje.",
      });
    } catch (error: any) {
      console.error('Greška pri konverziji u blog post:', error);
      toast({
        title: "Napomena",
        description: "Odgovor nije automatski konvertovan u blog post. Pokušajte ponovo kasnije.",
      });
    }
  };

  // Funkcija za rad sa AI agentom
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Greška",
        description: "Molimo unesite pitanje",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResponse("");
    setReferences([]);

    try {
      const data = await apiRequest("/api/agent/ask", {
        method: "POST",
        body: JSON.stringify({
          question: question.trim(),
          context: context.trim() || undefined,
          includeReferences: true,
          responseStyle: responseStyle
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (data.success && data.data) {
        const aiResponse = data.data.answer;
        setResponse(aiResponse);
        setReferences(data.data.references || []);
        
        // Automatski konvertuj odgovor u blog post
        await convertToBlogPost(aiResponse, question);
      } else {
        throw new Error(data.error || "Greška pri komunikaciji sa AI agentom");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Došlo je do greške pri obradi zahteva";
      console.error('AI Agent greška:', errorMessage);
      toast({
        title: "Greška",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcija za generisanje dokumenta
  const onGenerateDocument = async (data: z.infer<typeof generateDocumentSchema>) => {
    setIsLoading(true);
    setResponse("");
    setReferences([]);

    try {
      // Parsiranje dodatnih parametara
      let additionalParams = {};
      if (data.additionalParams) {
        try {
          // Pokušaj parsiranja kao JSON
          additionalParams = JSON.parse(data.additionalParams);
        } catch (e) {
          // Ako nije validan JSON, pokušaj parsirati kao parove ključ:vrednost
          const lines = data.additionalParams.split('\n');
          const params: Record<string, string> = {};
          for (const line of lines) {
            const [key, value] = line.split(':').map(part => part.trim());
            if (key && value) {
              params[key] = value;
            }
          }
          additionalParams = params;
        }
      }

      const responseData = await apiRequest("/api/agent/generate-document", {
        method: "POST",
        body: JSON.stringify({
          baseDocumentText: data.baseDocumentText,
          documentType: data.documentType,
          additionalParams
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (responseData.success && responseData.data) {
        const aiResponse = responseData.data.answer;
        setResponse(aiResponse);
        setReferences(responseData.data.references || []);
        
        // Automatski konvertuj odgovor u blog post
        await convertToBlogPost(aiResponse, "Generisanje dokumenta: " + data.documentType);
      } else {
        throw new Error(responseData.error || "Greška pri generisanju dokumenta");
      }
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Došlo je do greške pri generisanju dokumenta",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcija za analizu usklađenosti
  const onAnalyzeCompliance = async (data: z.infer<typeof complianceSchema>) => {
    setIsLoading(true);
    setResponse("");
    setReferences([]);

    try {
      const responseData = await apiRequest("/api/agent/analyze-compliance", {
        method: "POST",
        body: JSON.stringify({
          documentText: data.documentText
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (responseData.success && responseData.data) {
        const aiResponse = responseData.data.answer;
        setResponse(aiResponse);
        setReferences(responseData.data.references || []);
        
        // Automatski konvertuj odgovor u blog post
        await convertToBlogPost(aiResponse, "Analiza usklađenosti dokumenta");
      } else {
        throw new Error(responseData.error || "Greška pri analizi usklađenosti");
      }
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Došlo je do greške pri analizi usklađenosti",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Asistent za bezbednost i zdravlje na radu</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ask" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 gap-2">
                  <TabsTrigger value="ask" className="py-2">Pitanja & Odgovori</TabsTrigger>
                  <TabsTrigger value="generate" className="py-2">Generisanje dokumenta</TabsTrigger>
                  <TabsTrigger value="analyze" className="py-2">Analiza usklađenosti</TabsTrigger>
                  <TabsTrigger value="faq" className="py-2">Često postavljana pitanja</TabsTrigger>
                </TabsList>

                <div className="mt-4 space-y-2">
                  <Label>
                    Stil odgovora
                  </Label>
                  <Select 
                    onValueChange={(value) => setResponseStyle(value)}
                    defaultValue="professional"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite stil odgovora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Prijateljski</SelectItem>
                      <SelectItem value="professional">Stručan</SelectItem>
                      <SelectItem value="precise">Precizan</SelectItem>
                      <SelectItem value="detailed">Opširan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <TabsContent value="ask" className="space-y-4 pt-4">
                  {/* Komponenta za praćenje dnevnog limita pitanja za FREE korisnike */}
                  <DailyQuestionLimit 
                    onQuestionLimitReached={() => {
                      toast({
                        title: "Dnevni limit pitanja dostignut",
                        description: "FREE korisnici mogu postaviti samo 3 pitanja dnevno. Nadogradite na PRO za neograničen pristup.",
                        variant: "destructive"
                      });
                    }} 
                  />
                  
                  {/* PRO korisnici imaju pristup svim mogućnostima */}
                  <RequirePro 
                    fallback={
                      <BZROnlyLimitation onSubmit={(q) => {
                        setQuestion(q);
                        handleAskQuestion();
                      }} />
                    }
                  >
                    <div className="space-y-2">
                      <Label htmlFor="question">Pitanje</Label>
                      <Textarea
                        id="question"
                        placeholder="Postavite bilo koje pitanje..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="min-h-32"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="context">Kontekst (opciono)</Label>
                      <Textarea
                        id="context"
                        placeholder="Unesite dodatni kontekst za bolje razumevanje pitanja..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="min-h-24"
                      />
                    </div>

                    <Button 
                      onClick={handleAskQuestion} 
                      disabled={isLoading || !question.trim()} 
                      className="w-full"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Pošalji pitanje
                    </Button>
                  </RequirePro>
                </TabsContent>

                <TabsContent value="generate" className="space-y-4 pt-4">
                  {/* Generisanje dokumenata je PRO funkcionalnost */}
                  <RequirePro
                    fallback={
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50">
                        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">PRO funkcionalnost</h3>
                        <p className="text-center text-muted-foreground mb-4">
                          Generisanje dokumenata je dostupno samo PRO korisnicima.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = "/settings"}
                          className="bg-white text-primary border-primary hover:bg-primary hover:text-white"
                        >
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Nadogradi na PRO
                        </Button>
                      </div>
                    }
                  >
                    <Form {...generateDocumentForm}>
                      <form onSubmit={generateDocumentForm.handleSubmit(onGenerateDocument)} className="space-y-4">
                        <FormField
                          control={generateDocumentForm.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tip dokumenta</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Izaberite tip dokumenta" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="akt_o_proceni_rizika">Akt o proceni rizika</SelectItem>
                                  <SelectItem value="uputstvo_za_bezbedan_rad">Uputstvo za bezbedan rad</SelectItem>
                                  <SelectItem value="program_osposobljavanja">Program osposobljavanja</SelectItem>
                                  <SelectItem value="zapisnik_o_povredi">Zapisnik o povredi na radu</SelectItem>
                                  <SelectItem value="evidencija_opreme">Evidencija opreme za rad</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generateDocumentForm.control}
                          name="baseDocumentText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bazni dokument</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Unesite tekst baznog dokumenta..." 
                                  className="min-h-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generateDocumentForm.control}
                          name="additionalParams"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dodatni parametri (opciono)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Unesite dodatne parametre u formatu ključ: vrednost, jedan par po liniji..."
                                  className="min-h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Unesite dodatne parametre poput naziva kompanije, datuma, itd. u formatu ključ: vrednost
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          disabled={isLoading} 
                          className="w-full"
                        >
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                          Generiši dokument
                        </Button>
                      </form>
                    </Form>
                  </RequirePro>
                </TabsContent>

                <TabsContent value="analyze" className="space-y-4 pt-4">
                  {/* Analiza usklađenosti je PRO funkcionalnost */}
                  <RequirePro
                    fallback={
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">PRO funkcionalnost</h3>
                        <p className="text-center text-muted-foreground mb-4">
                          Analiza usklađenosti dokumenata sa zakonskom regulativom je dostupna samo PRO korisnicima.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = "/settings"}
                          className="bg-white text-primary border-primary hover:bg-primary hover:text-white"
                        >
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Nadogradi na PRO
                        </Button>
                      </div>
                    }
                  >
                    <Form {...complianceForm}>
                      <form onSubmit={complianceForm.handleSubmit(onAnalyzeCompliance)} className="space-y-4">
                        <FormField
                          control={complianceForm.control}
                          name="documentText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dokument za analizu</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Unesite tekst dokumenta za analizu usklađenosti sa zakonskom regulativom..." 
                                  className="min-h-48"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          disabled={isLoading} 
                          className="w-full"
                        >
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                          Analiziraj usklađenost
                        </Button>
                      </form>
                    </Form>
                  </RequirePro>
                </TabsContent>
                <TabsContent value="faq" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Često postavljana pitanja</h3>
                    <div className="grid gap-4">
                      {faqItems.map((item, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-base">{item.question}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{item.answer}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardHeader>
              <CardTitle>Odgovor AI asistenta</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-center text-muted-foreground">Obrađujem zahtev...</p>
                </div>
              ) : response ? (
                <div className="space-y-4">
                  <div className="whitespace-pre-wrap p-4 bg-muted rounded-lg">
                    {response}
                  </div>
                  
                  {/* Automatski se kreira blog post bez potrebe za klikom */}

                  {references.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Reference:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {references.map((ref, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{ref.source}</span>
                            {ref.article && <span className="text-muted-foreground"> (Član {ref.article})</span>}
                            {ref.text && <p className="text-xs mt-1">{ref.text}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p className="text-center">
                    {activeTab === "ask" 
                      ? "Postavite pitanje da biste dobili odgovor" 
                      : activeTab === "generate" 
                        ? "Unesite bazni dokument i tip da biste generisali dokument"
                        : "Unesite dokument za analizu usklađenosti"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;