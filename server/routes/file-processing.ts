import { Request, Response } from 'express';

// Proširenje Request tipa za fileValidationError
declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
    }
  }
}
import * as fs from 'fs';
import * as path from 'path';
import { openRouterService } from '../services/openrouter-service';
import { documentProcessingService } from '../services/document-processing-service';
import { db } from '../db';
import { 
  jobPositions,
  employees,
  jobDescriptions,
  riskCategories,
  risks,
  safetyMeasures
} from '../../shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';

// Tipovi grešaka pri obradi dokumenata
type ErrorCode = 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT' | 'OCR_REQUIRED' | 'PROCESSING_ERROR' | 'FORMAT_CONVERSION_REQUIRED';

// Funkcija za obradu sadržaja fajla - podržava različite tipove fajlova
async function processFileContent(filePath: string, mimeType: string, originalFilename: string): Promise<{ 
  success: boolean; 
  content: string; 
  error?: string;
  errorCode?: ErrorCode;
  fileType?: string;
  fileExtension?: string;
}> {
  try {
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(originalFilename).toLowerCase();
    
    if (stats.size > 50 * 1024 * 1024) { // 50MB limit (povećano sa 20MB)
      return {
        success: false,
        content: '',
        error: 'Fajl je prevelik. Maksimalna dozvoljena veličina je 50MB.',
        errorCode: 'FILE_TOO_LARGE',
        fileExtension
      };
    }
    
    // Provera problematičnih formata unapred
    if (['.odt', '.ods', '.doc', '.xls'].includes(fileExtension)) {
      try {
        // Posebna obrada za ove formate da izbegnemo greške
        console.log(`Procesiranje dokumenta sa ekstenzijom ${fileExtension}`);
        
        // Koristi servis za obradu dokumenata različitih formata, prosleđujemo originalno ime
        const content = await documentProcessingService.processDocument(filePath, mimeType, originalFilename);
        
        // Ako je odgovor JSON string, parsiramo ga
        let parsedContent: any = content;
        try {
          if (typeof content === 'string' && content.trim().startsWith('{')) {
            const jsonContent = JSON.parse(content);
            parsedContent = jsonContent;
            
            // Ako je detektovana greška ili upozorenje o formatu
            if (jsonContent && 
                (jsonContent.success === false || 
                 jsonContent.status === 'format_warning')) {
              return {
                success: false,
                content: '',
                error: jsonContent.message || jsonContent.error || 'Format dokumenta nije podržan',
                errorCode: 'UNSUPPORTED_FORMAT',
                fileType: jsonContent.formatName || fileExtension.substring(1).toUpperCase(),
                fileExtension
              };
            }
          }
        } catch (e) {
          // Ako parsiranje nije uspelo, nastavljamo sa originalnim odgovorom
          console.log('Upozorenje: odgovor servisa nije JSON, nastavljamo obradu...', e);
        }
        
        // Čak i ako dobijemo sadržaj, za problematične formate nudimo opciju ručnog unosa
        return { 
          success: true, 
          content,
          fileType: fileExtension.substring(1).toUpperCase(), // bez tačke
          fileExtension
        };
      } catch (formatError) {
        return {
          success: false,
          content: '',
          error: `Format ${fileExtension} zahteva ručni unos teksta. Dokument nije moguće automatski obraditi.`,
          errorCode: 'UNSUPPORTED_FORMAT',
          fileType: fileExtension.substring(1).toUpperCase(),
          fileExtension
        };
      }
    } else if (fileExtension === '.pdf') {
      try {
        // Koristi servis za obradu dokumenata različitih formata
        const content = await documentProcessingService.processDocument(filePath, mimeType);
        return { success: true, content, fileType: 'PDF', fileExtension };
      } catch (pdfError) {
        return {
          success: false,
          content: '',
          error: 'PDF dokument sadrži slike ili je skeniran. Molimo koristite opciju za ručni unos teksta.',
          errorCode: 'OCR_REQUIRED',
          fileType: 'PDF',
          fileExtension
        };
      }
    }
    
    // Standardna obrada za ostale formate
    const content = await documentProcessingService.processDocument(filePath, mimeType);
    return { 
      success: true, 
      content,
      fileType: fileExtension.substring(1).toUpperCase(),
      fileExtension
    };
  } catch (error) {
    console.error('Greška pri obradi fajla:', error);
    return {
      success: false, 
      content: '',
      error: `Nije moguće obraditi fajl: ${error.message}`,
      errorCode: 'PROCESSING_ERROR',
      fileExtension: path.extname(originalFilename).toLowerCase()
    };
  }
}

