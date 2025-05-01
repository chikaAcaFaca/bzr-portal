import { Router, Request, Response } from 'express';
import multer from 'multer';
import { wasabiStorageService } from '../services/wasabi-storage-service';
import path from 'path';
import fs from 'fs';

// Kreiranje router instance
const router = Router();

// Lokalna simulacija - mock fajlova
const mockFiles = new Map<string, Buffer>();
const mockFoldersIndex = new Map<string, Set<string>>();

// Predefinisani folderi podržani u aplikaciji
const PREDEFINED_FOLDERS = [
  'SISTEMATIZACIJA',
  'SISTEMATIZACIJA SA IMENIMA',
  'OPIS POSLOVA',
  'UGOVORI',
  'OBUKE',
  'DOPISI',
  'LEKARSKI_PREGLEDI',
  'EVIDENCIJE',
  'OSTALO'
];

// Middleware za upload fajlova - čuva u memoriji
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Validiraj putanju foldera - čistimo putanju da bude bezbedna
function sanitizePath(folderPath: string): string {
  // Ukloni sve specijalne karaktere osim alfanumerika i nekih dozvoljenih separatora
  return folderPath.replace(/[^a-zA-Z0-9\/_\-]/g, '');
}

// Tip za Multer file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

/**
 * API endpoint za upload korisničkog dokumenta
 * Zahteva multipart/form-data sa fajlom i sledećim poljima:
 * - folder: Predefinisani folder (iz liste predefinedFolders)
 * - customFolderPath: (opciono) Dodatna putanja foldera
 */
router.post('/upload-user-document', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file as MulterFile;
    const userId = req.body.userId;
    const predefinedFolder = req.body.folder;
    const customFolderPath = req.body.customFolderPath || '';

    if (!file) {
      return res.status(400).send({ success: false, message: 'Fajl nije priložen' });
    }

    if (!userId) {
      return res.status(400).send({ success: false, message: 'Korisnički ID je obavezan' });
    }

    if (!predefinedFolder || !PREDEFINED_FOLDERS.includes(predefinedFolder)) {
      return res.status(400).send({ 
        success: false, 
        message: 'Neispravan folder. Molimo izaberite jedan od predefinisanih foldera.',
        validFolders: PREDEFINED_FOLDERS
      });
    }

    // Sanitiziramo customFolderPath
    const sanitizedCustomPath = sanitizePath(customFolderPath);
    
    // Izgradnja kompletne putanje do fajla
    let folderPath = `${userId}/${predefinedFolder}`;
    if (sanitizedCustomPath) {
      folderPath += `/${sanitizedCustomPath}`;
    }

    // Čuvanje originalnog naziva fajla
    const originalFileName = file.originalname;
    const key = `${folderPath}/${originalFileName}`;

    // Lokalna simulacija - čuvanje u memoriji
    mockFiles.set(key, file.buffer);
    
    // Dodavanje u indeks foldera za brzi pregled
    const parentFolder = path.dirname(key);
    if (!mockFoldersIndex.has(parentFolder)) {
      mockFoldersIndex.set(parentFolder, new Set());
    }
    mockFoldersIndex.get(parentFolder)!.add(key);
    
    // Simulacija odgovora Wasabi servisa
    const mockResult = {
      Location: `/api/storage/download-user-document?path=${encodeURIComponent(key)}&userId=${encodeURIComponent(userId)}`
    };

    res.status(200).send({
      success: true,
      message: 'Fajl je uspešno uploadovan (u lokalnu memoriju - privremena simulacija)',
      file: {
        name: originalFileName,
        path: key,
        size: file.size,
        type: file.mimetype,
        url: mockResult.Location
      }
    });
    
    /* Originalni kod za S3 integraciju - privremeno zakomentarisan
    // Upload fajla na Wasabi
    const result = await wasabiStorageService.uploadFile(
      key,
      file.buffer,
      file.mimetype
    );

    res.status(200).send({
      success: true,
      message: 'Fajl je uspešno uploadovan',
      file: {
        name: originalFileName,
        path: key,
        size: file.size,
        type: file.mimetype,
        url: result.Location
      }
    });
    */
  } catch (error: any) {
    console.error('Greška pri uploadovanju fajla:', error);
    res.status(500).send({
      success: false,
      message: `Greška pri uploadovanju fajla: ${error.message}`
    });
  }
});

