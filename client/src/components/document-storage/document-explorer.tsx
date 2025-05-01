import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// Pojedinačni importi za UI komponente
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder, 
  File, 
  Upload, 
  Trash2, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  FileIcon
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Predefinisani folderi koje korisnik može da koristi
const PREDEFINED_FOLDERS = [
  { id: 'SISTEMATIZACIJA', name: 'Sistematizacija' },
  { id: 'SISTEMATIZACIJA SA IMENIMA', name: 'Sistematizacija sa imenima' },
  { id: 'OPIS POSLOVA', name: 'Opis poslova' },
  { id: 'UGOVORI', name: 'Ugovori' },
  { id: 'OBUKE', name: 'Obuke' },
  { id: 'DOPISI', name: 'Dopisi' },
  { id: 'LEKARSKI_PREGLEDI', name: 'Lekarski pregledi' },
  { id: 'EVIDENCIJE', name: 'Evidencije' },
  { id: 'OSTALO', name: 'Ostalo' }
];

interface DocumentFile {
  name: string;
  path: string;
  size?: number;
  lastModified?: Date;
  isFolder?: boolean;
}

export function DocumentExplorer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [uploadFolder, setUploadFolder] = useState(PREDEFINED_FOLDERS[0].id);
  const [customFolder, setCustomFolder] = useState('');
  
  // Za sada koristimo mock userId, kasnije će se dobiti iz autentifikacije
  const userId = 'current-user';
  
  // Funkcija za dobijanje ikone fajla na osnovu ekstenzije
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileIcon className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
      case 'odt':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'ods':
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'bmp':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Formatiranje veličine fajla u čitljiv format
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return 'Nepoznato';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Query za dobijanje liste fajlova i foldera
  const { data: documentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/storage/list-user-documents', userId, currentFolder],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('userId', userId);
      
      if (currentFolder) {
        const [folder, ...customPath] = currentFolder.split('/');
        params.append('folder', folder);
        
        if (customPath.length > 0) {
          params.append('path', customPath.join('/'));
        }
      }
      
      const response = await fetch(`/api/storage/list-user-documents?${params.toString()}`);
      return await response.json();
    }
  });
  
  // Mutacija za upload fajla
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/storage/upload-user-document', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri uploadovanju dokumenta');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Uspešno',
        description: 'Dokument je uspešno uploadovan',
      });
      
      // Osvežavanje liste dokumenata
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Greška',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutacija za brisanje fajla
  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch('/api/storage/delete-user-document', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentPath: path, userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri brisanju dokumenta');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Uspešno',
        description: 'Dokument je uspešno obrisan',
      });
      
      setSelectedFile(null);
      // Osvežavanje liste dokumenata
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Greška',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Formatiranje datuma
  const formatDate = (date?: Date) => {
    if (!date) return 'Nepoznato';
    return new Date(date).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Upravljanje klikom na folder
  const handleFolderClick = (folder: DocumentFile) => {
    setCurrentFolder(folder.path);
  };
  
  // Upravljanje navigacijom unazad
  const handleBackClick = () => {
    if (!currentFolder) return;
    
    const pathParts = currentFolder.split('/');
    if (pathParts.length <= 1) {
      setCurrentFolder(null);
    } else {
      // Ukloni zadnji deo putanje
      pathParts.pop();
      setCurrentFolder(pathParts.join('/'));
    }
  };
  
  // Upravljanje klikom na fajl
  const handleFileClick = (file: DocumentFile) => {
    setSelectedFile(file);
  };
  
  // Funkcija za download fajla
  const handleDownloadFile = () => {
    if (!selectedFile) return;
    
    // Kreiraj a tag i simuliraj klik za download
    const downloadLink = document.createElement('a');
    downloadLink.href = `/api/storage/download-user-document?path=${encodeURIComponent(selectedFile.path)}&userId=${userId}`;
    downloadLink.download = selectedFile.name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  // Funkcija za brisanje fajla
  const handleDeleteFile = () => {
    if (!selectedFile) return;
    
    if (window.confirm(`Da li ste sigurni da želite da obrišete fajl "${selectedFile.name}"?`)) {
      deleteMutation.mutate(selectedFile.path);
    }
  };
  
  // Funkcija za upload fajla
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('folder', uploadFolder);
    
    if (customFolder) {
      formData.append('customFolderPath', customFolder);
    }
    
    uploadMutation.mutate(formData);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skladište dokumenata</CardTitle>
          <CardDescription>
            Upravljajte svojim dokumentima. Ukupno dostupno 1GB prostora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              {currentFolder && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackClick}
                >
                  Nazad
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {currentFolder 
                  ? `Putanja: /${currentFolder}/` 
                  : 'Početni folder'}
              </span>
            </div>
            <div className="flex space-x-2">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.jpg,.jpeg,.png,.csv,.bmp"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Učitaj dokument
              </Button>
            </div>
          </div>
          
          {/* Opcije za upload */}
          <div className="mb-6 p-4 bg-muted rounded-md">
            <h3 className="text-sm font-medium mb-2">Opcije uploada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="folder-select">Odaberite folder</Label>
                <Select value={uploadFolder} onValueChange={setUploadFolder}>
                  <SelectTrigger id="folder-select">
                    <SelectValue placeholder="Izaberite folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_FOLDERS.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-folder">Dodatna putanja (opciono)</Label>
                <Input
                  id="custom-folder"
                  placeholder="npr. 2023/Q4"
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Lista fajlova */}
          {isLoading ? (
            <div className="py-8 text-center">
              <p>Učitavanje dokumenta...</p>
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Greška</AlertTitle>
              <AlertDescription>
                Nije moguće učitati listu dokumenata. Molimo pokušajte ponovo.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {documentsData?.files && documentsData.files.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Naziv</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Veličina</TableHead>
                        <TableHead>Datum izmene</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentsData.files.map((file: DocumentFile) => (
                        <TableRow 
                          key={file.path}
                          className={`cursor-pointer ${selectedFile?.path === file.path ? 'bg-primary/10' : ''}`}
                          onClick={() => file.isFolder ? handleFolderClick(file) : handleFileClick(file)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {file.isFolder ? (
                                <Folder className="h-5 w-5 text-blue-500 mr-2" />
                              ) : (
                                <span className="mr-2">{getFileIcon(file.name)}</span>
                              )}
                              {file.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {file.isFolder ? 'Folder' : file.name.split('.').pop()?.toUpperCase()}
                          </TableCell>
                          <TableCell>
                            {file.isFolder ? '-' : formatFileSize(file.size)}
                          </TableCell>
                          <TableCell>
                            {file.lastModified ? formatDate(file.lastModified) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border rounded-md p-6 text-center">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Ovaj folder je prazan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kliknite na "Učitaj dokument" da dodate dokumente.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div>
            {selectedFile && !selectedFile.isFolder && (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadFile}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Preuzmi
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteFile}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Obriši
                </Button>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Dozvoljeni formati: PDF, DOC, XLS, ODS, ODT, JPG, PNG, CSV, BMP
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}