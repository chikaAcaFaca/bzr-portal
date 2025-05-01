import { Router, Request, Response } from 'express';
import multer from 'multer';
import { WasabiStorageService } from '../services/wasabi-storage-service';
import path from 'path';

// Kreiranje router instance
const router = Router();

// Kreiranje instance za Wasabi Storage Service
const wasabiStorageService = new WasabiStorageService();

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

/**
 * API endpoint za upload korisničkog dokumenta
 * Zahteva multipart/form-data sa fajlom i sledećim poljima:
 * - folder: Predefinisani folder (iz liste predefinedFolders)
 * - customFolderPath: (opciono) Dodatna putanja foldera
 */
router.post('/upload-user-document', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
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

    await wasabiStorageService.deleteFile(documentPath);

    res.status(200).send({
      success: true,
      message: 'Dokument je uspešno obrisan'
    });
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

    // Preuzimanje fajla kao stream
    const fileStream = await wasabiStorageService.getFileAsStream(documentPath);
    
    // Postavljanje header-a za preuzimanje
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Pipe stream-a direktno u response
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('Greška pri preuzimanju dokumenta:', error);
    res.status(500).send({
      success: false,
      message: `Greška pri preuzimanju dokumenta: ${error.message}`
    });
  }
});

export const wasabiStorageRouter = router;