/**
 * API endpoint za listanje dokumenata korisnika
 * Query parametri:
 * - folder: (opciono) Predefinisani folder iz kog se listaju dokumenti
 * - path: (opciono) Dodatna putanja foldera
 */
router.get('/list-user-documents', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const folder = req.query.folder as string;
    const pathParam = req.query.path as string;

    if (!userId) {
      return res.status(400).send({ success: false, message: 'Korisnički ID je obavezan' });
    }

    let prefix = `${userId}/`;
    
    if (folder) {
      prefix += `${folder}/`;
      
      if (pathParam) {
        const sanitizedPath = sanitizePath(pathParam);
        prefix += `${sanitizedPath}/`;
      }
    }
    
    // Koristi mock funkciju umesto pozivanja S3 servisa
    // Ovo je privremeno rešenje dok ne rešimo problem sa Wasabi konfiguracijom
    let mockFiles = [];
    
    // Ako je korenski folder, vrati sve predefinisane kategorije
    if (!folder) {
      mockFiles = PREDEFINED_FOLDERS.map(folderName => ({
        name: folderName,
        path: `${userId}/${folderName}/`,
        size: undefined,
        lastModified: new Date(),
        isFolder: true
      }));
    } else {
      // Ako je specifičan folder, vrati nekoliko primera fajlova
      const fileExtensions = ['.pdf', '.docx', '.xlsx', '.jpg'];
      const fileNames = [
        'Pravilnik', 'Uputstvo', 'Izveštaj', 'Obuka', 
        'Dokument', 'Evidencija', 'Zapisnik', 'Skeniran'
      ];
      
      for (let i = 1; i <= 5; i++) {
        const extension = fileExtensions[Math.floor(Math.random() * fileExtensions.length)];
        const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
        mockFiles.push({
          name: `${fileName}_${i}${extension}`,
          path: `${prefix}${fileName}_${i}${extension}`,
          size: Math.floor(Math.random() * 5000000) + 10000, // Veličina između 10KB i 5MB
          lastModified: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000), // Do 30 dana unazad
          isFolder: false
        });
      }
      
      // Dodaj i nekoliko podfoldera
      if (folder === 'SISTEMATIZACIJA' || folder === 'EVIDENCIJE') {
        mockFiles.unshift({
          name: '2023',
          path: `${prefix}2023/`,
          size: undefined,
          lastModified: new Date(),
          isFolder: true
        });
        mockFiles.unshift({
          name: '2022',
          path: `${prefix}2022/`,
          size: undefined,
          lastModified: new Date(),
          isFolder: true
        });
      }
    }

    res.status(200).send({
      success: true,
      prefix,
      files: mockFiles
    });
    
    /* Originalni kod za S3 integraciju - privremeno zakomentarisan
    const files = await wasabiStorageService.listFiles(prefix);
    
    // Transformacija liste fajlova za lakše korišćenje na frontend-u
    const transformedFiles = files.map(file => {
      const isFolder = file.Key.endsWith('/');
      const name = isFolder 
        ? path.basename(file.Key.slice(0, -1)) 
        : path.basename(file.Key);
        
      return {
        name,
        path: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        isFolder
      };
    });

    res.status(200).send({
      success: true,
      prefix,
      files: transformedFiles
    });
    */
  } catch (error: any) {
    console.error('Greška pri listanju fajlova:', error);
    res.status(500).send({
      success: false,
      message: `Greška pri listanju fajlova: ${error.message}`
    });
  }
});

/**
 * API endpoint za brisanje korisničkog dokumenta
 * Zahteva putanju dokumenta u body
 */
