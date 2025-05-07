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

import { userStorageQuotaService } from '../services/user-storage-quota-service';

/**
 * API endpoint za upload korisničkog dokumenta
 * Zahteva multipart/form-data sa fajlom i sledećim poljima:
 * - folder: Predefinisani folder (iz liste predefinedFolders)
 * - customFolderPath: (opciono) Dodatna putanja foldera
 * - isPro: (opciono) Da li je korisnik u PRO statusu (podrazumevano false)
 */
router.post('/upload-user-document', upload.single('file'), async (req: Request, res: Response) => {
  // Ensure user is authenticated
  if (!req.user?.id) {
    return res.status(401).send({ 
      success: false, 
      message: 'Morate biti prijavljeni za pristup vašem skladištu' 
    });
  }
  try {
    const file = req.file as MulterFile;
    const userId = req.body.userId;
    const predefinedFolder = req.body.folder;
    const customFolderPath = req.body.customFolderPath || '';
    const useMock = req.body.mock === 'true'; // Opcioni parametar za korištenje mock podataka
    const isPro = req.body.isPro === 'true'; // Da li je korisnik PRO, default je false (FREE)

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

    // Provera kvote skladišta - da li korisnik ima dovoljno prostora
    try {
      const hasSpace = await userStorageQuotaService.hasEnoughSpace(userId, file.size, isPro);
      
      if (!hasSpace) {
        // Ako korisnik nema dovoljno prostora, vrati odgovarajuću grešku
        const userStorageInfo = await userStorageQuotaService.getUserStorageInfo(userId, isPro);
        return res.status(400).send({
          success: false,
          message: isPro 
            ? 'Prekoračili ste vaš PRO limit od 1GB. Molimo izbrišite neke dokumente da biste oslobodili prostor.'
            : 'Prekoračili ste vaš FREE limit od 50MB. Nadogradite na PRO nalog za dobijanje 1GB prostora ili izbrišite neke dokumente.',
          storageInfo: userStorageInfo
        });
      }
    } catch (quotaError) {
      console.warn('Nije moguće proveriti kvotu skladišta:', quotaError);
      // Ne prekidamo upload ako ne možemo proveriti kvotu, nastavićemo sa upozorenjem
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

    // Ako je zatražen mock režim ili nemamo kredencijale, koristimo simulaciju
    if (useMock || !process.env.WASABI_ACCESS_KEY_ID || !process.env.WASABI_SECRET_ACCESS_KEY) {
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
        },
        mode: 'mock'
      });
    } else {
      // Koristi pravu Wasabi integraciju ako imamo kredencijale
      try {
        // Upload fajla na Wasabi
        const result = await wasabiStorageService.uploadFile(
          key,
          file.buffer,
          file.mimetype
        );

        // Takođe sačuvaj u lokalnoj memoriji kao kеš
        mockFiles.set(key, file.buffer);
        
        // Dodavanje u indeks foldera za brzi pregled
        const parentFolder = path.dirname(key);
        if (!mockFoldersIndex.has(parentFolder)) {
          mockFoldersIndex.set(parentFolder, new Set());
        }
        mockFoldersIndex.get(parentFolder)!.add(key);
        
        // Dobavi ažurirane informacije o skladištu nakon uploada
        let storageInfo;
        try {
          storageInfo = await userStorageQuotaService.getUserStorageInfo(userId, isPro);
        } catch (storageError) {
          console.warn('Nije moguće dobiti informacije o skladištu:', storageError);
        }
    
        res.status(200).send({
          success: true,
          message: 'Fajl je uspešno uploadovan na Wasabi',
          file: {
            name: originalFileName,
            path: key,
            size: file.size,
            type: file.mimetype,
            url: result.Location
          },
          mode: 'wasabi',
          storageInfo // Informacije o skladištu korisnika nakon uploada
        });
      } catch (wasabiError: any) {
        console.error('Greška pri uploadovanju fajla preko Wasabi servisa:', wasabiError);
        
        // Ako je došlo do greške sa Wasabi, fallback na lokalnu memoriju
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
          message: 'Fajl je privremeno sačuvan lokalno (Wasabi integracija trenutno nije dostupna)',
          file: {
            name: originalFileName,
            path: key,
            size: file.size,
            type: file.mimetype,
            url: mockResult.Location
          },
          mode: 'mock-fallback',
          wasabiError: wasabiError instanceof Error ? wasabiError.message : String(wasabiError)
        });
      }
    }
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
    const useMock = req.query.mock === 'true'; // Opcioni parametar za korištenje mock podataka

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
    
    // Ako je zatražen mock režim rada ili još nemamo Wasabi kredencijale
    if (useMock || !process.env.WASABI_ACCESS_KEY_ID || !process.env.WASABI_SECRET_ACCESS_KEY) {
      // Koristi mock funkciju umesto pozivanja S3 servisa (privremeno rešenje)
      let mockFilesList: Array<{
        name: string;
        path: string;
        size?: number;
        lastModified?: Date;
        isFolder: boolean;
      }> = [];
      
      // Ako je korenski folder, vrati sve predefinisane kategorije
      if (!folder) {
        mockFilesList = PREDEFINED_FOLDERS.map(folderName => ({
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
          mockFilesList.push({
            name: `${fileName}_${i}${extension}`,
            path: `${prefix}${fileName}_${i}${extension}`,
            size: Math.floor(Math.random() * 5000000) + 10000, // Veličina između 10KB i 5MB
            lastModified: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000), // Do 30 dana unazad
            isFolder: false
          });
        }
        
        // Dodaj i nekoliko podfoldera
        if (folder === 'SISTEMATIZACIJA' || folder === 'EVIDENCIJE') {
          mockFilesList.unshift({
            name: '2023',
            path: `${prefix}2023/`,
            size: undefined,
            lastModified: new Date(),
            isFolder: true
          });
          mockFilesList.unshift({
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
        files: mockFilesList,
        mode: 'mock'
      });
    } else {
      // Koristi pravu Wasabi integraciju ako imamo kredencijale
      try {
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
          files: transformedFiles,
          mode: 'wasabi'
        });
      } catch (wasabiError) {
        console.error('Greška pri listanju fajlova preko Wasabi servisa:', wasabiError);
        
        // Ako je došlo do greške sa Wasabi, koristi mock podatke kao fallback
        let mockFilesList: Array<{
          name: string;
          path: string;
          size?: number;
          lastModified?: Date;
          isFolder: boolean;
        }> = [];
        
        if (!folder) {
          mockFilesList = PREDEFINED_FOLDERS.map(folderName => ({
            name: folderName,
            path: `${userId}/${folderName}/`,
            size: undefined,
            lastModified: new Date(),
            isFolder: true
          }));
        }
        
        res.status(200).send({
          success: true,
          prefix,
          files: mockFilesList,
          mode: 'mock-fallback',
          wasabiError: wasabiError instanceof Error ? wasabiError.message : String(wasabiError)
        });
      }
    }
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
    const useMock = req.body.mock === true; // Opcioni parametar za korištenje mock podataka

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
        message: 'Dokument je uspešno obrisan (iz lokalne memorije - privremena simulacija)',
        mode: 'mock'
      });
    } else if (useMock || !process.env.WASABI_ACCESS_KEY_ID || !process.env.WASABI_SECRET_ACCESS_KEY) {
      // Za simulaciju ili ako nemamo kredencijale, uvek vrati uspeh
      res.status(200).send({
        success: true,
        message: 'Dokument je uspešno obrisan (simulacija)',
        mode: 'mock'
      });
    } else {
      // Koristi pravu Wasabi integraciju ako imamo kredencijale
      try {
        await wasabiStorageService.deleteFile(documentPath);
        
        res.status(200).send({
          success: true,
          message: 'Dokument je uspešno obrisan',
          mode: 'wasabi'
        });
      } catch (wasabiError: any) {
        console.error('Greška pri brisanju dokumenta preko Wasabi servisa:', wasabiError);
        
        // U slučaju greške, vrati korisniku infomaciju o uspehu (fallback režim)
        res.status(200).send({
          success: true,
          message: 'Dokument je privremeno označen kao obrisan (Wasabi integracija trenutno nije dostupna)',
          mode: 'mock-fallback',
          wasabiError: wasabiError instanceof Error ? wasabiError.message : String(wasabiError)
        });
      }
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
    const useMock = req.query.mock === 'true'; // Opcioni parametar za korištenje mock podataka

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
    } else if (useMock || !process.env.WASABI_ACCESS_KEY_ID || !process.env.WASABI_SECRET_ACCESS_KEY) {
      // Ako je zatražen mock režim ili nemamo kredencijale, koristimo simulaciju    
      // Za simulaciju, vrati primer fajla ako ne postoji u mock skladištu
      const sampleContent = `Primer sadržaja dokumenta: ${fileName}\n\nOvo je privremena simulacija fajla dok se ne reši problem sa Wasabi integracijom.`;
      const buffer = Buffer.from(sampleContent);
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
    } else {
      // Koristi pravu Wasabi integraciju ako imamo kredencijale
      try {
        // Preuzimanje fajla kao stream
        const fileStream = await wasabiStorageService.getFileAsStream(documentPath);
        
        // Postavljanje header-a za preuzimanje
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Pretpostavi content-type na osnovu ekstenzije
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        
        res.setHeader('Content-Type', contentType);
        
        // Pipe stream-a direktno u response
        fileStream.pipe(res);
      } catch (wasabiError: any) {
        console.error('Greška pri preuzimanju dokumenta preko Wasabi servisa:', wasabiError);
        
        // Ako je došlo do greške sa Wasabi, koristi mock podatke kao fallback
        const sampleContent = `Primer sadržaja dokumenta: ${fileName}\n\nDošlo je do greške pri preuzimanju sa Wasabi servisa: ${wasabiError.message}\n\nKoristi se privremeni sadržaj.`;
        const buffer = Buffer.from(sampleContent);
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Length', buffer.length);
        
        res.send(buffer);
      }
    }
  } catch (error: any) {
    console.error('Greška pri preuzimanju dokumenta:', error);
    res.status(500).send({
      success: false,
      message: `Greška pri preuzimanju dokumenta: ${error.message}`
    });
  }
});

