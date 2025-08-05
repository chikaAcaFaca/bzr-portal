import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { DocumentProcessorUploadForm } from "../components/forms/document-processor-upload-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function DocumentProcessorPage() {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Nazad na početnu
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Obrada dokumenata</h1>
        <p className="text-muted-foreground mt-2">
          Koristite veštačku inteligenciju za automatsku ekstrakciju i obradu podataka iz različitih vrsta dokumenata.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <DocumentProcessorUploadForm />
        
        <Card>
          <CardHeader>
            <CardTitle>Uputstvo za obradu dokumenata</CardTitle>
            <CardDescription>
              Kako funkcioniše proces obrade dokumenata pomoću AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h3 className="font-semibold">1. Izaberite tip dokumenta</h3>
                <p className="text-sm text-muted-foreground">
                  Izaberite tip dokumenta koji želite da obradite koristeći tabove na vrhu forme.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="font-semibold">2. Učitajte dokument</h3>
                <p className="text-sm text-muted-foreground">
                  Prevucite dokument u označeno polje ili kliknite na dugme "Izaberi fajl". Podržani formati su TXT, DOC, DOCX, PDF, XLS, XLSX, CSV.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="font-semibold">3. Obradite dokument</h3>
                <p className="text-sm text-muted-foreground">
                  Kliknite na dugme "Obradi dokument" i sačekajte da AI izvrši obradu. Proces može potrajati nekoliko sekundi.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="font-semibold">4. Generisanje kategorija rizika</h3>
                <p className="text-sm text-muted-foreground">
                  Nakon što dodate radna mesta, možete automatski generisati kategorije rizika koristeći tab "Kategorije rizika". Kategorije će biti kreirane automatski na osnovu naziva i karakteristika radnih mesta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}