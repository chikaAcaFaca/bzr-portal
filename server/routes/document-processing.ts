import { Request, Response } from 'express';
import { openRouterService } from '../services/openrouter-service';
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

export async function setupDocumentProcessingRoutes(app) {
  // Endpoint za procesiranje dokumenta o sistematizaciji radnih mesta
  app.post('/api/process/job-positions', async (req: Request, res: Response) => {
    try {
      // Tekst dokumenta dolazi iz request body-a
      const { documentText } = req.body;

      if (!documentText) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nedostaje tekst dokumenta' 
        });
      }

      // Koristimo OpenRouter servis za parsiranje dokumenta
      const result = await openRouterService.parseJobPositionDocument(documentText);

      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error || 'Greška pri obradi dokumenta' 
        });
      }

      // Ovde bismo trebali sačuvati podatke u bazi
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
    } catch (error) {
      console.error('Greška u procesiranju dokumenta o radnim mestima:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Interna greška servera pri obradi dokumenta' 
      });
    }
  });

  // Endpoint za procesiranje dokumenta o zaposlenima
  app.post('/api/process/employees', async (req: Request, res: Response) => {
    try {
      const { documentText } = req.body;

      if (!documentText) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nedostaje tekst dokumenta' 
        });
      }

      // Parsiramo podatke iz dokumenta
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
          const positionId = positionMapping.get(emp.jobPositionTitle.toLowerCase());
          
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
            isActive: true
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
    } catch (error) {
      console.error('Greška u procesiranju dokumenta o zaposlenima:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Interna greška servera pri obradi dokumenta' 
      });
    }
  });

  // Endpoint za procesiranje dokumenta o opisima poslova
  app.post('/api/process/job-descriptions', async (req: Request, res: Response) => {
    try {
      const { documentText } = req.body;

      if (!documentText) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nedostaje tekst dokumenta' 
        });
      }

      // Parsiramo podatke iz dokumenta
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
          const jobPositionId = positionMapping.get(desc.jobPositionTitle.toLowerCase());
          
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
    } catch (error) {
      console.error('Greška u procesiranju dokumenta o opisima poslova:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Interna greška servera pri obradi dokumenta' 
      });
    }
  });

  // Endpoint za automatsku kategorizaciju rizika na osnovu radnih mesta
  app.post('/api/generate/risk-categories', async (req: Request, res: Response) => {
    try {
      // Dohvati sva radna mesta iz baze
      const allPositions = await db.select().from(jobPositions);

      if (allPositions.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nema radnih mesta u bazi za kategorizaciju' 
        });
      }

      // Generiši kategorije rizika
      const result = await openRouterService.generateRiskCategories(allPositions);

      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error || 'Greška pri generisanju kategorija rizika' 
        });
      }

      // Sačuvaj kategorije u bazi
      const savedCategories = [];
      for (const category of result.data) {
        try {
          const categoryData = {
            name: category.name,
            description: category.description,
            severity: category.severity,
            likelihood: category.likelihood,
            jobPositions: Array.isArray(category.jobPositions) ? category.jobPositions : []
          };

          const [savedCategory] = await db.insert(riskCategories).values(categoryData).returning();
          savedCategories.push(savedCategory);
        } catch (err) {
          console.error('Greška pri čuvanju kategorije rizika:', err);
          // Nastavi sa sledećom kategorijom
        }
      }

      return res.status(200).json({ 
        success: true, 
        data: savedCategories,
        message: `Uspešno generisano i sačuvano ${savedCategories.length} kategorija rizika` 
      });
    } catch (error) {
      console.error('Greška pri generisanju kategorija rizika:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Interna greška servera pri generisanju kategorija' 
      });
    }
  });

  // Endpoint za generisanje rizika i sigurnosnih mera za određeno radno mesto
  app.post('/api/generate/risks-and-measures', async (req: Request, res: Response) => {
    try {
      const { jobPositionId, categoryId } = req.body;

      if (!jobPositionId || !categoryId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nedostaje ID radnog mesta ili ID kategorije rizika' 
        });
      }

      // Dohvati radno mesto iz baze
      const [position] = await db.select().from(jobPositions).where(eq(jobPositions.id, jobPositionId));

      if (!position) {
        return res.status(404).json({ 
          success: false, 
          error: 'Radno mesto nije pronađeno' 
        });
      }

      // Dohvati kategoriju rizika iz baze
      const [category] = await db.select().from(riskCategories).where(eq(riskCategories.id, categoryId));

      if (!category) {
        return res.status(404).json({ 
          success: false, 
          error: 'Kategorija rizika nije pronađena' 
        });
      }

      // Generiši rizike i mere za ovo radno mesto
      const result = await openRouterService.generateRisksAndMeasures(position, categoryId);

      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error || 'Greška pri generisanju rizika i mera' 
        });
      }

      // Sačuvaj rizike u bazi
      const savedRisks = [];
      if (Array.isArray(result.data.risks)) {
        for (const risk of result.data.risks) {
          try {
            const riskData = {
              categoryId,
              description: risk.description,
              potentialHarm: risk.potentialHarm,
              controlMeasures: Array.isArray(risk.controlMeasures) ? risk.controlMeasures : []
            };

            const [savedRisk] = await db.insert(risks).values(riskData).returning();
            savedRisks.push(savedRisk);
          } catch (err) {
            console.error('Greška pri čuvanju rizika:', err);
            // Nastavi sa sledećim rizikom
          }
        }
      }

      // Sačuvaj mere bezbednosti u bazi
      const savedMeasures = [];
      if (Array.isArray(result.data.safetyMeasures)) {
        for (const measure of result.data.safetyMeasures) {
          try {
            const measureData = {
              title: measure.title,
              description: measure.description,
              instructions: measure.instructions,
              requiredEquipment: Array.isArray(measure.requiredEquipment) ? measure.requiredEquipment : [],
              applicableRiskCategories: [categoryId]
            };

            const [savedMeasure] = await db.insert(safetyMeasures).values(measureData).returning();
            savedMeasures.push(savedMeasure);
          } catch (err) {
            console.error('Greška pri čuvanju mere bezbednosti:', err);
            // Nastavi sa sledećom merom
          }
        }
      }

      return res.status(200).json({ 
        success: true, 
        data: { risks: savedRisks, safetyMeasures: savedMeasures },
        message: `Uspešno generisano i sačuvano ${savedRisks.length} rizika i ${savedMeasures.length} mera bezbednosti` 
      });
    } catch (error) {
      console.error('Greška pri generisanju rizika i mera bezbednosti:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Interna greška servera pri generisanju rizika i mera' 
      });
    }
  });
}