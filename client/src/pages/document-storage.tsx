import React from 'react';
import { DocumentExplorer } from '@/components/document-storage/document-explorer';
import { Helmet } from 'react-helmet';
import { 
  Folder, 
  HardDriveIcon, 
  Upload,
  FileText,
  Database 
} from 'lucide-react';

export default function DocumentStoragePage() {
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DocumentExplorer />
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
              <span>1 GB ukupno</span>
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
    </div>
  );
}