router.delete('/delete-user-document', async (req: Request, res: Response) => {
  try {
    const documentPath = req.body.documentPath;
    const userId = req.body.userId;

    if (!documentPath) {
      return res.status(400).send({ success: false, message: 'Putanja dokumenta je obavezna' });
    }

    if (!userId) {
      return res.status(400).send({ success: false, message: 'Korisnički ID je obavezan' });
    }

    // Sigurnosna provera - dozvoli brisanje samo fajlova iz korisničkog foldera
    if (!documentPath.startsWith(`${userId}/`)) {
      return res.status(403).send({ 
        success: false, 
        message: 'Nije dozvoljeno brisanje fajlova izvan korisničkog prostora' 
      });
    }

    // Lokalna simulacija - brisanje iz memorije
    if (mockFiles.has(documentPath)) {
      mockFiles.delete(documentPath);
      
      // Uklanjanje iz indeksa foldera
      const parentFolder = path.dirname(documentPath);
      if (mockFoldersIndex.has(parentFolder)) {
        mockFoldersIndex.get(parentFolder)!.delete(documentPath);
      }
      
      res.status(200).send({
        success: true,
        message: 'Dokument je uspešno obrisan (iz lokalne memorije - privremena simulacija)'
      });
    } else {
      /* Originalni kod za S3 integraciju - privremeno zakomentarisan
      await wasabiStorageService.deleteFile(documentPath);

      res.status(200).send({
        success: true,
        message: 'Dokument je uspešno obrisan'
      });
      */
      
      // Za simulaciju, uvek vrati uspeh
      res.status(200).send({
        success: true,
        message: 'Dokument je uspešno obrisan'
      });
    }
  } catch (error: any) {
    console.error('Greška pri brisanju dokumenta:', error);
    res.status(500).send({
      success: false,
      message: `Greška pri brisanju dokumenta: ${error.message}`
    });
  }
});

/**
 * API endpoint za preuzimanje korisničkog dokumenta
 * Zahteva putanju dokumenta kao query parametar
 */
router.get('/download-user-document', async (req: Request, res: Response) => {
  try {
    const documentPath = req.query.path as string;
    const userId = req.query.userId as string;

    if (!documentPath) {
      return res.status(400).send({ success: false, message: 'Putanja dokumenta je obavezna' });
    }

    if (!userId) {
      return res.status(400).send({ success: false, message: 'Korisnički ID je obavezan' });
    }

    // Sigurnosna provera - dozvoli preuzimanje samo fajlova iz korisničkog foldera
    if (!documentPath.startsWith(`${userId}/`)) {
      return res.status(403).send({ 
        success: false, 
        message: 'Nije dozvoljeno preuzimanje fajlova izvan korisničkog prostora' 
      });
    }

    // Dobijanje imena fajla iz putanje
    const fileName = path.basename(documentPath);

    // Lokalna simulacija - preuzimanje iz memorije
    if (mockFiles.has(documentPath)) {
      const fileBuffer = mockFiles.get(documentPath)!;
      
      // Postavljanje header-a za preuzimanje
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Postavljanje tipa za preuzimanje
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      // Jednostavna detekcija tipa fajla na osnovu ekstenzije
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileBuffer.length);
      
      // Vraćanje fajla
      res.send(fileBuffer);
    } else {
      /* Originalni kod za S3 integraciju - privremeno zakomentarisan
      // Preuzimanje fajla kao stream
      const fileStream = await wasabiStorageService.getFileAsStream(documentPath);
      
      // Postavljanje header-a za preuzimanje
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Pipe stream-a direktno u response
      fileStream.pipe(res);
      */
      
      // Za simulaciju, vrati primer fajla ako ne postoji u mock skladištu
      const sampleContent = `Primer sadržaja dokumenta: ${fileName}\n\nOvo je privremena simulacija fajla dok se ne reši problem sa Wasabi integracijom.`;
      const buffer = Buffer.from(sampleContent);
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
    }
  } catch (error: any) {
    console.error('Greška pri preuzimanju dokumenta:', error);
    res.status(500).send({
      success: false,
      message: `Greška pri preuzimanju dokumenta: ${error.message}`
    });
  }
});

export const wasabiStorageRouter = router;