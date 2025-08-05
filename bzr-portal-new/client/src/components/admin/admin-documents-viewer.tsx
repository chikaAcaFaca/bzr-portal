
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { FileUpload } from '@/components/document-storage/file-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DOCUMENT_CATEGORIES = {
  LAWS: 'zakoni',
  REGULATIONS: 'pravilnici',
  DIRECTIVES: 'direktive',
  GUIDELINES: 'uputstva',
  OTHER: 'ostalo'
};

export function AdminDocumentsViewer() {
  const { user } = useAuth();
  const [currentCategory, setCurrentCategory] = useState(DOCUMENT_CATEGORIES.LAWS);

  const { data: adminDocs, isLoading } = useQuery({
    queryKey: ['admin-documents', currentCategory],
    queryFn: async () => {
      const response = await fetch(`/api/storage/admin-documents?category=${currentCategory}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch admin documents');
      return response.json();
    },
    enabled: user?.role === 'admin'
  });

  if (user?.role !== 'admin') {
    return (
      <Card className="p-4">
        <p>Pristup admin dokumentima nije dozvoljen.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Baza Znanja - Admin Dokumenti</h2>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Osveži
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        Ovde možete upravljati dokumentima koji čine bazu znanja sistema (zakoni, pravilnici, direktive, uputstva).
        Ovi dokumenti će biti dostupni AI agentu za generisanje odgovora.
      </p>
      
      <Tabs defaultValue={DOCUMENT_CATEGORIES.LAWS} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value={DOCUMENT_CATEGORIES.LAWS} onClick={() => setCurrentCategory(DOCUMENT_CATEGORIES.LAWS)}>
            Zakoni
          </TabsTrigger>
          <TabsTrigger value={DOCUMENT_CATEGORIES.REGULATIONS} onClick={() => setCurrentCategory(DOCUMENT_CATEGORIES.REGULATIONS)}>
            Pravilnici
          </TabsTrigger>
          <TabsTrigger value={DOCUMENT_CATEGORIES.DIRECTIVES} onClick={() => setCurrentCategory(DOCUMENT_CATEGORIES.DIRECTIVES)}>
            Direktive
          </TabsTrigger>
          <TabsTrigger value={DOCUMENT_CATEGORIES.GUIDELINES} onClick={() => setCurrentCategory(DOCUMENT_CATEGORIES.GUIDELINES)}>
            Uputstva
          </TabsTrigger>
          <TabsTrigger value={DOCUMENT_CATEGORIES.OTHER} onClick={() => setCurrentCategory(DOCUMENT_CATEGORIES.OTHER)}>
            Ostalo
          </TabsTrigger>
        </TabsList>

        {Object.values(DOCUMENT_CATEGORIES).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <FileUpload 
              onUploadComplete={() => {}} 
              bucket="admin"
              category={category}
              allowedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
            />

            {isLoading ? (
              <div>Učitavanje...</div>
            ) : (
              <div className="grid gap-4">
                {adminDocs?.files?.map((doc: any) => (
                  <Card key={doc.path} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{doc.name}</span>
                        <p className="text-sm text-muted-foreground">
                          Dodat: {new Date(doc.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.open(doc.url)}>
                          Preuzmi
                        </Button>
                        <Button variant="destructive" onClick={() => {
                          if (confirm('Da li ste sigurni da želite da obrišete ovaj dokument?')) {
                            // Handle delete
                          }
                        }}>
                          Obriši
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
