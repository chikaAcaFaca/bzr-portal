import { pgTable, serial, text, boolean, timestamp, integer, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pib: text("pib").notNull().unique(),
  registrationNumber: text("registration_number").notNull().unique(), // Matični broj
  registrationDocUrl: text("registration_doc_url"), // APR document URL
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  pib: true,
  registrationNumber: true,
  registrationDocUrl: true,
});

// Systematization History
export const systematizationHistory = pgTable("systematization_history", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  documentUrl: text("document_url"), // URL to stored systematization document
  effectiveDate: timestamp("effective_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSystematizationHistorySchema = createInsertSchema(systematizationHistory).pick({
  companyId: true,
  documentUrl: true,
  effectiveDate: true,
  isActive: true,
});

// User role enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// User subscription type enum
export const userSubscriptionEnum = pgEnum('user_subscription', ['free', 'pro']);

// Users
export const users = pgTable("users", {
  companyId: integer("company_id").notNull(),
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: userRoleEnum("role").notNull().default("user"), // admin, user
  subscriptionType: userSubscriptionEnum("subscription_type").notNull().default("free"), // free, pro
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
});

// Basic Documents
export const baseDocuments = pgTable("base_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  documentType: text("document_type").notNull(), // act, rulebook, instruction, law, etc.
  content: text("content"), // Actual document content
  fileUrl: text("file_url"), // Link to the document file if stored elsewhere
  version: text("version").notNull().default("1.0"),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  status: text("status").notNull().default("active"), // draft, active, archived, expired
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBaseDocumentSchema = createInsertSchema(baseDocuments).pick({
  title: true,
  description: true,
  documentType: true,
  content: true,
  fileUrl: true,
  version: true,
  effectiveDate: true,
  expirationDate: true,
  status: true,
});

// Risk Levels for Job Positions
export const riskLevelEnum = pgEnum('risk_level', ['nisko', 'srednje', 'visoko']);

// Position Types for Job Positions
export const positionTypeEnum = pgEnum('position_type', ['direktori', 'rukovodioci', 'administrativni', 'radnici', 'vozaci', 'tehnicko_osoblje']);

// Job Positions from Systematization
export const jobPositions = pgTable("job_positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department"),
  description: text("description").notNull(),
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
  personalIdNumber: text("personal_id_number"), // JMBG
  identificationNumber: text("identification_number"), // Broj lične karte
  // Adresa
  street: text("street"),
  streetNumber: text("street_number"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Srbija"),
  // Podaci o zaposlenju
  jobPositionId: integer("job_position_id").notNull(),
  hireDate: timestamp("hire_date").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  personalIdNumber: true,
  identificationNumber: true,
  street: true,
  streetNumber: true,
  city: true,
  postalCode: true,
  country: true,
  jobPositionId: true,
  hireDate: true,
  isActive: true,
  notes: true,
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

// Knowledge References for AI Agent
export const knowledgeReferences = pgTable("knowledge_references", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"), // general, law, regulation, guideline, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKnowledgeReferenceSchema = createInsertSchema(knowledgeReferences).pick({
  title: true,
  url: true,
  description: true,
  category: true,
  isActive: true,
});

// Blog status enum
export const blogStatusEnum = pgEnum('blog_status', ['draft', 'pending_approval', 'approved', 'published', 'rejected']);

// Blog posts
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  category: text("category").notNull().default("general"),
  tags: text("tags").array(),
  authorId: integer("author_id"), // Can be null for AI-generated content
  originalQuestion: text("original_question"), // Original question asked to AI
  callToAction: text("call_to_action"), // CTA text
  status: blogStatusEnum("status").notNull().default("draft"),
  adminFeedback: text("admin_feedback"), // Feedback from admin for rejected posts
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts)
  .omit({ 
    id: true,
    viewCount: true, 
    createdAt: true, 
    updatedAt: true, 
    publishedAt: true 
  });

// Type exports
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type SystematizationHistory = typeof systematizationHistory.$inferSelect;
export type InsertSystematizationHistory = z.infer<typeof insertSystematizationHistorySchema>;

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

export type KnowledgeReference = typeof knowledgeReferences.$inferSelect;
export type InsertKnowledgeReference = z.infer<typeof insertKnowledgeReferenceSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;