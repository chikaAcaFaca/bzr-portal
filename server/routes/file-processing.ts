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

// Funkcija za obradu sadržaja fajla - podržava različite tipove fajlova
async function processFileContent(filePath: string, mimeType: string): Promise<{ success: boolean; content: string; error?: string }> {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 20 * 1024 * 1024) { // 20MB limit
      return {
        success: false,
        content: '',
        error: 'Fajl je prevelik. Maksimalna dozvoljena veličina je 20MB.'
      };
    }
    
    // Koristi servis za obradu dokumenata različitih formata
    const content = await documentProcessingService.processDocument(filePath, mimeType);
    return { success: true, content };
  } catch (error) {
    console.error('Greška pri obradi fajla:', error);
    return {
      success: false, 
      content: '',
      error: `Nije moguće obraditi fajl: ${error.message}`
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
      const fileResult = await processFileContent(filePath, req.file.mimetype);
      
      // Obriši privremeni fajl nakon čitanja
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Greška pri brisanju privremenog fajla:', e);
      }
      
      if (!fileResult.success) {
        return res.status(400).json({
          success: false,
          error: fileResult.error || 'Greška pri čitanju fajla'
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
      const fileResult = await processFileContent(filePath, req.file.mimetype);
      
      // Obriši privremeni fajl nakon čitanja
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Greška pri brisanju privremenog fajla:', e);
      }
      
      if (!fileResult.success) {
        return res.status(400).json({
          success: false,
          error: fileResult.error || 'Greška pri čitanju fajla'
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
      const fileResult = await processFileContent(filePath, req.file.mimetype);
      
      // Obriši privremeni fajl nakon čitanja
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Greška pri brisanju privremenog fajla:', e);
      }
      
      if (!fileResult.success) {
        return res.status(400).json({
          success: false,
          error: fileResult.error || 'Greška pri čitanju fajla'
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

      const documentText = req.body.text.trim();
      
      // Koristimo OpenRouter za parsiranje sadržaja
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
    } catch (error: any) {
      console.error('Greška pri obradi teksta sa sistematizacijom:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
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

      const documentText = req.body.text.trim();
      
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
    } catch (error: any) {
      console.error('Greška pri obradi teksta sa zaposlenima:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
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

      const documentText = req.body.text.trim();
      
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
    } catch (error: any) {
      console.error('Greška pri obradi teksta sa opisima poslova:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Interna greška servera'
      });
    }
  });
}