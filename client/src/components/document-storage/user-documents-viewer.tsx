import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FolderIcon, FileIcon, ImageIcon, FileTextIcon, Trash2Icon, DownloadIcon, FolderOpenIcon, ArrowUpIcon, EyeIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatFileSize as formatBytes, formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Tipovi za dokumente
interface UserDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  folder: string;
  createdAt: string;
  url?: string;
}

// Hook za dohvatanje dokumenata korisnika
function useUserDocuments() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['/api/user-documents'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user-documents');
        const data = await res.json();
        
        if (data.success) {
          return data.documents as UserDocument[];
        } else {
          toast({
            title: 'Greška',
            description: data.message || 'Došlo je do greške pri učitavanju dokumenata',
            variant: 'destructive',
          });
          return [];
        }
      } catch (error) {
        console.error('Error fetching user documents:', error);
        toast({
          title: 'Greška pri povezivanju',
          description: 'Nije moguće povezati se sa serverom. Proverite internet konekciju.',
          variant: 'destructive',
        });
        return [];
      }
    },
  });
}

// Hook za dohvatanje informacija o skladištu
function useStorageInfo() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['/api/user-storage-info'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user-storage-info');
        const data = await res.json();
        
        if (data.success) {
          return {
            usedStorage: data.usedStorage,
            totalStorage: data.totalStorage,
            usagePercentage: (data.usedStorage / data.totalStorage) * 100,
          };
        } else {
          toast({
            title: 'Greška',
            description: data.message || 'Došlo je do greške pri učitavanju informacija o skladištu',
            variant: 'destructive',
          });
          return {
            usedStorage: 0,
            totalStorage: 0,
            usagePercentage: 0,
          };
        }
      } catch (error) {
        console.error('Error fetching storage info:', error);
        toast({
          title: 'Greška pri povezivanju',
          description: 'Nije moguće povezati se sa serverom. Proverite internet konekciju.',
          variant: 'destructive',
        });
        return {
          usedStorage: 0,
          totalStorage: 0,
          usagePercentage: 0,
        };
      }
    },
  });
}

