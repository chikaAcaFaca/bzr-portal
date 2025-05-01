import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBaseDocumentSchema, 
  insertJobPositionSchema, 
  insertEmployeeSchema,
  insertJobDescriptionSchema,
  insertRiskCategorySchema,
  insertRiskSchema,
  insertSafetyMeasureSchema,
  insertTrainingTypeSchema,
  insertEmployeeTrainingSchema,
  insertCommonInstructionSchema,
  insertKnowledgeReferenceSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupDocumentProcessingRoutes } from "./routes/document-processing";
import { setupFileProcessingRoutes } from "./routes/file-processing";
import { setupAIAgentRoutes } from "./routes/ai-agent-routes";
import { setupDocumentRoutes } from './routes/document-routes';
import { setupDocumentScraperRoutes } from './routes/document-scraper';
import { blogRouter } from './routes/blog-routes';
import { adminRouter } from './routes/admin-routes';
import { userRouter } from './routes/user-routes';
import ocrRouter from './routes/ocr-service';
import textExtractionRouter from './routes/text-extraction';
import { wasabiStorageRouter } from './routes/wasabi-storage-routes';
import referralRoutes from './routes/referral-routes';
import aiUsageRoutes from './routes/ai-usage-routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Base Documents
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      const documents = await storage.getAllBaseDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });

  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getBaseDocument(id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch document' });
    }
  });

  app.post('/api/documents', async (req: Request, res: Response) => {
    try {
      const validatedData = insertBaseDocumentSchema.parse(req.body);
      const document = await storage.createBaseDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid document data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create document' });
    }
  });

  app.put('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBaseDocumentSchema.partial().parse(req.body);
      const document = await storage.updateBaseDocument(id, validatedData);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid document data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update document' });
    }
  });

  app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBaseDocument(id);

      if (!success) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete document' });
    }
  });

  // Job Positions
  app.get('/api/job-positions', async (req: Request, res: Response) => {
    try {
      const positions = await storage.getAllJobPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch job positions' });
    }
  });

  app.get('/api/job-positions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const position = await storage.getJobPosition(id);

      if (!position) {
        return res.status(404).json({ message: 'Job position not found' });
      }

      res.json(position);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch job position' });
    }
  });

  app.post('/api/job-positions', async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobPositionSchema.parse(req.body);
      const position = await storage.createJobPosition(validatedData);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid job position data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create job position' });
    }
  });

  app.put('/api/job-positions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertJobPositionSchema.partial().parse(req.body);
      const position = await storage.updateJobPosition(id, validatedData);

      if (!position) {
        return res.status(404).json({ message: 'Job position not found' });
      }

      res.json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid job position data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update job position' });
    }
  });

  app.delete('/api/job-positions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteJobPosition(id);

      if (!success) {
        return res.status(404).json({ message: 'Job position not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete job position' });
    }
  });

  // Employees
  app.get('/api/employees', async (req: Request, res: Response) => {
    try {
      const jobPositionId = req.query.jobPositionId ? parseInt(req.query.jobPositionId as string) : undefined;

      let employees;
      if (jobPositionId) {
        employees = await storage.getEmployeesByJobPosition(jobPositionId);
      } else {
        employees = await storage.getAllEmployees();
      }

      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  app.get('/api/employees/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employee' });
    }
  });

  app.post('/api/employees', async (req: Request, res: Response) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid employee data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create employee' });
    }
  });

  app.put('/api/employees/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid employee data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update employee' });
    }
  });

  app.delete('/api/employees/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);

      if (!success) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete employee' });
    }
  });

  // Job Descriptions
  app.get('/api/job-descriptions', async (req: Request, res: Response) => {
    try {
      const jobPositionId = req.query.jobPositionId ? parseInt(req.query.jobPositionId as string) : undefined;

      if (jobPositionId) {
        const description = await storage.getJobDescriptionByJobPosition(jobPositionId);
        return res.json(description || null);
      }

      const descriptions = await storage.getAllJobDescriptions();
      res.json(descriptions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch job descriptions' });
    }
  });

  app.get('/api/job-descriptions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const description = await storage.getJobDescription(id);

      if (!description) {
        return res.status(404).json({ message: 'Job description not found' });
      }

      res.json(description);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch job description' });
    }
  });

  app.post('/api/job-descriptions', async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobDescriptionSchema.parse(req.body);
      const description = await storage.createJobDescription(validatedData);
      res.status(201).json(description);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid job description data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create job description' });
    }
  });

  app.put('/api/job-descriptions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertJobDescriptionSchema.partial().parse(req.body);
      const description = await storage.updateJobDescription(id, validatedData);

      if (!description) {
        return res.status(404).json({ message: 'Job description not found' });
      }

      res.json(description);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid job description data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update job description' });
    }
  });

  app.delete('/api/job-descriptions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteJobDescription(id);

      if (!success) {
        return res.status(404).json({ message: 'Job description not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete job description' });
    }
  });

  // Risk Categories
  app.get('/api/risk-categories', async (req: Request, res: Response) => {
    try {
      const jobPositionId = req.query.jobPositionId ? parseInt(req.query.jobPositionId as string) : undefined;

      let categories;
      if (jobPositionId) {
        categories = await storage.getRiskCategoriesByJobPosition(jobPositionId);
      } else {
        categories = await storage.getAllRiskCategories();
      }

      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch risk categories' });
    }
  });

  app.get('/api/risk-categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getRiskCategory(id);

      if (!category) {
        return res.status(404).json({ message: 'Risk category not found' });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch risk category' });
    }
  });

  app.post('/api/risk-categories', async (req: Request, res: Response) => {
    try {
      const validatedData = insertRiskCategorySchema.parse(req.body);
      const category = await storage.createRiskCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid risk category data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create risk category' });
    }
  });

  app.put('/api/risk-categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRiskCategorySchema.partial().parse(req.body);
      const category = await storage.updateRiskCategory(id, validatedData);

      if (!category) {
        return res.status(404).json({ message: 'Risk category not found' });
      }

      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid risk category data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update risk category' });
    }
  });

  app.delete('/api/risk-categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRiskCategory(id);

      if (!success) {
        return res.status(404).json({ message: 'Risk category not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete risk category' });
    }
  });

  // Risks
  app.get('/api/risks', async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

      let risks;
      if (categoryId) {
        risks = await storage.getRisksByCategory(categoryId);
      } else {
        risks = await storage.getAllRisks();
      }

      res.json(risks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch risks' });
    }
  });

  app.get('/api/risks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const risk = await storage.getRisk(id);

      if (!risk) {
        return res.status(404).json({ message: 'Risk not found' });
      }

      res.json(risk);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch risk' });
    }
  });

  app.post('/api/risks', async (req: Request, res: Response) => {
    try {
      const validatedData = insertRiskSchema.parse(req.body);
      const risk = await storage.createRisk(validatedData);
      res.status(201).json(risk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid risk data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create risk' });
    }
  });

  app.put('/api/risks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRiskSchema.partial().parse(req.body);
      const risk = await storage.updateRisk(id, validatedData);

      if (!risk) {
        return res.status(404).json({ message: 'Risk not found' });
      }

      res.json(risk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid risk data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update risk' });
    }
  });

  app.delete('/api/risks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRisk(id);

      if (!success) {
        return res.status(404).json({ message: 'Risk not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete risk' });
    }
  });

  // Safety Measures
  app.get('/api/safety-measures', async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

      let measures;
      if (categoryId) {
        measures = await storage.getSafetyMeasuresByRiskCategory(categoryId);
      } else {
        measures = await storage.getAllSafetyMeasures();
      }

      res.json(measures);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch safety measures' });
    }
  });

  app.get('/api/safety-measures/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const measure = await storage.getSafetyMeasure(id);

      if (!measure) {
        return res.status(404).json({ message: 'Safety measure not found' });
      }

      res.json(measure);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch safety measure' });
    }
  });

  app.post('/api/safety-measures', async (req: Request, res: Response) => {
    try {
      const validatedData = insertSafetyMeasureSchema.parse(req.body);
      const measure = await storage.createSafetyMeasure(validatedData);
      res.status(201).json(measure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid safety measure data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create safety measure' });
    }
  });

  app.put('/api/safety-measures/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSafetyMeasureSchema.partial().parse(req.body);
      const measure = await storage.updateSafetyMeasure(id, validatedData);

      if (!measure) {
        return res.status(404).json({ message: 'Safety measure not found' });
      }

      res.json(measure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid safety measure data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update safety measure' });
    }
  });

  app.delete('/api/safety-measures/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSafetyMeasure(id);

      if (!success) {
        return res.status(404).json({ message: 'Safety measure not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete safety measure' });
    }
  });

  // Training Types
  app.get('/api/training-types', async (req: Request, res: Response) => {
    try {
      const types = await storage.getAllTrainingTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch training types' });
    }
  });

  app.get('/api/training-types/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const type = await storage.getTrainingType(id);

      if (!type) {
        return res.status(404).json({ message: 'Training type not found' });
      }

      res.json(type);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch training type' });
    }
  });

  app.post('/api/training-types', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTrainingTypeSchema.parse(req.body);
      const type = await storage.createTrainingType(validatedData);
      res.status(201).json(type);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid training type data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create training type' });
    }
  });

  app.put('/api/training-types/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTrainingTypeSchema.partial().parse(req.body);
      const type = await storage.updateTrainingType(id, validatedData);

      if (!type) {
        return res.status(404).json({ message: 'Training type not found' });
      }

      res.json(type);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid training type data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update training type' });
    }
  });

  app.delete('/api/training-types/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTrainingType(id);

      if (!success) {
        return res.status(404).json({ message: 'Training type not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete training type' });
    }
  });

  // Employee Trainings
  app.get('/api/employee-trainings', async (req: Request, res: Response) => {
    try {
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const status = req.query.status as string | undefined;

      let trainings;
      if (employeeId) {
        trainings = await storage.getEmployeeTrainingsByEmployee(employeeId);
      } else if (status) {
        trainings = await storage.getEmployeeTrainingsByStatus(status);
      } else {
        trainings = await storage.getAllEmployeeTrainings();
      }

      res.json(trainings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employee trainings' });
    }
  });

  app.get('/api/employee-trainings/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const training = await storage.getEmployeeTraining(id);

      if (!training) {
        return res.status(404).json({ message: 'Employee training not found' });
      }

      res.json(training);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employee training' });
    }
  });

  app.post('/api/employee-trainings', async (req: Request, res: Response) => {
    try {
      const validatedData = insertEmployeeTrainingSchema.parse(req.body);
      const training = await storage.createEmployeeTraining(validatedData);
      res.status(201).json(training);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid employee training data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create employee training' });
    }
  });

  app.put('/api/employee-trainings/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeTrainingSchema.partial().parse(req.body);
      const training = await storage.updateEmployeeTraining(id, validatedData);

      if (!training) {
        return res.status(404).json({ message: 'Employee training not found' });
      }

      res.json(training);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid employee training data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update employee training' });
    }
  });

  app.delete('/api/employee-trainings/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployeeTraining(id);

      if (!success) {
        return res.status(404).json({ message: 'Employee training not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete employee training' });
    }
  });

  // Common Instructions
  app.get('/api/common-instructions', async (req: Request, res: Response) => {
    try {
      const instructions = await storage.getAllCommonInstructions();
      res.json(instructions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch common instructions' });
    }
  });

  app.get('/api/common-instructions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const instruction = await storage.getCommonInstruction(id);

      if (!instruction) {
        return res.status(404).json({ message: 'Common instruction not found' });
      }

      res.json(instruction);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch common instruction' });
    }
  });

  app.post('/api/common-instructions', async (req: Request, res: Response) => {
    try {
      const validatedData = insertCommonInstructionSchema.parse(req.body);
      const instruction = await storage.createCommonInstruction(validatedData);
      res.status(201).json(instruction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid common instruction data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create common instruction' });
    }
  });

  app.put('/api/common-instructions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCommonInstructionSchema.partial().parse(req.body);
      const instruction = await storage.updateCommonInstruction(id, validatedData);

      if (!instruction) {
        return res.status(404).json({ message: 'Common instruction not found' });
      }

      res.json(instruction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid common instruction data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to update common instruction' });
    }
  });

  app.delete('/api/common-instructions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCommonInstruction(id);

      if (!success) {
        return res.status(404).json({ message: 'Common instruction not found' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete common instruction' });
    }
  });

  // Dashboard statistics
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const employees = await storage.getAllEmployees();
      const employeeCount = employees.length;

      const employeeTrainings = await storage.getAllEmployeeTrainings();

      const completedTrainings = employeeTrainings.filter(t => t.status === 'Završeno').length;
      const inProgressTrainings = employeeTrainings.filter(t => t.status === 'U toku').length;
      const scheduledTrainings = employeeTrainings.filter(t => t.status === 'Zakazano').length;

      const documents = await storage.getAllBaseDocuments();
      const documentCount = documents.length;

      res.json({
        employeeCount,
        completedTrainings,
        inProgressTrainings,
        scheduledTrainings,
        documentCount
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Knowledge References
  app.get('/api/knowledge-references', async (req: Request, res: Response) => {
    try {
      const references = await storage.getAllKnowledgeReferences();
      res.json(references);
    } catch (error) {
      console.error('Error fetching knowledge references:', error);
      res.status(500).json({ message: 'Failed to fetch knowledge references' });
    }
  });

  app.get('/api/knowledge-references/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reference = await storage.getKnowledgeReference(id);

      if (!reference) {
        return res.status(404).json({ message: 'Knowledge reference not found' });
      }

      res.json(reference);
    } catch (error) {
      console.error('Error fetching knowledge reference:', error);
      res.status(500).json({ message: 'Failed to fetch knowledge reference' });
    }
  });

  app.post('/api/knowledge-references', async (req: Request, res: Response) => {
    try {
      // Sanitizacija opisa da ukloni sve HTML/XML tagove
      let data = req.body;
      
      if (data.description) {
        data.description = data.description
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
      
      console.log("Podaci pre validacije:", data);
      const validatedData = insertKnowledgeReferenceSchema.parse(data);
      console.log("Validiran podatak:", validatedData);
      
      const reference = await storage.createKnowledgeReference(validatedData);
      res.status(201).json(reference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod greška:", fromZodError(error).message);
        return res.status(400).json({ 
          message: 'Invalid knowledge reference data', 
          errors: fromZodError(error).message 
        });
      }
      
      console.error('Error creating knowledge reference:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: `Failed to create knowledge reference: ${errorMessage}` });
    }
  });

  app.put('/api/knowledge-references/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Sanitizacija opisa da ukloni sve HTML/XML tagove
      let data = req.body;
      
      if (data.description) {
        data.description = data.description
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
      
      const validatedData = insertKnowledgeReferenceSchema.partial().parse(data);
      const reference = await storage.updateKnowledgeReference(id, validatedData);

      if (!reference) {
        return res.status(404).json({ message: 'Knowledge reference not found' });
      }

      res.json(reference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod greška pri ažuriranju:", fromZodError(error).message);
        return res.status(400).json({ 
          message: 'Invalid knowledge reference data', 
          errors: fromZodError(error).message 
        });
      }
      console.error('Error updating knowledge reference:', error);
      res.status(500).json({ message: 'Failed to update knowledge reference' });
    }
  });

  app.delete('/api/knowledge-references/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteKnowledgeReference(id);

      if (!success) {
        return res.status(404).json({ message: 'Knowledge reference not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting knowledge reference:', error);
      res.status(500).json({ message: 'Failed to delete knowledge reference' });
    }
  });

  // Register document processing routes
  await setupDocumentProcessingRoutes(app);
  await setupDocumentRoutes(app);
  await setupAIAgentRoutes(app);
  setupDocumentScraperRoutes(app);
  
  // Register OCR service router
  app.use('/api/process', ocrRouter);
  
  // Register text extraction router
  app.use('/api/process', textExtractionRouter);
  
  // Register Wasabi storage routes
  app.use('/api/storage', wasabiStorageRouter);
  
  // Register blog routes
  app.use('/api/blog', blogRouter);
  
  // Register referral routes
  app.use('/api/referrals', referralRoutes);
  app.use('/api/ai/usage', aiUsageRoutes);
  
  // Registracija admin ruta
  app.use('/api/admin', adminRouter);
  
  // Registracija korisničkih ruta
  app.use('/api/user', userRouter);

  const httpServer = createServer(app);
  return httpServer;
}