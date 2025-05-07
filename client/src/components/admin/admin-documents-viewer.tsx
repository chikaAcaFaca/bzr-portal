
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { FileUpload } from '@/components/document-storage/file-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function AdminDocumentsViewer() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState('');

  const { data: adminDocs, isLoading } = useQuery({
    queryKey: ['admin-documents', currentPath],
    queryFn: async () => {
      const response = await fetch(`/api/storage/admin-documents?path=${currentPath}`, {
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
      <h2 className="text-2xl font-bold">Admin Dokumenti</h2>
      <p className="text-muted-foreground">
        Ovo su dokumenti vidljivi samo administratorima sistema.
      </p>
      
      <FileUpload 
        onUploadComplete={() => {}} 
        bucket="admin"
        allowedTypes={['application/pdf', 'image/*', 'application/msword']}
      />

      {isLoading ? (
        <div>Učitavanje...</div>
      ) : (
        <div className="grid gap-4">
          {adminDocs?.files?.map((doc: any) => (
            <Card key={doc.path} className="p-4">
              <div className="flex justify-between items-center">
                <span>{doc.name}</span>
                <Button variant="outline" onClick={() => window.open(doc.url)}>
                  Preuzmi
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
