import { Request, Response } from 'express';
import { Express } from 'express';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { WasabiStorageService } from '../services/wasabi-storage-service';
import { UserStorageQuotaService } from '../services/user-storage-quota-service';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { storage as appStorage } from '../storage';

// Konfiguracija za Wasabi S3 storage
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ''
  },
  region: process.env.WASABI_REGION || 'eu-west-2',
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.eu-west-2.wasabisys.com',
  forcePathStyle: true // Path-style URLs (potrebno za Wasabi)
});

// Konfigurisanje Wasabi storage servisa
const wasabiStorageService = new WasabiStorageService(
  process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-portal-user-documents',
  process.env.WASABI_ACCESS_KEY_ID || '',
  process.env.WASABI_SECRET_ACCESS_KEY || '',
  process.env.WASABI_REGION || 'eu-west-2',
  process.env.WASABI_ENDPOINT || 'https://s3.eu-west-2.wasabisys.com'
);

// Servis za praćenje i upravljanje korisničkom kvotom skladišta
const userStorageQuotaService = new UserStorageQuotaService(appStorage);

export function registerDocumentStorageRoutes(app: Express) {
  // Endpoint za dobijanje liste korisničkih dokumenata
  app.get('/api/user-documents', async (req: Request, res: Response) => {
    try {
      // Provera autentikacije
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Niste prijavljeni' });
      }

      const userId = req.user.id;
      const userPrefix = `user_${userId}/`;

      // Dobavljanje liste objekata iz Wasabi bucket-a za trenutnog korisnika
      const command = new ListObjectsV2Command({
        Bucket: process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-portal-user-documents',
        Prefix: userPrefix
      });

      const response = await s3.send(command);
      
      // Transformisanje odgovora u format za klijent stranu
      const documents = (response.Contents || [])
        .filter(item => item.Key && !item.Key.endsWith('/')) // Ignorisanje folder objekata
        .map(item => {
          // Izvlačenje imena folder i fajla iz ključa
          const key = item.Key as string;
          const relativePath = key.replace(userPrefix, '');
          const parts = relativePath.split('/');
          
          // Folder je sve osim poslednjeg dela puta
          const folderPath = parts.slice(0, -1).join('/');
          const folderName = folderPath || 'Opšti dokumenti';
          
          // Ime fajla je poslednji deo puta
          const fileName = parts[parts.length - 1];
          
          // Generisanje URL-a za preuzimanje (preSign URL)
          const url = `${process.env.WASABI_ENDPOINT}/${process.env.WASABI_USER_DOCUMENTS_BUCKET}/${key}`;
          
          return {
            id: item.ETag?.replace(/"/g, '') || key,
            name: fileName,
            size: item.Size || 0,
            type: getFileType(fileName),
            path: key,
            folder: folderName,
            createdAt: item.LastModified || new Date().toISOString(),
            url: url
          };
        });
      
      res.json({
        success: true,
        documents
      });
      
    } catch (error: any) {
      console.error('Greška pri dobavljanju dokumenata:', error);
      res.status(500).json({
        success: false,
        message: 'Došlo je do greške pri dobavljanju dokumenata',
        error: error.message
      });
    }
  });

  // Endpoint za dobijanje informacija o iskorišćenosti skladišta
  app.get('/api/user-storage-info', async (req: Request, res: Response) => {
    try {
      // Provera autentikacije
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Niste prijavljeni' });
      }

      const userId = req.user.id;
      
      // Dobavljanje informacija o iskorišćenosti skladišta
      const storageUsage = await userStorageQuotaService.getUserStorageUsage(userId);
      const storageQuota = await userStorageQuotaService.getUserStorageQuota(userId);
      
      res.json({
        success: true,
        usedStorage: storageUsage,
        totalStorage: storageQuota,
        remainingStorage: Math.max(0, storageQuota - storageUsage)
      });
      
    } catch (error: any) {
      console.error('Greška pri dobavljanju informacija o skladištu:', error);
      res.status(500).json({
        success: false,
        message: 'Došlo je do greške pri dobavljanju informacija o skladištu',
        error: error.message
      });
    }
  });

  // Endpoint za brisanje dokumenta
  app.delete('/api/user-documents/:documentId', async (req: Request, res: Response) => {
    try {
      // Provera autentikacije
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Niste prijavljeni' });
      }

      const userId = req.user.id;
      const { documentId } = req.params;
      const { path } = req.body;
      
      if (!path) {
        return res.status(400).json({ success: false, message: 'Nedostaje putanja dokumenta' });
      }
      
      // Provera da li dokument pripada korisniku (preko putanje)
      const userPrefix = `user_${userId}/`;
      if (!path.startsWith(userPrefix)) {
        return res.status(403).json({ success: false, message: 'Nemate pravo da obrišete ovaj dokument' });
      }
      
      // Brisanje dokumenta iz Wasabi bucket-a
      const command = new DeleteObjectCommand({
        Bucket: process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-portal-user-documents',
        Key: path
      });
      
      await s3.send(command);
      
      // Ažuriranje iskorišćenosti skladišta (Wasabi ne pruža stvarnu veličinu nakon brisanja, 
      // pa bi trebalo voditi evidenciju negde drugde)
      await userStorageQuotaService.updateUserStorageUsage(userId);
      
      res.json({
        success: true,
        message: 'Dokument je uspešno obrisan'
      });
      
    } catch (error: any) {
      console.error('Greška pri brisanju dokumenta:', error);
      res.status(500).json({
        success: false,
        message: 'Došlo je do greške pri brisanju dokumenta',
        error: error.message
      });
    }
  });
}

// Pomoćna funkcija za određivanje tipa fajla na osnovu ekstenzije
function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}