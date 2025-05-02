import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileIcon, 
  FileText, 
  FileImage, 
  FileArchive,
  Download,
  Trash2,
  Folder,
  FolderOpen,
  Loader,
  Info,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  List,
  FolderPlus,
  ChevronLeft,
  Eye,
  ExternalLink,
  Home,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { formatBytes, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Komponenta za prikazivanje slika sa potpisanim URL-om
interface ImagePreviewProps {
  document: UserDocument;
  onError: () => void;
}

function ImagePreview({ document, onError }: ImagePreviewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        if (!document.path) {
          setError('Putanja dokumenta nije dostupna');
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        const response = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(document.path)}`);
        const data = await response.json();
        
        if (!data.success || !data.url) {
          throw new Error(data.message || 'Nije moguće dobiti URL za preuzimanje');
        }
        
        setSignedUrl(data.url);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Greška pri dobavljanju potpisanog URL-a:', error);
        setError(error.message || 'Došlo je do greške prilikom učitavanja slike');
        setIsLoading(false);
        onError();
      }
    }
    
    fetchSignedUrl();
  }, [document.path, onError]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <Skeleton className="w-64 h-64 rounded-md" />
        <div className="mt-2">Učitavanje slike...</div>
      </div>
    );
  }
  
  if (error || !signedUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <FileImage className="h-16 w-16 text-red-500" />
        <div className="mt-2 text-red-500">{error || 'Došlo je do greške prilikom učitavanja slike'}</div>
      </div>
    );
  }
  
  return (
    <img 
      src={signedUrl} 
      alt={document.name} 
      className="max-h-full max-w-full object-contain"
      onError={() => {
        setError('Nije moguće prikazati sliku');
        onError();
      }}
    />
  );
}

interface UserDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  folder: string;
  createdAt: string;
  url: string;
  isFolder?: boolean;
}

interface StorageInfo {
  usedStorage: number;
  totalStorage: number;
  remainingStorage: number;
  usagePercentage: number;
}

export function UserDocumentsViewer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  // Uvek koristimo samo "list" prikaz za bolju čitljivost
  const viewMode = "list";
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState<boolean>(false);
  
  // Kategorije dokumenata
  const categories = [
    { id: 'opsti', name: 'Opšti dokumenti' },
    { id: 'sistematizacija', name: 'Sistematizacija' },
    { id: 'opis_poslova', name: 'Opisi poslova' },
    { id: 'obuke', name: 'Obuke' },
    { id: 'lekarski', name: 'Lekarski pregledi' },
    { id: 'dopisi', name: 'Dopisi i komunikacija' },
    { id: 'evidencije', name: 'Evidencije' }
  ];
  
  // Funkcija za dobijanje korisničkih dokumenata
  const { 
    data: documentsData, 
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ['/api/user-documents'],
    queryFn: async () => {
      if (!user) {
        throw new Error('Niste prijavljeni');
      }
      
      // Dobijanje dokumenata preko API-ja
      const response = await fetch('/api/user-documents', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Greška pri dobavljanju dokumenata');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Greška pri dobavljanju dokumenata');
      }
      
      return data.documents as UserDocument[];
    },
    enabled: !!user
  });
  
  // Funkcija za dobijanje informacija o skladištu
  const {
    data: storageInfo,
    isLoading: isLoadingStorage,
    isError: isErrorStorage
  } = useQuery({
    queryKey: ['/api/user-storage-info'],
    queryFn: async () => {
      if (!user) {
        throw new Error('Niste prijavljeni');
      }
      
      const response = await fetch('/api/user-storage-info', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Greška pri dobavljanju informacija o skladištu');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Greška pri dobavljanju informacija o skladištu');
      }
      
      return {
        usedStorage: data.usedStorage,
        totalStorage: data.totalStorage,
        remainingStorage: data.remainingStorage,
        usagePercentage: data.usagePercentage
      } as StorageInfo;
    },
    enabled: !!user
  });
  
  // Kada se dobiju dokumenti, grupiraj ih po folderima
  useEffect(() => {
    if (documentsData) {
      const uniqueFolders = Array.from(new Set(documentsData.map(doc => doc.folder)));
      setFolders(uniqueFolders);
      
      // Ako nema selektovanog foldera, a postoje folderi, selektuj prvi
      if (!selectedFolder && uniqueFolders.length > 0) {
        setSelectedFolder(uniqueFolders[0]);
      }
    }
  }, [documentsData, selectedFolder]);
  
  // Funkcija za brisanje dokumenta
  const handleDeleteDocument = async (document: UserDocument) => {
    try {
      if (!user) {
        throw new Error('Niste prijavljeni');
      }
      
      // Dodatna provera
      const confirmDelete = window.confirm(`Da li ste sigurni da želite da obrišete dokument "${document.name}"?`);
      if (!confirmDelete) {
        return;
      }
      
      // Brisanje dokumenta preko API-ja
      const response = await fetch(`/api/user-documents/${document.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: document.path }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri brisanju dokumenta');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Greška pri brisanju dokumenta');
      }
      
      toast({
        title: 'Dokument obrisan',
        description: 'Dokument je uspešno obrisan',
        variant: 'default'
      });
      
      // Osveži listu dokumenata
      refetchDocuments();
      
    } catch (error: any) {
      console.error('Greška pri brisanju dokumenta:', error);
      toast({
        title: 'Greška',
        description: error.message || 'Došlo je do greške prilikom brisanja dokumenta',
        variant: 'destructive'
      });
    }
  };
  
  // Funkcija za preuzimanje dokumenta
  const handleDownloadDocument = async (document: UserDocument) => {
    try {
      if (!document.path) {
        toast({
          title: 'Greška',
          description: 'Putanja dokumenta nije dostupna',
          variant: 'destructive'
        });
        return;
      }
      
      // Dobavljanje potpisanog URL-a za preuzimanje
      const response = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(document.path)}`);
      const data = await response.json();
      
      if (!data.success || !data.url) {
        throw new Error(data.message || 'Nije moguće dobiti URL za preuzimanje');
      }
      
      // Kreiranje linka za preuzimanje
      const a = window.document.createElement('a');
      a.href = data.url;
      a.download = document.name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (error: any) {
      console.error('Greška pri preuzimanju dokumenta:', error);
      toast({
        title: 'Greška pri preuzimanju',
        description: error.message || 'Došlo je do greške prilikom preuzimanja dokumenta',
        variant: 'destructive'
      });
    }
  };
  
  // Funkcija za prikaz ikone na osnovu tipa dokumenta
  const getFileIcon = (document: UserDocument) => {
    // Ako je folder, prikaži folder ikonu
    if (document.isFolder) {
      return <Folder className="h-6 w-6 text-amber-500" />;
    }
    
    const type = document.type.toLowerCase();
    
    if (type.includes('pdf')) {
      return <FileIcon className="h-6 w-6 text-red-500" />;
    } else if (type.includes('image')) {
      return <FileImage className="h-6 w-6 text-green-500" />;
    } else if (type.includes('word') || type.includes('text') || type.includes('document')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) {
      return <FileArchive className="h-6 w-6 text-yellow-500" />;
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Funkcija za prikaz filtriranih dokumenata u selektovanom folderu
  const getFilteredDocuments = () => {
    if (!documentsData) return [];
    
    // Ako smo u folderu, prikaži samo dokumente u tom folderu
    if (currentPath) {
      // Prikaži dokumente u trenutnom folderu i podfoldere
      return documentsData.filter(doc => {
        if (doc.isFolder) {
          // Za foldere, proveri da li su direktno u trenutnom folderu
          const folderPath = doc.path.replace(`user_${user?.id}/`, '');
          const pathParts = folderPath.split('/');
          return pathParts.length === 2 && folderPath.startsWith(currentPath + '/');
        } else {
          // Za dokumente, proveri da li su direktno u trenutnom folderu
          const docPath = doc.path.replace(`user_${user?.id}/`, '');
          const pathParts = docPath.split('/');
          return pathParts.length === 2 && docPath.startsWith(currentPath + '/');
        }
      });
    }
    
    // Prikaz početnog direktorijuma - standardni prikaz po folderima
    if (selectedFolder) {
      return documentsData.filter(doc => doc.folder === selectedFolder);
    }
    
    // Ako nema selektovanog foldera, prikaži sve dokumente
    return documentsData;
  };
  
  // Funkcija za otvaranje foldera
  const handleOpenFolder = (document: UserDocument) => {
    // Ako je dokument folder
    if (document.isFolder) {
      // Dodaj trenutnu putanju u istoriju navigacije
      setNavigationHistory(prev => [...prev, currentPath]);
      
      // Postavi novu putanju
      const folderPath = document.path.replace(`user_${user?.id}/`, '').replace('/', '');
      setCurrentPath(folderPath);
      
      toast({
        title: 'Folder otvoren',
        description: `Otvoren folder: ${document.name}`,
        variant: 'default'
      });
    }
  };
  
  // Funkcija za vraćanje nazad
  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      // Uzmi poslednju putanju iz istorije
      const previousPath = navigationHistory[navigationHistory.length - 1];
      
      // Ažuriraj istoriju navigacije
      setNavigationHistory(prev => prev.slice(0, -1));
      
      // Postavi putanju
      setCurrentPath(previousPath);
    } else {
      // Vrati se na početni prikaz
      setCurrentPath('');
    }
  };
  
  // Funkcija za otvaranje pregleda dokumenta
  const handleViewDocument = (document: UserDocument) => {
    setSelectedDocument(document);
    setIsDocumentPreviewOpen(true);
  };
  
  // Funkcija za kreiranje novog foldera
  const handleCreateNewFolder = async () => {
    try {
      if (!user) {
        throw new Error('Niste prijavljeni');
      }
      
      if (!newFolderName.trim()) {
        toast({
          title: 'Greška',
          description: 'Naziv foldera ne može biti prazan',
          variant: 'destructive'
        });
        return;
      }
      
      // Slanje zahteva za kreiranje novog foldera
      const response = await fetch('/api/storage/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          folderName: newFolderName.trim() 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri kreiranju foldera');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Greška pri kreiranju foldera');
      }
      
      toast({
        title: 'Uspešno kreiran folder',
        description: `Folder "${newFolderName}" je uspešno kreiran.`,
        variant: 'default'
      });
      
      // Resetuj polje i zatvori dijalog
      setNewFolderName('');
      setIsNewFolderDialogOpen(false);
      
      // Osveži listu dokumenata
      refetchDocuments();
      
    } catch (error: any) {
      console.error('Greška pri kreiranju foldera:', error);
      toast({
        title: 'Greška',
        description: error.message || 'Došlo je do greške prilikom kreiranja foldera',
        variant: 'destructive'
      });
    }
  };
  
  // Prikaz loading stanja
  if (isLoadingDocuments || isLoadingStorage) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Učitavanje dokumenata...</span>
      </div>
    );
  }
  
  // Prikaz greške
  if (isErrorDocuments || isErrorStorage) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-red-500">
        <Info className="h-12 w-12 mb-2" />
        <h3 className="text-lg font-medium">Greška pri učitavanju</h3>
        <p className="text-sm text-center max-w-md">
          Došlo je do greške prilikom učitavanja vaših dokumenata. 
          Molimo vas da osvežite stranicu ili pokušate kasnije.
        </p>
      </div>
    );
  }
  
  // Prikaz kada nema dokumenata
  if (!documentsData || documentsData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <FileIcon className="h-12 w-12 mb-2 text-gray-400" />
        <h3 className="text-lg font-medium">Nema dokumenata</h3>
        <p className="text-sm text-center max-w-md text-muted-foreground">
          Trenutno nemate nijedan dokument u skladištu. 
          Kliknite na "Otpremanje" da postavite svoj prvi dokument.
        </p>
      </div>
    );
  }
  
  // Funkcija za dobijanje CSS klasa za prikaz veličine dokumenata
  const getDocumentViewClass = () => {
    switch (viewMode) {
      case "list":
        return "grid grid-cols-1 gap-4";
      case "grid-small":
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4";
      case "grid-medium":
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4";
      case "grid-large":
        return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4";
      case "grid-extra-large":
        return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4";
      default:
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4";
    }
  };

  // Funkcija za dobijanje veličine ikone dokumenata
  const getIconSize = () => {
    switch (viewMode) {
      case "list":
        return "h-6 w-6";
      case "grid-small":
        return "h-8 w-8";
      case "grid-medium":
        return "h-12 w-12";
      case "grid-large":
        return "h-16 w-16";
      case "grid-extra-large":
        return "h-24 w-24";
      default:
        return "h-8 w-8";
    }
  };

  // Funkcija za prikaz dokumenata u različitim veličinama
  const renderDocumentCard = (document: UserDocument) => {
    // Specijalni slučaj za "Sanitarni" - tretiramo ga kao folder
    const isSanitarniFolder = document.name === "Sanitarni" || document.name.toLowerCase().includes("sanitarni");
    const isFolder = document.isFolder || isSanitarniFolder;
    
    // Različiti stilovi za folder i fajlove
    const folderClass = "bg-amber-50 border-amber-200";
    const fileClass = "";
    
    // Određivanje klase
    const specialClass = isFolder ? folderClass : fileClass;
    
    if (viewMode === "list") {
      // List prikaz
      return (
        <Card key={document.id} className={`overflow-hidden ${specialClass}`}>
          <div className="flex items-center p-4">
            <div className="flex-shrink-0">
              {isFolder ? <Folder className="h-6 w-6 text-amber-500" /> : getFileIcon(document)}
            </div>
            <div className="ml-4 flex-grow overflow-hidden">
              <h3 className="text-sm font-medium truncate">{document.name}</h3>
              {!isFolder && (
                <p className="text-xs text-muted-foreground">
                  {formatBytes(document.size, 2)} • {formatDate(new Date(document.createdAt))}
                </p>
              )}
              {isFolder && (
                <p className="text-xs text-muted-foreground">
                  Folder
                </p>
              )}
            </div>
            <div className="flex-shrink-0 ml-4 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDeleteDocument(document)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {!isFolder && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownloadDocument(document)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {isFolder && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenFolder(document)}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              )}
              {!isFolder && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewDocument(document)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      );
    } else {
      // Grid prikaz (mala, srednja, velika, ogromna)
      const iconSizeClass = getIconSize();
      const isExtraLarge = viewMode === "grid-extra-large";
      const isLarge = viewMode === "grid-large";
      const isMedium = viewMode === "grid-medium";
      
      return (
        <Card key={document.id} className={`overflow-hidden flex flex-col ${specialClass}`}>
          <div className={`p-4 flex ${isExtraLarge || isLarge ? 'justify-center' : ''} items-center`}>
            <div className={`${isExtraLarge || isLarge ? 'text-center' : 'flex-shrink-0'}`}>
              <div className={iconSizeClass}>
                {isFolder ? <Folder className={`${iconSizeClass} text-amber-500`} /> : getFileIcon(document)}
              </div>
            </div>
            {isExtraLarge && (
              <div className="mt-2 text-center w-full">
                <h3 className="text-sm font-medium break-words">{document.name}</h3>
                {!isFolder && (
                  <>
                    <p className="text-xs text-muted-foreground">{formatBytes(document.size, 2)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(new Date(document.createdAt))}</p>
                  </>
                )}
                {isFolder && (
                  <p className="text-xs text-muted-foreground">Folder</p>
                )}
              </div>
            )}
            {!isExtraLarge && (
              <div className={`${isLarge ? 'mt-2 text-center w-full' : 'ml-3 flex-grow overflow-hidden'}`}>
                <h3 className={`${isLarge || isMedium ? 'text-sm' : 'text-xs'} font-medium truncate`}>{document.name}</h3>
                {!isFolder && (
                  <p className="text-xs text-muted-foreground">{formatBytes(document.size, 2)}</p>
                )}
                {isFolder && (
                  <p className="text-xs text-muted-foreground">Folder</p>
                )}
                {!isFolder && !isLarge && !isMedium && (
                  <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(new Date(document.createdAt))}</p>
                )}
              </div>
            )}
          </div>
          <div className="mt-auto p-2 flex justify-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDeleteDocument(document)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {!isFolder && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownloadDocument(document)}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {isFolder && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleOpenFolder(document)}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            )}
            {!isFolder && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleViewDocument(document)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      );
    }
  };

  // Funkcija za generisanje breadcrumb za trenutnu putanju
  const renderBreadcrumbs = () => {
    if (!currentPath) return null;
    
    const pathParts = currentPath.split('/');
    let currentBuildPath = '';
    
    return (
      <Breadcrumb className="py-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 p-1 h-8"
              onClick={() => {
                setCurrentPath('');
                setNavigationHistory([]);
              }}
            >
              <Home className="h-4 w-4" />
              <span>Glavni direktorijum</span>
            </Button>
          </BreadcrumbItem>
          
          {pathParts.map((part, index) => {
            currentBuildPath = index === 0 ? part : `${currentBuildPath}/${part}`;
            const isLast = index === pathParts.length - 1;
            
            return (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <span className="font-medium">{part}</span>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1 h-7"
                      onClick={() => {
                        setNavigationHistory(prev => [...prev.slice(0, index)]);
                        setCurrentPath(currentBuildPath);
                      }}
                    >
                      {part}
                    </Button>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dijalog za pregled dokumenta */}
      <Dialog open={isDocumentPreviewOpen} onOpenChange={setIsDocumentPreviewOpen}>
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              {selectedDocument && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{formatBytes(selectedDocument.size, 2)}</span>
                  <span>•</span>
                  <span>{formatDate(new Date(selectedDocument.createdAt))}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-hidden overflow-y-auto border rounded-md bg-secondary/20">
            {selectedDocument ? (
              selectedDocument.type.includes('image') ? (
                <div className="h-full flex items-center justify-center p-4">
                  <ImagePreview 
                    document={selectedDocument} 
                    onError={() => {
                      toast({
                        title: 'Slika nije dostupna',
                        description: 'Nije moguće prikazati sliku direktno. Pokušajte preuzeti dokument.',
                        variant: 'destructive'
                      });
                    }}
                  />
                </div>
              ) : selectedDocument.type.includes('pdf') ? (
                <div className="h-full w-full p-4">
                  <div className="bg-gray-100 p-4 rounded-lg h-full flex flex-col items-center justify-center">
                    <FileIcon className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-center mb-4">
                      PDF dokumenti se ne mogu prikazati direktno u aplikaciji.
                    </p>
                    <div className="flex space-x-4">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={async () => {
                          if (!selectedDocument.path) return;
                          try {
                            const response = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(selectedDocument.path)}`);
                            const data = await response.json();
                            if (data.success && data.url) {
                              window.open(data.url, '_blank');
                            } else {
                              toast({
                                title: 'Greška',
                                description: data.message || 'Nije moguće dobiti URL za pregled',
                                variant: 'destructive'
                              });
                            }
                          } catch (error: any) {
                            toast({
                              title: 'Greška',
                              description: error.message || 'Greška pri otvaranju dokumenta',
                              variant: 'destructive'
                            });
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Otvori u novom prozoru
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadDocument(selectedDocument)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Preuzmi dokument
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full flex flex-col items-center justify-center">
                  <div className="mb-4 text-center">
                    <FileIcon className="h-12 w-12 text-gray-500" />
                  </div>
                  <p className="text-center mb-4">
                    Nije moguće prikazati sadržaj ovog dokumenta direktno u pregledaču.
                  </p>
                  <div className="flex space-x-4">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleDownloadDocument(selectedDocument)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Preuzmi dokument
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="p-4 h-full flex flex-col items-center justify-center">
                <div className="mb-4 text-center">
                  <FileIcon className="h-12 w-12 text-gray-500" />
                </div>
                <p className="text-center">
                  Nije odabran nijedan dokument za pregled.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentPreviewOpen(false)}>Zatvori</Button>
            {selectedDocument && (
              <Button 
                onClick={() => handleDownloadDocument(selectedDocument)}
              >
                <Download className="h-4 w-4 mr-2" />
                Preuzmi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dijalog za kreiranje novog foldera */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novi folder</DialogTitle>
            <DialogDescription>
              Unesite naziv za novi folder
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Naziv
              </Label>
              <Input
                id="name"
                placeholder="Unesite naziv foldera"
                className="col-span-3"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>Otkaži</Button>
            <Button onClick={handleCreateNewFolder}>Kreiraj folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prikaz iskorišćenosti skladišta */}
      {storageInfo && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Iskorišćenost skladišta</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={storageInfo.usagePercentage} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span>{formatBytes(storageInfo.usedStorage, 2)} iskorišćeno</span>
              <span>{formatBytes(storageInfo.remainingStorage, 2)} slobodno</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Windows-style navigacija */}
      {currentPath && (
        <Card className="mb-4">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex-grow">
                {renderBreadcrumbs()}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGoBack}
                className="ml-2"
                disabled={navigationHistory.length === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Nazad</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tab navigacija po folderima */}
      {folders.length > 0 && !currentPath && (
        <Tabs 
          value={selectedFolder || folders[0]} 
          onValueChange={setSelectedFolder}
          className="w-full"
        >
          <div className="border-b">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="flex overflow-x-auto pb-0">
                {folders.map(folder => (
                  <TabsTrigger 
                    key={folder} 
                    value={folder}
                    className="data-[state=active]:bg-background flex items-center"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {folder}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="flex items-center space-x-2">
                {/* Dugmad za promenu prikaza */}
                <RadioGroup
                  value={viewMode}
                  onValueChange={(value) => setViewMode(value as any)}
                  className="flex"
                >
                  <div className="flex space-x-1 border rounded-md p-1">
                    <div className="rounded hover:bg-secondary p-1">
                      <RadioGroupItem value="list" id="list" className="hidden" />
                      <Label htmlFor="list" className="cursor-pointer">
                        <List className="h-5 w-5" />
                      </Label>
                    </div>
                    
                    <div className="rounded hover:bg-secondary p-1">
                      <RadioGroupItem value="grid-small" id="grid-small" className="hidden" />
                      <Label htmlFor="grid-small" className="cursor-pointer">
                        <Grid3X3 className="h-5 w-5" />
                      </Label>
                    </div>
                    
                    <div className="rounded hover:bg-secondary p-1">
                      <RadioGroupItem value="grid-medium" id="grid-medium" className="hidden" />
                      <Label htmlFor="grid-medium" className="cursor-pointer">
                        <Grid2X2 className="h-5 w-5" />
                      </Label>
                    </div>
                    
                    <div className="rounded hover:bg-secondary p-1">
                      <RadioGroupItem value="grid-large" id="grid-large" className="hidden" />
                      <Label htmlFor="grid-large" className="cursor-pointer">
                        <LayoutGrid className="h-5 w-5" />
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                
                {/* Dugme za kreiranje novog foldera */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsNewFolderDialogOpen(true)}
                  className="gap-1"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novi folder</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Prikaz dokumenata za svaki folder */}
          {folders.map(folder => (
            <TabsContent key={folder} value={folder} className="mt-4">
              <div className={getDocumentViewClass()}>
                {getFilteredDocuments().map(document => renderDocumentCard(document))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
      
      {/* Prikaz dokumenata kad smo u nekom folderu */}
      {currentPath && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {currentPath.split('/').pop()}
            </h2>
            <div className="flex items-center space-x-2">
              {/* Dugmad za promenu prikaza */}
              <RadioGroup
                value={viewMode}
                onValueChange={(value) => setViewMode(value as any)}
                className="flex"
              >
                <div className="flex space-x-1 border rounded-md p-1">
                  <div className="rounded hover:bg-secondary p-1">
                    <RadioGroupItem value="list" id="list-folder" className="hidden" />
                    <Label htmlFor="list-folder" className="cursor-pointer">
                      <List className="h-5 w-5" />
                    </Label>
                  </div>
                  
                  <div className="rounded hover:bg-secondary p-1">
                    <RadioGroupItem value="grid-small" id="grid-small-folder" className="hidden" />
                    <Label htmlFor="grid-small-folder" className="cursor-pointer">
                      <Grid3X3 className="h-5 w-5" />
                    </Label>
                  </div>
                  
                  <div className="rounded hover:bg-secondary p-1">
                    <RadioGroupItem value="grid-medium" id="grid-medium-folder" className="hidden" />
                    <Label htmlFor="grid-medium-folder" className="cursor-pointer">
                      <Grid2X2 className="h-5 w-5" />
                    </Label>
                  </div>
                  
                  <div className="rounded hover:bg-secondary p-1">
                    <RadioGroupItem value="grid-large" id="grid-large-folder" className="hidden" />
                    <Label htmlFor="grid-large-folder" className="cursor-pointer">
                      <LayoutGrid className="h-5 w-5" />
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              
              {/* Dugme za kreiranje novog foldera */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsNewFolderDialogOpen(true)}
                className="gap-1"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Novi folder</span>
              </Button>
            </div>
          </div>
          
          <div className={getDocumentViewClass()}>
            {getFilteredDocuments().map(document => renderDocumentCard(document))}
          </div>
        </div>
      )}
    </div>
  );
}