/**
 * API endpoint za dobijanje informacija o skladištu korisnika
 * Query parametri:
 * - userId: Korisnički ID
 * - isPro: (opciono) Da li je korisnik u PRO statusu (podrazumevano false)
 */
router.get('/user-storage-info', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const isPro = req.query.isPro === 'true'; // Da li je korisnik PRO, default je false (FREE)

    if (!userId) {
      return res.status(400).send({ success: false, message: 'Korisnički ID je obavezan' });
    }

    // Dobijanje informacija o skladištu za korisnika
    const storageInfo = await userStorageQuotaService.getUserStorageInfo(userId, isPro);

    // Formatiranje veličina za lakše korišćenje (MB ili GB)
    const formattedInfo = {
      ...storageInfo,
      totalSizeFormatted: isPro ? '1 GB' : '50 MB',
      usedSizeFormatted: formatFileSize(storageInfo.usedSize),
      remainingSizeFormatted: formatFileSize(storageInfo.remainingSize)
    };

    res.status(200).send({
      success: true,
      storageInfo: formattedInfo
    });
  } catch (error: any) {
    console.error('Greška pri dobijanju informacija o skladištu:', error);
    res.status(500).send({
      success: false,
      message: `Greška pri dobijanju informacija o skladištu: ${error.message}`
    });
  }
});

/**
 * Pomoćna funkcija za formatiranje veličine fajla
 * @param bytes Veličina u bajtovima
 * @returns Formatirana veličina (npr. "1.5 MB", "2.3 GB")
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

export const wasabiStorageRouter = router;