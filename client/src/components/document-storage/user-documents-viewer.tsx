import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileIcon, 
  FileText, 
  FileImage, 
  FileArchive,
  Download,
  Trash2,
  Folder,
  Loader,
  Info
} from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

interface UserDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  folder: string;
  createdAt: string;
  url: string;
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
    queryKey: ['/storage/user-documents'],
    queryFn: async () => {
      if (!user) {
        throw new Error('Niste prijavljeni');
      }
      
      // Dobijanje svih datoteka iz korisničkog direktorijuma
      const { data: files, error } = await supabase.storage
        .from('user-documents')
        .list(`${user.id}`, {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        throw error;
      }
      
      const userDocs: UserDocument[] = [];
      
      // Za svaki direktorijum (kategoriju) dobiti datoteke
      for (const dir of files || []) {
        if (dir.id && !dir.name.includes('.')) { // Ako je to direktorijum
          const { data: categoryFiles, error: categoryError } = await supabase.storage
            .from('user-documents')
            .list(`${user.id}/${dir.name}`, {
              limit: 1000,
              offset: 0,
              sortBy: { column: 'created_at', order: 'desc' }
            });
            
          if (categoryError) {
            console.error(`Greška pri dobavljanju datoteka iz kategorije ${dir.name}:`, categoryError);
            continue;
          }
          
          // Mapiranje datoteka u format za prikaz
          for (const file of categoryFiles || []) {
            if (file.id && file.name.includes('.')) { // Ako je to datoteka
              const { data: url } = supabase.storage
                .from('user-documents')
                .getPublicUrl(`${user.id}/${dir.name}/${file.name}`);
              
              userDocs.push({
                id: file.id,
                name: file.name,
                size: file.metadata?.size || 0,
                type: file.metadata?.mimetype || 'application/octet-stream',
                path: `${user.id}/${dir.name}/${file.name}`,
                folder: dir.name,
                createdAt: file.created_at || new Date().toISOString(),
                url: url.publicUrl
              });
            }
          }
        }
      }
      
      return userDocs;
    },
    enabled: !!user
  });
  
  // Funkcija za dobijanje informacija o skladištu
  const {
    data: storageInfo,
    isLoading: isLoadingStorage,
    isError: isErrorStorage
  } = useQuery({
    queryKey: ['/storage/user-storage-info'],
    queryFn: async () => {
      // Za potrebe demo verzije, vraćamo fiksne vrednosti
      // U stvarnoj aplikaciji ovo bi se dobijalo od servera
      
      // Pretpostavljamo da FREE korisnik ima 50MB, a PRO korisnik 1GB
      const totalStorage = 50 * 1024 * 1024; // 50MB za FREE korisnike
      const usedStorage = Math.min(totalStorage * 0.3, totalStorage); // 30% iskorišćeno ili manje
      const remainingStorage = totalStorage - usedStorage;
      const usagePercentage = (usedStorage / totalStorage) * 100;
      
      return {
        usedStorage,
        totalStorage,
        remainingStorage,
        usagePercentage
      } as StorageInfo;
    }
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
      
      // Direktno brisanje fajla iz Supabase Storage
      const { error } = await supabase.storage
        .from('user-documents')
        .remove([document.path]);
        
      if (error) {
        throw error;
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
  const handleDownloadDocument = (document: UserDocument) => {
    // Otvaranje novog taba sa URL-om dokumenta
    window.open(document.url, '_blank');
  };
  
  // Funkcija za prikaz ikone na osnovu tipa dokumenta
  const getFileIcon = (document: UserDocument) => {
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
    
    if (!selectedFolder) return documentsData;
    
    return documentsData.filter(doc => doc.folder === selectedFolder);
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
  
  return (
    <div className="space-y-6">
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
      
      {/* Tab navigacija po folderima */}
      {folders.length > 0 && (
        <Tabs 
          value={selectedFolder || folders[0]} 
          onValueChange={setSelectedFolder}
          className="w-full"
        >
          <div className="border-b">
            <TabsList className="flex w-full overflow-x-auto pb-0">
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
          </div>
          
          {/* Prikaz dokumenata za svaki folder */}
          {folders.map(folder => (
            <TabsContent key={folder} value={folder} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredDocuments().map(document => (
                  <Card key={document.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          {getFileIcon(document)}
                          <CardTitle className="ml-2 text-base truncate">{document.name}</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                          {formatDate(new Date(document.createdAt))}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">
                        Veličina: {formatBytes(document.size, 2)}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteDocument(document)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Obriši
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleDownloadDocument(document)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Preuzmi
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}