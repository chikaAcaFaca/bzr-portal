import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, FileText, ArrowDown, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ProcessingResultsType = {
  success: boolean;
  message?: string;
  data?: any;
  errorCode?: string;
  suggestion?: string;
  details?: string;
};

interface DocumentProcessorResponseProps {
  results: ProcessingResultsType;
  documentType: string;
}

export function DocumentProcessorResponse({ results, documentType }: DocumentProcessorResponseProps) {
  // Pokušajmo prepoznati tip greške za bolji UX
  const errorIsFormatRelated = 
    results.message?.includes('nije moguće automatski obraditi') || 
    results.message?.includes('nije moguće ekstraktovati tekst') ||
    results.message?.includes('nije podržan format');
  
  const errorIsServerRelated = 
    results.message?.includes('server') || 
    results.message?.includes('timeout') ||
    results.message?.includes('JSON');

  // Da li je uspešno obrađen dokument ili imamo greške
  const isSuccessful = results.success && results.data;

  return (
    <Card className={isSuccessful ? "border-green-500/40 bg-green-50/30" : "border-amber-500/40 bg-amber-50/30"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSuccessful ? (
            <>
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-green-700">Uspešno obrađen dokument</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-amber-700">
                {errorIsFormatRelated 
                  ? "Format dokumenta zahteva ručnu obradu" 
                  : errorIsServerRelated 
                  ? "Problem sa obradom na serveru" 
                  : "Upozorenje"}
              </span>
            </>
          )}
        </CardTitle>
        <CardDescription>
          {results.message || (isSuccessful 
            ? "Dokument je uspešno analiziran i podaci su ekstrahovani"
            : "Došlo je do problema pri obradi dokumenta")}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isSuccessful ? (
          <div className="space-y-4">
            <Alert variant="default" className="bg-primary/10">
              <FileText className="h-4 w-4" />
              <AlertTitle>Ekstraktovani podaci</AlertTitle>
              <AlertDescription>
                {`Uspešno je ${documentType === 'job-positions' 
                  ? 'identifikovano ' + (results.data?.length || 0) + ' radnih mesta'
                  : documentType === 'employees'
                  ? 'identifikovano ' + (results.data?.length || 0) + ' zaposlenih'
                  : documentType === 'job-descriptions'
                  ? 'identifikovano ' + (results.data?.length || 0) + ' opisa poslova'
                  : 'obrađen dokument'}`}
              </AlertDescription>
            </Alert>
            
            <Tabs defaultValue="view">
              <TabsList className="mb-2">
                <TabsTrigger value="view">Pregled</TabsTrigger>
                <TabsTrigger value="json">JSON podaci</TabsTrigger>
              </TabsList>
              
              <TabsContent value="view" className="space-y-4">
                {Array.isArray(results.data) && results.data.map((item, index) => (
                  <div key={index} className="border rounded-md p-3 bg-background">
                    <h3 className="font-medium text-sm">{item.name || item.title || item.position || `Stavka ${index + 1}`}</h3>
                    {Object.entries(item).map(([key, value]) => {
                      if (key !== 'name' && key !== 'title' && key !== 'position' && value) {
                        return (
                          <div key={key} className="mt-1 text-xs">
                            <span className="font-medium text-muted-foreground">{key}: </span>
                            <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ))}
                
                {!Array.isArray(results.data) && (
                  <div className="border rounded-md p-3 bg-background">
                    <pre className="text-xs whitespace-pre-wrap overflow-auto">
                      {JSON.stringify(results.data, null, 2)}
                    </pre>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="json" className="bg-muted rounded-md">
                <pre className="p-4 text-xs overflow-auto max-h-60">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {errorIsFormatRelated 
                  ? "Format dokumenta zahteva drugačiji pristup" 
                  : errorIsServerRelated 
                  ? "Problem sa serverskom obradom" 
                  : "Greška pri obradi"}
              </AlertTitle>
              <AlertDescription className="text-sm space-y-2">
                <p>{results.message || "Došlo je do problema pri obradi dokumenta"}</p>
                
                {errorIsFormatRelated && (
                  <div className="pt-2">
                    <p className="font-medium">Preporuke:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Koristite opciju za ručni unos teksta (dugme "Ručni unos")</li>
                      <li>Pokušajte sačuvati dokument u drugom formatu (npr. DOCX ili TXT)</li>
                      <li>Za OpenOffice dokumente, probajte izvoz u MS Office format</li>
                      <li>Za PDF, probajte kopirajte sadržaj direktno iz PDF čitača</li>
                    </ul>
                  </div>
                )}
                
                {errorIsServerRelated && (
                  <div className="pt-2">
                    <p className="font-medium">Preporuke:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Proverite da li je fajl ispravno učitan</li>
                      <li>Pokušajte ponovo nakon nekoliko trenutaka</li>
                      <li>Možda je dokument prevelik - koristite manji dokument</li>
                      <li>Koristite opciju za ručni unos teksta</li>
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted p-4 rounded-md text-sm">
              <p className="font-medium mb-2">Informacije o grešci:</p>
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify({
                  message: results.message,
                  errorCode: results.errorCode,
                  documentType
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}