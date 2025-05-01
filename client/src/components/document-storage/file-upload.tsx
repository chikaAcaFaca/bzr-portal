import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, X, Info, Loader } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('opsti');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lista kategorija dokumenata
  const categories = [
    { id: 'opsti', name: 'Opšti dokumenti' },
    { id: 'sistematizacija', name: 'Sistematizacija' },
    { id: 'opis_poslova', name: 'Opisi poslova' },
    { id: 'obuke', name: 'Obuke' },
    { id: 'lekarski', name: 'Lekarski pregledi' },
    { id: 'dopisi', name: 'Dopisi i komunikacija' },
    { id: 'evidencije', name: 'Evidencije' }
  ];
  
  // Handler za izbor fajlova
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };
  
  // Handler za otkazivanje izbora fajlova
  const handleCancelSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handler za upload fajlova
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Nema izabranih fajlova',
        description: 'Molimo vas da izaberete bar jedan fajl za otpremanje',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const totalFiles = selectedFiles.length;
      let uploadedFiles = 0;
      
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', selectedCategory);
          
          // Slanje zahteva za otpremanje
          const response = await fetch('/api/storage/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          // Ažuriranje progresa za ovaj fajl
          uploadedFiles++;
          setProgress((uploadedFiles / totalFiles) * 100);
          
          if (!response.ok) {
            throw new Error(`Greška (${response.status}): ${response.statusText}`);
          }
          
          // Sve je prošlo u redu za ovaj fajl
        } catch (error) {
          console.error(`Greška pri otpremanju fajla ${file.name}:`, error);
          // Nastavljamo sa sledećim fajlom umesto da prekinemo ceo proces
        }
      }
      
      // Ako je bar jedan fajl uspešno otpremljen
      if (uploadedFiles > 0) {
        toast({
          title: 'Otpremanje završeno',
          description: `${uploadedFiles} od ${totalFiles} fajlova uspešno otpremljeno`,
          variant: 'default'
        });
        
        // Resetovanje forme
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Pozivanje callback-a ako postoji
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        // Nijedan fajl nije uspešno otpremljen
        toast({
          title: 'Greška pri otpremanju',
          description: 'Nijedan fajl nije uspešno otpremljen',
          variant: 'destructive'
        });
      }
      
    } catch (error: any) {
      toast({
        title: 'Greška pri otpremanju',
        description: error.message || 'Došlo je do greške prilikom otpremanja fajlova',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Otpremanje dokumenata</CardTitle>
        <CardDescription>
          Izaberite fajlove koje želite da otpremite u vaše skladište
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="category">Kategorija dokumenta</Label>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            disabled={isUploading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Izaberite kategoriju" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Dokumenti će biti organizovani prema izabranoj kategoriji
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="file-upload">Dokumenti za otpremanje</Label>
          
          {selectedFiles.length === 0 ? (
            <div className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary transition-colors"
                 onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Kliknite ovde da izaberete fajlove</p>
              <p className="text-xs text-muted-foreground mt-1">
                Podržani formati: PDF, Word, Excel, slika...
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isUploading}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Izabrani fajlovi ({selectedFiles.length})</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelSelection}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Poništi izbor
                </Button>
              </div>
              
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3">
                    <div className="flex items-center space-x-2">
                      <File className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size, 2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center">
                <Loader className="h-4 w-4 mr-2 animate-spin" /> 
                Otpremanje u toku...
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <div className="bg-blue-50 rounded-md p-3 text-sm flex items-start space-x-2">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium">Zapamtite</p>
            <ul className="list-disc list-inside text-xs mt-1 space-y-1">
              <li>Maksimalna veličina pojedinačnog fajla je 100MB</li>
              <li>Svi podaci se bezbedno čuvaju</li>
              <li>Nakon otpremanja, dokumenti će biti dostupni u odgovarajućoj kategoriji</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          variant="default" 
          onClick={handleUpload} 
          disabled={selectedFiles.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Otpremanje...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Otpremi dokumente
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}