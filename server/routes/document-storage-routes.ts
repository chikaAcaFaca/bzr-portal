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

// Uvoz postojećih servisa
import { wasabiStorageService } from '../services/wasabi-storage-service';
import { userStorageQuotaService } from '../services/user-storage-quota-service';

export function registerDocumentStorageRoutes(app: Express) {
  // Konfiguracija multer-a za otpremanje fajlova
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // Maksimalna veličina 100MB
    }
  });
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
      
      // Dobavljanje informacija o iskorišćenosti skladišta - koristimo postojeću funkciju
      // i određujemo da li je korisnik PRO ili FREE
      const isPro = req.user.role === 'pro'; // Pretpostavljamo da role postoji u req.user
      const storageInfo = await userStorageQuotaService.getUserStorageInfo(userId.toString(), isPro);
      
      res.json({
        success: true,
        usedStorage: storageInfo.usedSize,
        totalStorage: storageInfo.totalSize,
        remainingStorage: storageInfo.remainingSize,
        usagePercentage: storageInfo.usedPercentage
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

  // Endpoint za otpremanje fajlova
  app.post('/api/storage/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      // Provera autentikacije iz Authorization header-a (Bearer token)
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Nedostaje token autentikacije' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verifikacija tokena kroz Supabase koristeći Express middleware
      // Pretpostavljamo da middleware već postavlja req.user ako je token validan
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'Niste autentifikovani' });
      }
      
      const userId = req.user.id.toString();
      
      // Provera da li je fajl uspešno otpremljen (multer middleware)
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Fajl nije priložen' });
      }
      
      // Provera kategorije/foldera
      const category = req.body.category || 'opsti';
      
      // Određivanje putanje za skladištenje
      const fileName = req.file.originalname;
      const key = `user_${userId}/${category}/${fileName}`;
      
      // Određivanje MIME tipa za fajl
      const contentType = req.file.mimetype || getFileType(fileName);
      
      // Provera da li korisnik ima dovoljno prostora
      const fileSize = req.file.size;
      // Proveravamo tip pretplate iz req.user.role 
      const isPro = req.user.role === 'pro';
      
      const hasSpace = await userStorageQuotaService.hasEnoughSpace(
        userId.toString(),
        fileSize,
        isPro
      );
      
      if (!hasSpace) {
        return res.status(400).json({
          success: false,
          message: 'Nedovoljno prostora za skladištenje. Razmotrite nadogradnju na PRO nalog ili brisanje postojećih fajlova.'
        });
      }
      
      // Otpremanje fajla na Wasabi
      const uploadResult = await wasabiStorageService.uploadFile(
        key,
        req.file.buffer,
        contentType
      );
      
      // Kreiranje URL-a za pristup fajlu
      const fileUrl = `${process.env.WASABI_ENDPOINT}/${process.env.WASABI_USER_DOCUMENTS_BUCKET}/${key}`;
      
      res.json({
        success: true,
        message: 'Fajl je uspešno otpremljen',
        fileData: {
          id: uploadResult.ETag?.replace(/"/g, '') || key,
          name: fileName,
          size: fileSize,
          type: contentType,
          path: key,
          folder: category,
          createdAt: new Date().toISOString(),
          url: fileUrl
        }
      });
      
    } catch (error: any) {
      console.error('Greška pri otpremanju fajla:', error);
      res.status(500).json({
        success: false,
        message: 'Došlo je do greške pri otpremanju fajla',
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
      
      // Nakon brisanja dokumenta, ne moramo ažurirati iskorišćenost skladišta
      // jer se to računa prilikom sledećeg dobijanja informacija o skladištu
      // Ova operacija je samo za demonstraciju
      console.log(`Dokument ${path} uspešno obrisan za korisnika ${userId}`);
      
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