// Komponenta za prikaz dokumenta
const DocumentPreview = ({ document, onClose }: { document: UserDocument, onClose: () => void }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Određivanje tipa dokumenta za prikaz
  const isImage = document.type.startsWith('image/');
  const isPdf = document.type === 'application/pdf';
  const isText = document.type === 'text/plain' || document.type === 'text/html' || document.type === 'text/css' || document.type === 'text/javascript';
  
  useEffect(() => {
    // Simuliramo učitavanje
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{document.name}</DialogTitle>
          <DialogDescription>
            {formatBytes(document.size)} • {formatDate(document.createdAt)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {isImage && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md p-4 overflow-auto">
                  <img src={document.url} alt={document.name} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              
              {isPdf && (
                <iframe 
                  src={`${document.url}#toolbar=0`} 
                  className="w-full h-full border-0 rounded-md"
                  title={document.name}
                ></iframe>
              )}
              
              {!isImage && !isPdf && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md p-8">
                  <div className="text-center">
                    <FileIcon size={64} className="mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">{document.name}</h3>
                    <p className="text-muted-foreground">
                      Ovaj tip datoteke ne može biti prikazan direktno u pregledaču.
                    </p>
                    <Button 
                      variant="default" 
                      className="mt-4"
                      onClick={() => window.open(document.url, '_blank')}
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Preuzmi datoteku
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onClose}>Zatvori</Button>
          <Button onClick={() => window.open(document.url, '_blank')}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Preuzmi
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
};

// Komponenta za prikaz liste dokumenata
export function UserDocumentsViewer() {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  
  const { data: documents = [], isLoading, isError, refetch } = useUserDocuments();
  const { data: storageInfo, isLoading: isStorageLoading } = useStorageInfo();
  
  // Dobavljanje jedinstvenih foldera
  const folders = React.useMemo(() => {
    const folderSet = new Set<string>();
    documents.forEach(doc => folderSet.add(doc.folder));
    return Array.from(folderSet).sort();
  }, [documents]);
  
  // Filtriranje dokumenata po folderu i pretrazi
  const filteredDocuments = React.useMemo(() => {
    return documents.filter(doc => {
      const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder;
      const matchesSearch = !searchQuery || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFolder && matchesSearch;
    });
  }, [documents, selectedFolder, searchQuery]);
  
  // Grupisanje dokumenata po folderu
  const groupedDocuments = React.useMemo(() => {
    const groups: Record<string, UserDocument[]> = {};
    
    filteredDocuments.forEach(doc => {
      if (!groups[doc.folder]) {
        groups[doc.folder] = [];
      }
      groups[doc.folder].push(doc);
    });
    
    return groups;
  }, [filteredDocuments]);
  
  // Funkcija za određivanje ikone na osnovu tipa datoteke
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (type === 'application/pdf') return <FileTextIcon className="h-8 w-8 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileTextIcon className="h-8 w-8 text-blue-700" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileTextIcon className="h-8 w-8 text-green-600" />;
    return <FileIcon className="h-8 w-8 text-gray-500" />;
  };
  
  const handlePreviewDocument = (document: UserDocument) => {
    setSelectedDocument(document);
  };
  
  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Greška pri učitavanju</AlertTitle>
        <AlertDescription>
          Nije moguće učitati listu dokumenata. Molimo vas da pokušate ponovo kasnije ili kontaktirajte podršku.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {selectedDocument && (
        <DocumentPreview 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)} 
        />
      )}
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex-1 w-full md:w-auto">
          <Input
            placeholder="Pretraži dokumente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select 
            value={selectedFolder} 
            onValueChange={setSelectedFolder}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi folderi</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder} value={folder}>{folder}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            title="Osveži listu"
          >
            <ArrowUpIcon className="h-4 w-4 rotate-0" />
          </Button>
        </div>
      </div>
      
      {/* Prikaz informacija o skladištu */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Iskorišćenost skladišta</CardTitle>
        </CardHeader>
        <CardContent>
          {isStorageLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>{formatBytes(storageInfo?.usedStorage || 0)} iskorišćeno</span>
                  <span>{formatBytes(storageInfo?.totalStorage || 0)} ukupno</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.min(storageInfo?.usagePercentage || 0, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(storageInfo?.usagePercentage || 0)}% iskorišćeno
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="grid" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Vaši dokumenti</h2>
          <TabsList>
            <TabsTrigger value="grid" className="px-3">
              <div className="grid grid-cols-2 gap-1 w-5 h-5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="list" className="px-3">
              <div className="flex flex-col gap-1 w-5 h-5 justify-center">
                <div className="bg-current h-[2px] rounded-sm"></div>
                <div className="bg-current h-[2px] rounded-sm"></div>
                <div className="bg-current h-[2px] rounded-sm"></div>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>
      
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <Skeleton className="h-8 w-8 rounded mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="p-3 bg-secondary rounded-full mb-3">
                <FolderOpenIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-1">Nema pronađenih dokumenata</h3>
              {searchQuery ? (
                <p className="text-center text-muted-foreground max-w-md">
                  Nije pronađen nijedan dokument koji odgovara pretrazi "{searchQuery}". 
                  Pokušajte sa drugačijim pojmom za pretragu.
                </p>
              ) : selectedFolder !== 'all' ? (
                <p className="text-center text-muted-foreground max-w-md">
                  Nema dokumenata u folderu "{selectedFolder}". Izaberite drugi folder ili prikažite sve dokumente.
                </p>
              ) : (
                <p className="text-center text-muted-foreground max-w-md">
                  Još uvek nemate nijedan dokument. Dokumenti koje učitate kroz portal biće prikazani ovde.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="grid" className="mt-0">
              {/* Grid prikaz */}
              {selectedFolder === 'all' ? (
                // Prikaz grupisanih dokumenata po folderima
                <>
                  {Object.entries(groupedDocuments).map(([folder, docs]) => (
                    <div key={folder} className="mb-6">
                      <div className="flex items-center mb-3">
                        <FolderIcon className="h-5 w-5 text-muted-foreground mr-2" />
                        <h3 className="font-medium">{folder}</h3>
                        <span className="ml-2 text-xs text-muted-foreground">({docs.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {docs.map(doc => (
                          <Card 
                            key={doc.id} 
                            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handlePreviewDocument(doc)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                {getFileIcon(doc.type)}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                                      <span className="sr-only">Otvori meni</span>
                                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                        <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                      </svg>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewDocument(doc);
                                    }}>
                                      <EyeIcon className="mr-2 h-4 w-4" />
                                      <span>Pregledaj</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(doc.url, '_blank');
                                    }}>
                                      <DownloadIcon className="mr-2 h-4 w-4" />
                                      <span>Preuzmi</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Ovde bi trebalo dodati logiku za brisanje dokumenta
                                        console.log('Brisanje dokumenta:', doc.id);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2Icon className="mr-2 h-4 w-4" />
                                      <span>Obriši</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <h4 className="font-medium text-sm line-clamp-1" title={doc.name}>{doc.name}</h4>
                              <div className="flex justify-between mt-2">
                                <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                                <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                // Prikaz pojedinačnih dokumenata za izabrani folder
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredDocuments.map(doc => (
                    <Card 
                      key={doc.id} 
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handlePreviewDocument(doc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          {getFileIcon(doc.type)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                                <span className="sr-only">Otvori meni</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                  <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewDocument(doc);
                              }}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                <span>Pregledaj</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.url, '_blank');
                              }}>
                                <DownloadIcon className="mr-2 h-4 w-4" />
                                <span>Preuzmi</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Ovde bi trebalo dodati logiku za brisanje dokumenta
                                  console.log('Brisanje dokumenta:', doc.id);
                                }}
                                className="text-red-600"
                              >
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                <span>Obriši</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h4 className="font-medium text-sm line-clamp-1" title={doc.name}>{doc.name}</h4>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                          <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              {/* Tabelarni prikaz */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Naziv</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Folder</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Veličina</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Datum</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Akcije</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map(doc => (
                          <tr 
                            key={doc.id} 
                            className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                            onClick={() => handlePreviewDocument(doc)}
                          >
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                {getFileIcon(doc.type)}
                                <span className="line-clamp-1">{doc.name}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-1">
                                <FolderIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{doc.folder}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">{formatBytes(doc.size)}</td>
                            <td className="p-4 align-middle">{new Date(doc.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 align-middle">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewDocument(doc);
                                  }}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(doc.url, '_blank');
                                  }}
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Ovde bi trebalo dodati logiku za brisanje dokumenta
                                    console.log('Brisanje dokumenta:', doc.id);
                                  }}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}