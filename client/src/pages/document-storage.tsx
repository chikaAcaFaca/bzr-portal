import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { UserDocumentsViewer } from '@/components/document-storage/user-documents-viewer';
import { FileUpload } from '@/components/document-storage/file-upload';
import { 
  Folder, 
  HardDriveIcon,
  Upload,
  FileText,
  Database,
  PlusCircle 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function DocumentStoragePage() {
  const [activeTab, setActiveTab] = useState("files");
  const [newFolderName, setNewFolderName] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Ispravna provera korisničke uloge i tipa pretplate
  const isPro = user?.subscriptionType === 'pro';
  
  // Ispravno skladište za FREE korisnike je 50MB umesto 1GB
  const storageSize = isPro ? '1 GB' : '50 MB';
  
  // Funkcija koja će se pozvati nakon uspešnog otpremanja
  const handleUploadComplete = () => {
    // Promeni tab na "files"
    setActiveTab("files");
    
    // Invalidira keš za dokumente kako bi primorao ponovno učitavanje
    queryClient.invalidateQueries({queryKey: ['/api/user-documents']});
    queryClient.invalidateQueries({queryKey: ['/api/user-storage-info']});
  };
  
  // Funkcija za kreiranje novog foldera
  const handleCreateFolder = async () => {
    try {
      if (!newFolderName.trim()) {
        toast({
          title: "Greška",
          description: "Naziv foldera ne može biti prazan",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch('/api/storage/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderName: newFolderName }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri kreiranju foldera');
      }
      
      const data = await response.json();
      
      toast({
        title: "Uspešno",
        description: `Folder "${newFolderName}" je uspešno kreiran`,
      });
      
      // Invalidira keš za dokumente kako bi primorao ponovno učitavanje
      queryClient.invalidateQueries({queryKey: ['/api/user-documents']});
      
      // Resetuj ime foldera
      setNewFolderName("");
      
    } catch (error: any) {
      console.error('Greška pri kreiranju foldera:', error);
      toast({
        title: "Greška",
        description: error.message || 'Došlo je do greške pri kreiranju foldera',
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <Helmet>
        <title>Skladište dokumenata | Bezbednost na radu</title>
      </Helmet>
      
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold">Skladište dokumenata</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Centralno mesto za sve vaše dokumente vezane za bezbednost i zdravlje na radu. 
          Ovde možete organizovati, čuvati i preuzimati sve dokumente prema kategorijama.
        </p>
      </header>
      
      <Tabs defaultValue="files" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger value="files">Vaši dokumenti</TabsTrigger>
            <TabsTrigger value="upload">Otpremanje</TabsTrigger>
          </TabsList>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novi folder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Kreiraj novi folder</DialogTitle>
                <DialogDescription>
                  Unesite ime novog foldera u kojem ćete čuvati dokumente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="folderName">Naziv foldera</Label>
                  <Input
                    id="folderName"
                    placeholder="Unesite naziv foldera..."
                    className="col-span-3"
                    onChange={(e) => setNewFolderName(e.target.value)}
                    value={newFolderName}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateFolder}>Kreiraj folder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <TabsContent value="files" className="mt-0">
              <Card className="p-4">
                <UserDocumentsViewer />
              </Card>
            </TabsContent>
            
            <TabsContent value="upload" className="mt-0">
              <Card className="p-4">
                <FileUpload onUploadComplete={handleUploadComplete} />
              </Card>
            </TabsContent>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <HardDriveIcon className="h-5 w-5 text-blue-500" />
                Dostupni prostor
              </h2>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-primary w-[8%] rounded-full"></div>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>81.2 MB iskorišćeno</span>
                <span>{storageSize} ukupno</span>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Podržane vrste dokumenata
              </h2>
              <ul className="text-sm space-y-1 mt-2">
                <li>📄 PDF dokumenti (.pdf)</li>
                <li>📝 Word dokumenti (.doc, .docx, .odt)</li>
                <li>📊 Excel dokumenti (.xls, .xlsx, .ods, .csv)</li>
                <li>🖼️ Slike (.jpg, .png, .bmp)</li>
              </ul>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Folder className="h-5 w-5 text-yellow-500" />
                Preporučena organizacija
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Svi dokumenti su automatski organizovani u preporučene kategorije:
              </p>
              <ul className="text-sm space-y-1">
                <li>📂 <strong>Sistematizacija</strong> - organizaciona struktura firme</li>
                <li>📂 <strong>Opisi poslova</strong> - detaljan opis radnih mesta</li>
                <li>📂 <strong>Obuke</strong> - sertifikati i evidencije obuka</li>
                <li>📂 <strong>Lekarski pregledi</strong> - uputi i izveštaji</li>
                <li>📂 <strong>Dopisi</strong> - zvanična komunikacija</li>
                <li>📂 <strong>Evidencije</strong> - evidencione liste i zapisnici</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-700">
                <Upload className="h-5 w-5" />
                Kako koristiti
              </h2>
              <ol className="text-sm space-y-2 text-blue-700">
                <li>1. Izaberite kategoriju dokumenata</li>
                <li>2. Kliknite na "Učitaj dokument"</li>
                <li>3. Odaberite fajl sa vašeg računara</li>
                <li>4. Sačekajte da se upload završi</li>
                <li>5. Dokumenti su dostupni u odgovarajućim folderima</li>
              </ol>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}