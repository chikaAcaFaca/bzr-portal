import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FolderOpen, Download, Save, Copy, FolderInput, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProcessingResultsProps = {
  results: any;
  documentType: 'job-positions' | 'employees' | 'job-descriptions' | 'risk-categories';
};

export function DocumentProcessorResponse({ results, documentType }: ProcessingResultsProps) {
  const { toast } = useToast();
  
  // Funkcija za kopiranje teksta u clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Kopirano",
          description: "Sadržaj je kopiran u klipbord",
        });
      })
      .catch(() => {
        toast({
          title: "Greška",
          description: "Nije moguće kopirati sadržaj",
          variant: "destructive",
        });
      });
  };
  
  // Ako imamo grešku u rezultatu obrade ili nema podataka
  if (!results || !results.data || results.data.length === 0) {
    // Proveri da li je rezultat sadržaj koji sugeriše ručni unos
    const errorMessage = results?.data?.[0] || '';
    const isManualInputSuggestion = 
      typeof errorMessage === 'string' && 
      (errorMessage.includes('Molimo vas unesite') || 
       errorMessage.includes('Nije moguće automatski') ||
       errorMessage.includes('Molimo koristite opciju ručnog unosa'));
    
    return (
      <Alert variant={isManualInputSuggestion ? "default" : "destructive"} className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {isManualInputSuggestion ? "Potreban je ručni unos" : "Greška pri obradi"}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {isManualInputSuggestion ? (
            <div>
              <p>{errorMessage || "Dokument se ne može automatski obraditi. Molimo koristite opciju direktnog unosa teksta."}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  // Implementiraj logiku za prebacivanje na ručni unos
                  // TODO: Pozovi funkciju koja prebacuje na text mode
                  toast({
                    title: "Prebačeno na ručni unos",
                    description: "Sada možete direktno uneti sadržaj dokumenta"
                  });
                }}
              >
                <FolderInput className="h-4 w-4 mr-2" />
                Prebaci na ručni unos
              </Button>
            </div>
          ) : (
            results?.error || "Došlo je do greške prilikom obrade dokumenta. Molimo pokušajte ponovo."
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Generisanje sadržaja na osnovu tipa dokumenta
  const getContent = () => {
    if (documentType === 'job-positions') {
      return (
        <div className="space-y-6">
          {results.data.map((position: any, index: number) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/40 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{position.title || 'Radno mesto'}</CardTitle>
                    <CardDescription>{position.department || 'Odeljenje nije definisano'}</CardDescription>
                  </div>
                  <Badge variant={position.coefficient > 3 ? "default" : "outline"}>
                    Koeficijent: {position.coefficient || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Potrebno obrazovanje</h4>
                    <p className="text-sm text-muted-foreground">{position.requiredEducation || 'Nije definisano'}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Potrebne veštine</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {position.requiredSkills && position.requiredSkills.length > 0 ? (
                        position.requiredSkills.map((skill: string, i: number) => (
                          <Badge key={i} variant="outline">{skill}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nema definisanih veština</p>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Odgovornosti</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {position.responsibilities && position.responsibilities.length > 0 ? (
                        position.responsibilities.map((resp: string, i: number) => (
                          <li key={i}>{resp}</li>
                        ))
                      ) : (
                        <li>Nema definisanih odgovornosti</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    } else if (documentType === 'employees') {
      return (
        <div className="space-y-6">
          {results.data.map((employee: any, index: number) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/40 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{employee.firstName} {employee.lastName}</CardTitle>
                    <CardDescription>{employee.jobPositionTitle || 'Pozicija nije definisana'}</CardDescription>
                  </div>
                  {employee.personalIdNumber && (
                    <Badge variant="outline">
                      JMBG: {employee.personalIdNumber}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Kontakt</h4>
                      <p className="text-sm text-muted-foreground">
                        {employee.email && <span className="block">Email: {employee.email}</span>}
                        {employee.phone && <span className="block">Telefon: {employee.phone}</span>}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Identifikacija</h4>
                      <p className="text-sm text-muted-foreground">
                        {employee.identificationNumber && <span className="block">Lična karta: {employee.identificationNumber}</span>}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Adresa</h4>
                    <p className="text-sm text-muted-foreground">
                      {employee.street && employee.streetNumber && 
                        <span className="block">{employee.street} {employee.streetNumber}</span>}
                      {employee.city && employee.postalCode && 
                        <span className="block">{employee.postalCode} {employee.city}</span>}
                    </p>
                  </div>
                  
                  {employee.children && employee.children.length > 0 && (
                    <>
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-sm mb-1">Deca</h4>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                          {employee.children.map((child: any, i: number) => (
                            <li key={i}>{child.firstName} {child.lastName} ({child.birthDate || 'Datum rođenja nije naveden'})</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    } else if (documentType === 'job-descriptions') {
      return (
        <div className="space-y-6">
          {results.data.map((description: any, index: number) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/40 pb-3">
                <CardTitle>{description.jobPositionTitle || 'Opis pozicije'}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Opšti opis</h4>
                    <p className="text-sm text-muted-foreground">{description.description || 'Nema opšti opis'}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Radne dužnosti</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {description.duties && description.duties.length > 0 ? (
                        description.duties.map((duty: string, i: number) => (
                          <li key={i}>{duty}</li>
                        ))
                      ) : (
                        <li>Nema definisanih dužnosti</li>
                      )}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Uslovi rada</h4>
                    <p className="text-sm text-muted-foreground">{description.workingConditions || 'Nisu definisani'}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Oprema</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {description.equipment && description.equipment.length > 0 ? (
                        description.equipment.map((item: string, i: number) => (
                          <Badge key={i} variant="outline">{item}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nema definisane opreme</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    } else if (documentType === 'risk-categories') {
      return (
        <div className="space-y-6">
          {results.data.map((category: any, index: number) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/40 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{category.name || 'Kategorija rizika'}</CardTitle>
                  </div>
                  <Badge variant={
                    category.riskLevel === 'visok' ? "destructive" : 
                    category.riskLevel === 'srednji' ? "default" :
                    "outline"
                  }>
                    Nivo rizika: {category.riskLevel || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Opis</h4>
                    <p className="text-sm text-muted-foreground">{category.description || 'Nema opis'}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Obuhvaćene pozicije</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {category.jobPositionIds && category.jobPositionIds.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {category.jobPositionIds.length} pozicija povezano sa ovom kategorijom
                        </span>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nema povezanih pozicija</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    return <p>Nepodržan tip dokumenta</p>;
  };
  
  // Ako je sadržaj poruka o grešci koja sugeriše ručni unos
  if (results.data.length === 1 && typeof results.data[0] === 'string' && 
      (results.data[0].includes('Molimo vas unesite') || 
       results.data[0].includes('Nije moguće automatski'))) {
    return (
      <Alert className="mt-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Potreban je ručni unos</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{results.data[0]}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              // Implementiraj logiku za prebacivanje na ručni unos
              toast({
                title: "Prebačeno na ručni unos",
                description: "Sada možete direktno uneti sadržaj dokumenta"
              });
            }}
          >
            <FolderInput className="h-4 w-4 mr-2" />
            Prebaci na ručni unos
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Rezultati obrade</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const textContent = JSON.stringify(results.data, null, 2);
              copyToClipboard(textContent);
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Kopiraj
          </Button>
        </div>
      </div>
      
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>{results.message || "Dokument je uspešno obrađen"}</AlertTitle>
        <AlertDescription>
          Obrađeno je {results.data.length} {
            documentType === 'job-positions' ? 'radnih mesta' : 
            documentType === 'employees' ? 'zaposlenih' : 
            documentType === 'job-descriptions' ? 'opisa poslova' : 
            'kategorija rizika'
          }
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="visual">
        <TabsList className="mb-4">
          <TabsTrigger value="visual">Vizuelni prikaz</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="space-y-4">
          {getContent()}
        </TabsContent>
        <TabsContent value="json">
          <Card>
            <CardContent className="pt-6">
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-xs">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}