// Konfiguracija za multer - privremeno čuvanje fajlova
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
  fileFilter: (req, file, callback) => {
    // Podržavamo različite tipove dokumenata
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      // Microsoft Office
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // OpenOffice/LibreOffice
      'application/vnd.oasis.opendocument.text',     // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
      // Slike
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(null, false);
      req.fileValidationError = `Nepodržan tip fajla: ${file.mimetype}. Podržani formati su: TXT, PDF, DOC, DOCX, ODT, XLS, XLSX, ODS, JPG, PNG.`;
    }
  }
});

export async function setupFileProcessingRoutes(app: any) {
  // Kreiranje direktorijuma za upload ako ne postoji
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Endpoint za obradu uploada sistematizacije radnih mesta
  app.post('/api/process/job-positions-file', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          error: req.fileValidationError
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Fajl nije prenesen'
        });
      }

      // Pročitaj sadržaj fajla
      const filePath = path.join(process.cwd(), req.file.path);
      const fileResult = await processFileContent(filePath, req.file.mimetype, req.file.originalname);
      
      // Obriši privremeni fajl nakon čitanja
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Greška pri brisanju privremenog fajla:', e);
      }
      
      if (!fileResult.success) {
        return res.status(400).json({
          success: false,
          error: fileResult.error || 'Greška pri čitanju fajla',
          errorCode: fileResult.errorCode || 'PROCESSING_ERROR',
          fileType: fileResult.fileType,
          fileExtension: fileResult.fileExtension
        });
      }
      
      const documentText = fileResult.content;

      // Koristimo OpenRouter za parsiranje sadržaja
      const result = await openRouterService.parseJobPositionDocument(documentText);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Greška pri obradi dokumenta'
        });
      }

      // Sačuvaj podatke u bazi
      const savedPositions = [];
      for (const position of result.data) {
        try {
          // Pretvori nizove u nešto što DB može da prihvati
          const dbPosition = {
            ...position,
            requiredSkills: Array.isArray(position.requiredSkills) ? position.requiredSkills : [],
            responsibilities: Array.isArray(position.responsibilities) ? position.responsibilities : []
          };

          // Sačuvaj u bazi
          const [savedPosition] = await db.insert(jobPositions).values(dbPosition).returning();
          savedPositions.push(savedPosition);
        } catch (err) {
          console.error('Greška pri čuvanju pozicije:', err);
          // Nastavi sa sledećom pozicijom
        }
      }

      return res.status(200).json({
        success: true,
        data: savedPositions,
        message: `Uspešno obrađeno i sačuvano ${savedPositions.length} radnih mesta`
      });
    } catch (error: any) {
      console.error('Greška pri obradi fajla sa sistematizacijom:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });

  // Endpoint za obradu uploada podataka o zaposlenima
  app.post('/api/process/employees-file', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Fajl nije prenesen'
        });
      }

      // Pročitaj sadržaj fajla
      const filePath = path.join(process.cwd(), req.file.path);
      const fileResult = await processFileContent(filePath, req.file.mimetype, req.file.originalname);
      
      // Obriši privremeni fajl nakon čitanja
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Greška pri brisanju privremenog fajla:', e);
      }
      
      if (!fileResult.success) {
        return res.status(400).json({
          success: false,
          error: fileResult.error || 'Greška pri čitanju fajla',
          errorCode: fileResult.errorCode || 'PROCESSING_ERROR',
          fileType: fileResult.fileType,
          fileExtension: fileResult.fileExtension
        });
      }
      
      const documentText = fileResult.content;

      // Koristimo OpenRouter za parsiranje sadržaja
      const result = await openRouterService.parseEmployeeDocument(documentText);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Greška pri obradi dokumenta'
        });
      }

      // Mapiranje naziva radnog mesta u ID
      const positionMapping = new Map();
      const allPositions = await db.select().from(jobPositions);
      allPositions.forEach(pos => {
        positionMapping.set(pos.title.toLowerCase(), pos.id);
      });

      // Sačuvaj zaposlene u bazi
      const savedEmployees = [];
      for (const emp of result.data) {
        try {
          // Pokušaj naći ID za radno mesto
          const positionId = positionMapping.get(emp.jobPositionTitle?.toLowerCase());
          
          if (!positionId) {
            console.warn(`Radno mesto "${emp.jobPositionTitle}" nije pronađeno u bazi.`);
            continue; // Preskoči zaposlenog ako ne možemo naći radno mesto
          }

          const employeeData = {
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@example.com`,
            phone: emp.phone || null,
            jobPositionId: positionId,
            hireDate: new Date(),
            isActive: true,
            personalIdNumber: emp.personalIdNumber || null,
            identificationNumber: emp.identificationNumber || null,
            street: emp.street || null,
            streetNumber: emp.streetNumber || null,
            city: emp.city || null,
            postalCode: emp.postalCode || null,
          };

          const [savedEmployee] = await db.insert(employees).values(employeeData).returning();
          savedEmployees.push(savedEmployee);
        } catch (err) {
          console.error('Greška pri čuvanju zaposlenog:', err);
          // Nastavi sa sledećim zaposlenim
        }
      }

      return res.status(200).json({
        success: true,
        data: savedEmployees,
        message: `Uspešno obrađeno i sačuvano ${savedEmployees.length} zaposlenih`
      });
    } catch (error: any) {
      console.error('Greška pri obradi fajla sa zaposlenima:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });

  // Endpoint za obradu uploada opisa poslova
  app.post('/api/process/job-descriptions-file', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Fajl nije prenesen'
        });
      }

      // Pročitaj sadržaj fajla
      const filePath = path.join(process.cwd(), req.file.path);
      const fileResult = await processFileContent(filePath, req.file.mimetype, req.file.originalname);
      
      // Obriši privremeni fajl nakon čitanja
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Greška pri brisanju privremenog fajla:', e);
      }
      
      if (!fileResult.success) {
        return res.status(400).json({
          success: false,
          error: fileResult.error || 'Greška pri čitanju fajla',
          errorCode: fileResult.errorCode || 'PROCESSING_ERROR',
          fileType: fileResult.fileType,
          fileExtension: fileResult.fileExtension
        });
      }
      
      const documentText = fileResult.content;

      // Koristimo OpenRouter za parsiranje sadržaja
      const result = await openRouterService.parseJobDescriptionDocument(documentText);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Greška pri obradi dokumenta'
        });
      }

      // Mapiranje naziva radnog mesta u ID
      const positionMapping = new Map();
      const allPositions = await db.select().from(jobPositions);
      allPositions.forEach(pos => {
        positionMapping.set(pos.title.toLowerCase(), pos.id);
      });

      // Sačuvaj opise poslova u bazi
      const savedDescriptions = [];
      for (const desc of result.data) {
        try {
          // Pokušaj naći ID za radno mesto
          const jobPositionId = positionMapping.get(desc.jobPositionTitle?.toLowerCase());
          
          if (!jobPositionId) {
            console.warn(`Radno mesto "${desc.jobPositionTitle}" nije pronađeno u bazi.`);
            continue; // Preskoči opis ako ne možemo naći radno mesto
          }

          const descriptionData = {
            jobPositionId,
            description: desc.description,
            duties: Array.isArray(desc.duties) ? desc.duties : [],
            workingConditions: desc.workingConditions || '',
            equipment: Array.isArray(desc.equipment) ? desc.equipment : []
          };

          const [savedDescription] = await db.insert(jobDescriptions).values(descriptionData).returning();
          savedDescriptions.push(savedDescription);
        } catch (err) {
          console.error('Greška pri čuvanju opisa posla:', err);
          // Nastavi sa sledećim opisom
        }
      }

      return res.status(200).json({
        success: true,
        data: savedDescriptions,
        message: `Uspešno obrađeno i sačuvano ${savedDescriptions.length} opisa poslova`
      });
    } catch (error: any) {
      console.error('Greška pri obradi fajla sa opisima poslova:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });

  // Endpointi za direktan unos teksta
  
  // Endpoint za obradu teksta sistematizacije radnih mesta
  app.post('/api/process/job-positions-text', async (req: Request, res: Response) => {
    try {
      if (!req.body.text || typeof req.body.text !== 'string' || !req.body.text.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Tekst nije unet ili je prazan'
        });
      }

      // Ograničavamo veličinu teksta i validiramo
      const documentText = req.body.text.trim();
      
      // Provera za ekstremno velike tekstove
      if (documentText.length > 100000) { // 100KB limit za direktan tekst
        return res.status(413).json({
          success: false,
          error: 'Tekst je prevelik. Molimo podelite ga na manje delove ili smanjite njegovu veličinu.',
          errorCode: 'TEXT_TOO_LARGE'
        });
      }
      
      // Koristimo OpenRouter za parsiranje sadržaja
      try {
        const result = await openRouterService.parseJobPositionDocument(documentText);

        if (!result.success) {
          return res.status(500).json({
            success: false,
            error: result.error || 'Greška pri obradi teksta'
          });
        }

        // Sačuvaj podatke u bazi
        const savedPositions = [];
        for (const position of result.data || []) {
          try {
            // Pretvori nizove u nešto što DB može da prihvati
            const dbPosition = {
              ...position,
              requiredSkills: Array.isArray(position.requiredSkills) ? position.requiredSkills : [],
              responsibilities: Array.isArray(position.responsibilities) ? position.responsibilities : []
            };

            // Sačuvaj u bazi
            const [savedPosition] = await db.insert(jobPositions).values(dbPosition).returning();
            savedPositions.push(savedPosition);
          } catch (err) {
            console.error('Greška pri čuvanju pozicije:', err);
            // Nastavi sa sledećom pozicijom
          }
        }

        return res.status(200).json({
          success: true,
          data: savedPositions,
          message: `Uspešno obrađeno i sačuvano ${savedPositions.length} radnih mesta`
        });
      } catch (aiError) {
        console.error('Greška pri obradi teksta sa AI servisom:', aiError);
        
        // Vrati konkretan JSON odgovor
        return res.status(500).json({
          success: false,
          error: 'Greška pri komunikaciji sa AI servisom. Molimo pokušajte ponovo ili sa drugačijim tekstom.',
          errorDetails: aiError.message || 'Nepoznata greška',
          suggestion: 'Pokušajte sa kraćim tekstom ili drugačijom formulacijom.'
        });
      }
    } catch (error: any) {
      console.error('Greška pri obradi teksta sa sistematizacijom:', error);
      
      // Osiguravamo da je odgovor uvek u JSON formatu
      return res.status(500).json({
        success: false,
        error: 'Interna greška servera',
        errorDetails: error.message || 'Nepoznata greška',
        suggestion: 'Osvežite stranicu i pokušajte ponovo.'
      });
    }
  });
  
  // Endpoint za obradu teksta podataka o zaposlenima
  app.post('/api/process/employees-text', async (req: Request, res: Response) => {
    try {
      if (!req.body.text || typeof req.body.text !== 'string' || !req.body.text.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Tekst nije unet ili je prazan'
        });
      }

      // Ograničavamo veličinu teksta i validiramo
      const documentText = req.body.text.trim();
      
      // Provera za ekstremno velike tekstove
      if (documentText.length > 100000) { // 100KB limit za direktan tekst
        return res.status(413).json({
          success: false,
          error: 'Tekst je prevelik. Molimo podelite ga na manje delove ili smanjite njegovu veličinu.',
          errorCode: 'TEXT_TOO_LARGE'
        });
      }
      
      try {
        // Koristimo OpenRouter za parsiranje sadržaja
        const result = await openRouterService.parseEmployeeDocument(documentText);

        if (!result.success) {
          return res.status(500).json({
            success: false,
            error: result.error || 'Greška pri obradi teksta'
          });
        }

        // Mapiranje naziva radnog mesta u ID
        const positionMapping = new Map();
        const allPositions = await db.select().from(jobPositions);
        allPositions.forEach((pos: any) => {
          positionMapping.set(pos.title.toLowerCase(), pos.id);
        });

        // Sačuvaj zaposlene u bazi
        const savedEmployees = [];
        for (const emp of result.data || []) {
          try {
            // Pokušaj naći ID za radno mesto
            const positionId = positionMapping.get(emp.jobPositionTitle?.toLowerCase());
            
            if (!positionId) {
              console.warn(`Radno mesto "${emp.jobPositionTitle}" nije pronađeno u bazi.`);
              continue; // Preskoči zaposlenog ako ne možemo naći radno mesto
            }

            const employeeData = {
              firstName: emp.firstName,
              lastName: emp.lastName,
              email: emp.email || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@example.com`,
              phone: emp.phone || null,
              jobPositionId: positionId,
              hireDate: new Date(),
              isActive: true,
              personalIdNumber: emp.personalIdNumber || null,
              identificationNumber: emp.identificationNumber || null,
              street: emp.street || null,
              streetNumber: emp.streetNumber || null,
              city: emp.city || null,
              postalCode: emp.postalCode || null,
            };

            const [savedEmployee] = await db.insert(employees).values(employeeData).returning();
            savedEmployees.push(savedEmployee);
          } catch (err) {
            console.error('Greška pri čuvanju zaposlenog:', err);
            // Nastavi sa sledećim zaposlenim
          }
        }

        return res.status(200).json({
          success: true,
          data: savedEmployees,
          message: `Uspešno obrađeno i sačuvano ${savedEmployees.length} zaposlenih`
        });
      } catch (aiError) {
        console.error('Greška pri obradi teksta sa AI servisom:', aiError);
        
        // Vrati konkretan JSON odgovor
        return res.status(500).json({
          success: false,
          error: 'Greška pri komunikaciji sa AI servisom. Molimo pokušajte ponovo ili sa drugačijim tekstom.',
          errorDetails: aiError.message || 'Nepoznata greška',
          suggestion: 'Pokušajte sa kraćim tekstom ili drugačijom formulacijom.'
        });
      }
    } catch (error: any) {
      console.error('Greška pri obradi teksta sa zaposlenima:', error);
      
      // Osiguravamo da je odgovor uvek u JSON formatu
      return res.status(500).json({
        success: false,
        error: 'Interna greška servera',
        errorDetails: error.message || 'Nepoznata greška',
        suggestion: 'Osvežite stranicu i pokušajte ponovo.'
      });
    }
  });
  
  // Endpoint za obradu teksta opisa poslova
  app.post('/api/process/job-descriptions-text', async (req: Request, res: Response) => {
    try {
      if (!req.body.text || typeof req.body.text !== 'string' || !req.body.text.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Tekst nije unet ili je prazan'
        });
      }

      // Ograničavamo veličinu teksta i validiramo
      const documentText = req.body.text.trim();
      
      // Provera za ekstremno velike tekstove
      if (documentText.length > 100000) { // 100KB limit za direktan tekst
        return res.status(413).json({
          success: false,
          error: 'Tekst je prevelik. Molimo podelite ga na manje delove ili smanjite njegovu veličinu.',
          errorCode: 'TEXT_TOO_LARGE'
        });
      }
      
      try {
        // Koristimo OpenRouter za parsiranje sadržaja
        const result = await openRouterService.parseJobDescriptionDocument(documentText);

        if (!result.success) {
          return res.status(500).json({
            success: false,
            error: result.error || 'Greška pri obradi teksta'
          });
        }

        // Mapiranje naziva radnog mesta u ID
        const positionMapping = new Map();
        const allPositions = await db.select().from(jobPositions);
        allPositions.forEach((pos: any) => {
          positionMapping.set(pos.title.toLowerCase(), pos.id);
        });

        // Sačuvaj opise poslova u bazi
        const savedDescriptions = [];
        for (const desc of result.data || []) {
          try {
            // Pokušaj naći ID za radno mesto
            const jobPositionId = positionMapping.get(desc.jobPositionTitle?.toLowerCase());
            
            if (!jobPositionId) {
              console.warn(`Radno mesto "${desc.jobPositionTitle}" nije pronađeno u bazi.`);
              continue; // Preskoči opis ako ne možemo naći radno mesto
            }

            const descriptionData = {
              jobPositionId,
              description: desc.description,
              duties: Array.isArray(desc.duties) ? desc.duties : [],
              workingConditions: desc.workingConditions || '',
              equipment: Array.isArray(desc.equipment) ? desc.equipment : []
            };

            const [savedDescription] = await db.insert(jobDescriptions).values(descriptionData).returning();
            savedDescriptions.push(savedDescription);
          } catch (err) {
            console.error('Greška pri čuvanju opisa posla:', err);
            // Nastavi sa sledećim opisom
          }
        }

        return res.status(200).json({
          success: true,
          data: savedDescriptions,
          message: `Uspešno obrađeno i sačuvano ${savedDescriptions.length} opisa poslova`
        });
      } catch (aiError: any) {
        console.error('Greška pri obradi teksta sa AI servisom:', aiError);
        
        // Vrati konkretan JSON odgovor
        return res.status(500).json({
          success: false,
          error: 'Greška pri komunikaciji sa AI servisom. Molimo pokušajte ponovo ili sa drugačijim tekstom.',
          errorDetails: aiError.message || 'Nepoznata greška',
          suggestion: 'Pokušajte sa kraćim tekstom ili drugačijom formulacijom.'
        });
      }
    } catch (error: any) {
      console.error('Greška pri obradi teksta sa opisima poslova:', error);
      
      // Osiguravamo da je odgovor uvek u JSON formatu
      return res.status(500).json({
        success: false,
        error: 'Interna greška servera',
        errorDetails: error.message || 'Nepoznata greška',
        suggestion: 'Osvežite stranicu i pokušajte ponovo.'
      });
    }
  });
}