import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
});

// Base Documents
export const baseDocuments = pgTable("base_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  category: text("category").notNull(),
});

export const insertBaseDocumentSchema = createInsertSchema(baseDocuments).pick({
  title: true,
  description: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  category: true,
});

// Define risk level enum
export const riskLevelEnum = pgEnum('risk_level', ['nisko', 'srednje', 'visoko']);

// Define position type enum
export const positionTypeEnum = pgEnum('position_type', ['direktori', 'rukovodioci', 'administrativni', 'radnici', 'vozaci', 'tehnicko_osoblje']);

// Job Positions (without employee names)
export const jobPositions = pgTable("job_positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  description: text("description"),
  requiredSkills: text("required_skills").array(),
  responsibilities: text("responsibilities").array(),
  isActive: boolean("is_active").notNull().default(true),
  positionType: positionTypeEnum("position_type"),
  riskLevel: riskLevelEnum("risk_level"),
  coefficient: integer("coefficient"), // For sorting by importance 
});

export const insertJobPositionSchema = createInsertSchema(jobPositions).pick({
  title: true,
  department: true,
  description: true,
  requiredSkills: true,
  responsibilities: true,
  isActive: true,
  positionType: true,
  riskLevel: true,
  coefficient: true,
});

// Employees on Job Positions
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  jobPositionId: integer("job_position_id").notNull(),
  hireDate: timestamp("hire_date").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  jobPositionId: true,
  hireDate: true,
  isActive: true,
});

// Job Descriptions
export const jobDescriptions = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  jobPositionId: integer("job_position_id").notNull(),
  description: text("description").notNull(),
  duties: text("duties").array(),
  workingConditions: text("working_conditions"),
  equipment: text("equipment").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).pick({
  jobPositionId: true,
  description: true,
  duties: true,
  workingConditions: true,
  equipment: true,
});

// Risk Categories
export const riskCategories = pgTable("risk_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // Low, Medium, High
  likelihood: text("likelihood").notNull(), // Unlikely, Possible, Likely
  jobPositions: integer("job_positions").array(), // Array of job position IDs that fall under this category
});

export const insertRiskCategorySchema = createInsertSchema(riskCategories).pick({
  name: true,
  description: true,
  severity: true,
  likelihood: true,
  jobPositions: true,
});

// Risks associated with categories
export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  description: text("description").notNull(),
  potentialHarm: text("potential_harm").notNull(),
  controlMeasures: text("control_measures").array(),
});

export const insertRiskSchema = createInsertSchema(risks).pick({
  categoryId: true,
  description: true,
  potentialHarm: true,
  controlMeasures: true,
});

// Safety Measures
export const safetyMeasures = pgTable("safety_measures", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  applicableRiskCategories: integer("applicable_risk_categories").array(),
  instructions: text("instructions").notNull(),
  requiredEquipment: text("required_equipment").array(),
});

export const insertSafetyMeasureSchema = createInsertSchema(safetyMeasures).pick({
  title: true,
  description: true,
  applicableRiskCategories: true,
  instructions: true,
  requiredEquipment: true,
});

// Training Types
export const trainingTypes = pgTable("training_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(), // 01, 02, etc.
  name: text("name").notNull(),
  description: text("description"),
});

export const insertTrainingTypeSchema = createInsertSchema(trainingTypes).pick({
  code: true,
  name: true,
  description: true,
});

// Employee Training Records
export const employeeTrainings = pgTable("employee_trainings", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  trainingTypeId: integer("training_type_id").notNull(),
  trainingDate: timestamp("training_date").notNull(),
  completedDate: timestamp("completed_date"),
  status: text("status").notNull(), // Scheduled, In Progress, Completed
  notes: text("notes"),
  trainedRisks: integer("trained_risks").array(),
  safetyMeasures: integer("safety_measures").array(),
});

export const insertEmployeeTrainingSchema = createInsertSchema(employeeTrainings).pick({
  employeeId: true,
  trainingTypeId: true,
  trainingDate: true,
  completedDate: true,
  status: true,
  notes: true,
  trainedRisks: true,
  safetyMeasures: true,
});

// Common Instructions for all positions
export const commonInstructions = pgTable("common_instructions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertCommonInstructionSchema = createInsertSchema(commonInstructions).pick({
  title: true,
  content: true,
  isActive: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BaseDocument = typeof baseDocuments.$inferSelect;
export type InsertBaseDocument = z.infer<typeof insertBaseDocumentSchema>;

export type JobPosition = typeof jobPositions.$inferSelect;
export type InsertJobPosition = z.infer<typeof insertJobPositionSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;

export type RiskCategory = typeof riskCategories.$inferSelect;
export type InsertRiskCategory = z.infer<typeof insertRiskCategorySchema>;

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export type SafetyMeasure = typeof safetyMeasures.$inferSelect;
export type InsertSafetyMeasure = z.infer<typeof insertSafetyMeasureSchema>;

export type TrainingType = typeof trainingTypes.$inferSelect;
export type InsertTrainingType = z.infer<typeof insertTrainingTypeSchema>;

export type EmployeeTraining = typeof employeeTrainings.$inferSelect;
export type InsertEmployeeTraining = z.infer<typeof insertEmployeeTrainingSchema>;

export type CommonInstruction = typeof commonInstructions.$inferSelect;
export type InsertCommonInstruction = z.infer<typeof insertCommonInstructionSchema>;
