import React from 'react';
import { FileTransliterator } from '@/components/file-upload/transliterator';

export default function FileUtilsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Алати за рад са документима</h1>
      <p className="text-muted-foreground mb-6">
        Овде се налазе корисни алати који вам помажу да припремите документе пре отпремања на БЗР портал.
      </p>
      
      <div className="grid gap-6">
        <FileTransliterator />
      </div>
    </div>
  );
}