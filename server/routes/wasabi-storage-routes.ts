import { Router, Request, Response } from 'express';
import { wasabiStorageService } from '../services/wasabi-storage-service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Konfigurisanje multer za privremeno skladištenje fajlova pre uploada na Wasabi
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, callback) => {
    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.odt', 
      '.ods', '.jpg', '.jpeg', '.png', '.csv', '.bmp'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      callback(null, true);
    } else {
      const error: any = new Error('Nedozvoljen tip fajla!');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      callback(error);
    }
  }
});

// Pripremamo predefinisane foldere za korisnike
const predefinedFolders = [
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

/**
 * API endpoint za upload korisničkog dokumenta
 * Zahteva multipart/form-data sa fajlom i sledećim poljima:
 * - folder: Predefinisani folder (iz liste predefinedFolders)
 * - customFolderPath: (opciono) Dodatna putanja foldera
 */
router.post('/upload-user-document', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Fajl nije prosleđen'
      });
    }
    
    const file = req.file;
    const userId = req.body.userId || 'anonymous'; // Ovde biste dobili ID korisnika iz autentifikacije
    const folder = req.body.folder || 'OSTALO';
    const customFolderPath = req.body.customFolderPath || '';
    
    // Proveri da li je izabrani folder dozvoljen
    if (!predefinedFolders.includes(folder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Izabrani folder nije podržan'
      });
    }
    
    // Kreiraj putanju za fajl u Wasabi storage
    let destinationPath = `${userId}/${folder.toUpperCase()}`;
    
    // Dodaj dodatnu putanju ako postoji
    if (customFolderPath) {
      // Očisti putanju da ne sadrži specijalne karaktere
      const cleanedCustomPath = customFolderPath
        .replace(/[^\w\s\/-]/g, '') // Dozvoli samo alfanumeričke karaktere, razmake, crte i /
        .replace(/\/{2,}/g, '/'); // Izbaci duplirane /
        
      destinationPath += `/${cleanedCustomPath}`;
    }
    
    // Dodaj originalno ime fajla
    destinationPath += `/${file.originalname}`;
    
    // Sačuvaj metadata informacije
    const metadata = {
      'uploadedBy': userId,
      'originalName': file.originalname,
      'contentType': file.mimetype,
      'uploadDate': new Date().toISOString()
    };
    
    // Upload fajla na Wasabi
    const uploadResult = await wasabiStorageService.uploadUserDocument(
      file.path,
      destinationPath,
      metadata
    );
    
    // Obriši privremeni fajl nakon uploada
    fs.unlinkSync(file.path);
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: uploadResult.error || 'Greška prilikom uploadovanja fajla'
      });
    }
    
    // Vrati uspešan odgovor sa URL-om do fajla
    return res.status(200).json({
      success: true,
      message: 'Fajl uspešno uploadovan',
      url: uploadResult.url,
      path: destinationPath
    });
  } catch (error: any) {
    console.error('Greška pri uploadovanju korisničkog dokumenta:', error);
    
    // Obriši privremeni fajl u slučaju greške
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Greška pri brisanju privremenog fajla:', e);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Greška prilikom uploadovanja fajla'
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
    const userId = req.query.userId as string || 'anonymous'; // Ovde biste dobili ID korisnika iz autentifikacije
    const folder = req.query.folder as string;
    const customPath = req.query.path as string;
    
    // Kreiraj putanju za listanje
    let folderPath = '';
    
    if (folder) {
      folderPath = folder.toUpperCase();
      
      // Dodaj dodatnu putanju ako postoji
      if (customPath) {
        folderPath += `/${customPath}`;
      }
    }
    
    // Listaj fajlove korisnika
    const listResult = await wasabiStorageService.listUserDocuments(userId, folderPath);
    
    if (!listResult.success) {
      return res.status(500).json({
        success: false,
        message: listResult.error || 'Greška prilikom listanja dokumenata'
      });
    }
    
    // Ako nema fajlova, vrati praznu listu
    if (!listResult.files || listResult.files.length === 0) {
      // Ako je folder prazan i to je root folder korisnika, pokušaj kreirati predefinisane foldere
      if (!folderPath) {
        return res.status(200).json({
          success: true,
          files: predefinedFolders.map(folder => ({
            name: folder,
            path: `${userId}/${folder}/`,
            isFolder: true
          }))
        });
      }
      
      return res.status(200).json({
        success: true,
        files: []
      });
    }
    
    // Vrati listu fajlova
    return res.status(200).json({
      success: true,
      files: listResult.files
    });
  } catch (error: any) {
    console.error('Greška pri listanju korisničkih dokumenata:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Greška prilikom listanja dokumenata'
    });
  }
});

/**
 * API endpoint za brisanje korisničkog dokumenta
 * Zahteva putanju dokumenta u body
 */
router.delete('/delete-user-document', async (req: Request, res: Response) => {
  try {
    const { documentPath } = req.body;
    const userId = req.body.userId || 'anonymous'; // Ovde biste dobili ID korisnika iz autentifikacije
    
    if (!documentPath) {
      return res.status(400).json({
        success: false,
        message: 'Putanja dokumenta nije prosleđena'
      });
    }
    
    // Proveri da li je putanja validna i pripada korisniku
    if (!documentPath.startsWith(`${userId}/`)) {
      return res.status(403).json({
        success: false,
        message: 'Nemate dozvolu za brisanje ovog dokumenta'
      });
    }
    
    // Obriši dokument
    const deleteResult = await wasabiStorageService.deleteUserDocument(documentPath);
    
    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: deleteResult.error || 'Greška prilikom brisanja dokumenta'
      });
    }
    
    // Vrati uspešan odgovor
    return res.status(200).json({
      success: true,
      message: 'Dokument uspešno obrisan'
    });
  } catch (error: any) {
    console.error('Greška pri brisanju korisničkog dokumenta:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Greška prilikom brisanja dokumenta'
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
    const userId = req.query.userId as string || 'anonymous'; // Ovde biste dobili ID korisnika iz autentifikacije
    
    if (!documentPath) {
      return res.status(400).json({
        success: false,
        message: 'Putanja dokumenta nije prosleđena'
      });
    }
    
    // Proveri da li je putanja validna i pripada korisniku
    if (!documentPath.startsWith(`${userId}/`)) {
      return res.status(403).json({
        success: false,
        message: 'Nemate dozvolu za preuzimanje ovog dokumenta'
      });
    }
    
    // Preuzmi dokument
    const documentResult = await wasabiStorageService.getUserDocument(documentPath);
    
    if (!documentResult.success || !documentResult.stream) {
      return res.status(500).json({
        success: false,
        message: documentResult.error || 'Greška prilikom preuzimanja dokumenta'
      });
    }
    
    // Dobavi ime fajla iz putanje
    const fileName = path.basename(documentPath);
    
    // Postavi headere za download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Prosledi stream direktno klijentu
    documentResult.stream.pipe(res);
  } catch (error: any) {
    console.error('Greška pri preuzimanju korisničkog dokumenta:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Greška prilikom preuzimanja dokumenta'
    });
  }
});

// Eksportiraj router
export default router;