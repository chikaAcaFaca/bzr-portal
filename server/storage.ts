import {
  users, type User, type InsertUser,
  baseDocuments, type BaseDocument, type InsertBaseDocument,
  jobPositions, type JobPosition, type InsertJobPosition,
  employees, type Employee, type InsertEmployee,
  jobDescriptions, type JobDescription, type InsertJobDescription,
  riskCategories, type RiskCategory, type InsertRiskCategory,
  risks, type Risk, type InsertRisk,
  safetyMeasures, type SafetyMeasure, type InsertSafetyMeasure,
  trainingTypes, type TrainingType, type InsertTrainingType,
  employeeTrainings, type EmployeeTraining, type InsertEmployeeTraining,
  commonInstructions, type CommonInstruction, type InsertCommonInstruction,
  knowledgeReferences, type KnowledgeReference, type InsertKnowledgeReference,
  blogPosts, type BlogPost, type InsertBlogPost
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Base Documents
  getBaseDocument(id: number): Promise<BaseDocument | undefined>;
  getAllBaseDocuments(): Promise<BaseDocument[]>;
  createBaseDocument(document: InsertBaseDocument): Promise<BaseDocument>;
  updateBaseDocument(id: number, document: Partial<InsertBaseDocument>): Promise<BaseDocument | undefined>;
  deleteBaseDocument(id: number): Promise<boolean>;

  // Job Positions
  getJobPosition(id: number): Promise<JobPosition | undefined>;
  getAllJobPositions(): Promise<JobPosition[]>;
  createJobPosition(position: InsertJobPosition): Promise<JobPosition>;
  updateJobPosition(id: number, position: Partial<InsertJobPosition>): Promise<JobPosition | undefined>;
  deleteJobPosition(id: number): Promise<boolean>;

  // Employees
  getEmployee(id: number): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  getEmployeesByJobPosition(jobPositionId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Job Descriptions
  getJobDescription(id: number): Promise<JobDescription | undefined>;
  getJobDescriptionByJobPosition(jobPositionId: number): Promise<JobDescription | undefined>;
  getAllJobDescriptions(): Promise<JobDescription[]>;
  createJobDescription(description: InsertJobDescription): Promise<JobDescription>;
  updateJobDescription(id: number, description: Partial<InsertJobDescription>): Promise<JobDescription | undefined>;
  deleteJobDescription(id: number): Promise<boolean>;

  // Risk Categories
  getRiskCategory(id: number): Promise<RiskCategory | undefined>;
  getAllRiskCategories(): Promise<RiskCategory[]>;
  getRiskCategoriesByJobPosition(jobPositionId: number): Promise<RiskCategory[]>;
  createRiskCategory(category: InsertRiskCategory): Promise<RiskCategory>;
  updateRiskCategory(id: number, category: Partial<InsertRiskCategory>): Promise<RiskCategory | undefined>;
  deleteRiskCategory(id: number): Promise<boolean>;

  // Risks
  getRisk(id: number): Promise<Risk | undefined>;
  getAllRisks(): Promise<Risk[]>;
  getRisksByCategory(categoryId: number): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: number, risk: Partial<InsertRisk>): Promise<Risk | undefined>;
  deleteRisk(id: number): Promise<boolean>;

  // Safety Measures
  getSafetyMeasure(id: number): Promise<SafetyMeasure | undefined>;
  getAllSafetyMeasures(): Promise<SafetyMeasure[]>;
  getSafetyMeasuresByRiskCategory(categoryId: number): Promise<SafetyMeasure[]>;
  createSafetyMeasure(measure: InsertSafetyMeasure): Promise<SafetyMeasure>;
  updateSafetyMeasure(id: number, measure: Partial<InsertSafetyMeasure>): Promise<SafetyMeasure | undefined>;
  deleteSafetyMeasure(id: number): Promise<boolean>;

  // Training Types
  getTrainingType(id: number): Promise<TrainingType | undefined>;
  getAllTrainingTypes(): Promise<TrainingType[]>;
  createTrainingType(type: InsertTrainingType): Promise<TrainingType>;
  updateTrainingType(id: number, type: Partial<InsertTrainingType>): Promise<TrainingType | undefined>;
  deleteTrainingType(id: number): Promise<boolean>;

  // Employee Trainings
  getEmployeeTraining(id: number): Promise<EmployeeTraining | undefined>;
  getAllEmployeeTrainings(): Promise<EmployeeTraining[]>;
  getEmployeeTrainingsByEmployee(employeeId: number): Promise<EmployeeTraining[]>;
  getEmployeeTrainingsByStatus(status: string): Promise<EmployeeTraining[]>;
  createEmployeeTraining(training: InsertEmployeeTraining): Promise<EmployeeTraining>;
  updateEmployeeTraining(id: number, training: Partial<InsertEmployeeTraining>): Promise<EmployeeTraining | undefined>;
  deleteEmployeeTraining(id: number): Promise<boolean>;

  // Common Instructions
  getCommonInstruction(id: number): Promise<CommonInstruction | undefined>;
  getAllCommonInstructions(): Promise<CommonInstruction[]>;
  createCommonInstruction(instruction: InsertCommonInstruction): Promise<CommonInstruction>;
  updateCommonInstruction(id: number, instruction: Partial<InsertCommonInstruction>): Promise<CommonInstruction | undefined>;
  deleteCommonInstruction(id: number): Promise<boolean>;
  
  // Knowledge References
  getKnowledgeReference(id: number): Promise<KnowledgeReference | undefined>;
  getAllKnowledgeReferences(): Promise<KnowledgeReference[]>;
  getActiveKnowledgeReferences(): Promise<KnowledgeReference[]>;
  getKnowledgeReferencesByCategory(category: string): Promise<KnowledgeReference[]>;
  createKnowledgeReference(reference: InsertKnowledgeReference): Promise<KnowledgeReference>;
  updateKnowledgeReference(id: number, reference: Partial<InsertKnowledgeReference>): Promise<KnowledgeReference | undefined>;
  deleteKnowledgeReference(id: number): Promise<boolean>;
  
  // Blog Posts
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPostsByStatus(status: string): Promise<BlogPost[]>;
  getBlogPostsByCategory(category: string): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  incrementBlogViewCount(id: number): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private baseDocuments: Map<number, BaseDocument>;
  private jobPositions: Map<number, JobPosition>;
  private employees: Map<number, Employee>;
  private jobDescriptions: Map<number, JobDescription>;
  private riskCategories: Map<number, RiskCategory>;
  private risks: Map<number, Risk>;
  private safetyMeasures: Map<number, SafetyMeasure>;
  private trainingTypes: Map<number, TrainingType>;
  private employeeTrainings: Map<number, EmployeeTraining>;
  private commonInstructions: Map<number, CommonInstruction>;
  private knowledgeReferences: Map<number, KnowledgeReference>;
  private blogPosts: Map<number, BlogPost>;
  
  private userCurrentId: number;
  private baseDocumentCurrentId: number;
  private jobPositionCurrentId: number;
  private employeeCurrentId: number;
  private jobDescriptionCurrentId: number;
  private riskCategoryCurrentId: number;
  private riskCurrentId: number;
  private safetyMeasureCurrentId: number;
  private trainingTypeCurrentId: number;
  private employeeTrainingCurrentId: number;
  private commonInstructionCurrentId: number;
  private knowledgeReferenceCurrentId: number;
  private blogPostCurrentId: number;

  constructor() {
    this.users = new Map();
    this.baseDocuments = new Map();
    this.jobPositions = new Map();
    this.employees = new Map();
    this.jobDescriptions = new Map();
    this.riskCategories = new Map();
    this.risks = new Map();
    this.safetyMeasures = new Map();
    this.trainingTypes = new Map();
    this.employeeTrainings = new Map();
    this.commonInstructions = new Map();
    this.knowledgeReferences = new Map();
    this.blogPosts = new Map();
    
    this.userCurrentId = 1;
    this.baseDocumentCurrentId = 1;
    this.jobPositionCurrentId = 1;
    this.employeeCurrentId = 1;
    this.jobDescriptionCurrentId = 1;
    this.riskCategoryCurrentId = 1;
    this.riskCurrentId = 1;
    this.safetyMeasureCurrentId = 1;
    this.trainingTypeCurrentId = 1;
    this.employeeTrainingCurrentId = 1;
    this.commonInstructionCurrentId = 1;
    this.knowledgeReferenceCurrentId = 1;
    this.blogPostCurrentId = 1;
    
    // Initialize with some data
    this.initializeData();
  }

  private initializeData(): void {
    // Add admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrator',
      email: 'admin@example.com',
      role: 'admin'
    });

    // Add training types based on the provided codes
    const trainingTypes = [
      { code: '01', name: 'Prilikom zasnivanja radnog odnosa', description: 'Obuka koja se sprovodi kada zaposleni počinje rad kod poslodavca' },
      { code: '02', name: 'Usled premeštaja na druge poslove', description: 'Obuka koja se sprovodi kada se zaposleni premešta na drugo radno mesto' },
      { code: '03', name: 'Prilikom uvođenja nove tehnologije', description: 'Obuka koja se sprovodi kada se uvodi nova tehnologija u radni proces' },
      { code: '04', name: 'Prilikom uvođenja novih sredstava za rad', description: 'Obuka koja se sprovodi kada se uvode nova sredstva za rad' },
      { code: '05', name: 'Prilikom promene procesa rada', description: 'Obuka koja se sprovodi kada se menja proces rada' },
      { code: '06', name: 'Kada poslodavac odredi zaposlenom više radnih mesta', description: 'Obuka kada zaposleni istovremeno obavlja poslove na dva ili više radnih mesta' },
      { code: '07', name: 'Kada kod poslodavca rad obavljaju zaposleni drugog poslodavca', description: 'Obuka za zaposlene koji rade po ugovoru, sporazumu ili drugom osnovu' },
      { code: '08', name: 'Usled periodične provere osposobljenosti', description: 'Periodična provera znanja zaposlenih iz oblasti bezbednosti i zdravlja na radu' }
    ];

    trainingTypes.forEach(type => {
      this.createTrainingType(type);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }

  // Base Documents
  async getBaseDocument(id: number): Promise<BaseDocument | undefined> {
    return this.baseDocuments.get(id);
  }

  async getAllBaseDocuments(): Promise<BaseDocument[]> {
    return Array.from(this.baseDocuments.values());
  }

  async createBaseDocument(document: InsertBaseDocument): Promise<BaseDocument> {
    const id = this.baseDocumentCurrentId++;
    const now = new Date();
    const baseDocument: BaseDocument = { ...document, id, uploadDate: now };
    this.baseDocuments.set(id, baseDocument);
    return baseDocument;
  }

  async updateBaseDocument(id: number, document: Partial<InsertBaseDocument>): Promise<BaseDocument | undefined> {
    const existingDocument = this.baseDocuments.get(id);
    if (!existingDocument) return undefined;
    
    const updatedDocument: BaseDocument = { ...existingDocument, ...document };
    this.baseDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteBaseDocument(id: number): Promise<boolean> {
    return this.baseDocuments.delete(id);
  }

  // Job Positions
  async getJobPosition(id: number): Promise<JobPosition | undefined> {
    return this.jobPositions.get(id);
  }

  async getAllJobPositions(): Promise<JobPosition[]> {
    return Array.from(this.jobPositions.values());
  }

  async createJobPosition(position: InsertJobPosition): Promise<JobPosition> {
    const id = this.jobPositionCurrentId++;
    const jobPosition: JobPosition = { ...position, id };
    this.jobPositions.set(id, jobPosition);
    return jobPosition;
  }

  async updateJobPosition(id: number, position: Partial<InsertJobPosition>): Promise<JobPosition | undefined> {
    const existingPosition = this.jobPositions.get(id);
    if (!existingPosition) return undefined;
    
    const updatedPosition: JobPosition = { ...existingPosition, ...position };
    this.jobPositions.set(id, updatedPosition);
    return updatedPosition;
  }

  async deleteJobPosition(id: number): Promise<boolean> {
    return this.jobPositions.delete(id);
  }

  // Employees
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployeesByJobPosition(jobPositionId: number): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      (employee) => employee.jobPositionId === jobPositionId,
    );
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeCurrentId++;
    const newEmployee: Employee = { ...employee, id };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existingEmployee = this.employees.get(id);
    if (!existingEmployee) return undefined;
    
    const updatedEmployee: Employee = { ...existingEmployee, ...employee };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Job Descriptions
  async getJobDescription(id: number): Promise<JobDescription | undefined> {
    return this.jobDescriptions.get(id);
  }

  async getJobDescriptionByJobPosition(jobPositionId: number): Promise<JobDescription | undefined> {
    return Array.from(this.jobDescriptions.values()).find(
      (description) => description.jobPositionId === jobPositionId,
    );
  }

  async getAllJobDescriptions(): Promise<JobDescription[]> {
    return Array.from(this.jobDescriptions.values());
  }

  async createJobDescription(description: InsertJobDescription): Promise<JobDescription> {
    const id = this.jobDescriptionCurrentId++;
    const now = new Date();
    const jobDescription: JobDescription = { ...description, id, createdAt: now, updatedAt: now };
    this.jobDescriptions.set(id, jobDescription);
    return jobDescription;
  }

  async updateJobDescription(id: number, description: Partial<InsertJobDescription>): Promise<JobDescription | undefined> {
    const existingDescription = this.jobDescriptions.get(id);
    if (!existingDescription) return undefined;
    
    const now = new Date();
    const updatedDescription: JobDescription = { 
      ...existingDescription, 
      ...description, 
      updatedAt: now 
    };
    this.jobDescriptions.set(id, updatedDescription);
    return updatedDescription;
  }

  async deleteJobDescription(id: number): Promise<boolean> {
    return this.jobDescriptions.delete(id);
  }

  // Risk Categories
  async getRiskCategory(id: number): Promise<RiskCategory | undefined> {
    return this.riskCategories.get(id);
  }

  async getAllRiskCategories(): Promise<RiskCategory[]> {
    return Array.from(this.riskCategories.values());
  }

  async getRiskCategoriesByJobPosition(jobPositionId: number): Promise<RiskCategory[]> {
    return Array.from(this.riskCategories.values()).filter(
      (category) => category.jobPositions.includes(jobPositionId),
    );
  }

  async createRiskCategory(category: InsertRiskCategory): Promise<RiskCategory> {
    const id = this.riskCategoryCurrentId++;
    const riskCategory: RiskCategory = { ...category, id };
    this.riskCategories.set(id, riskCategory);
    return riskCategory;
  }

  async updateRiskCategory(id: number, category: Partial<InsertRiskCategory>): Promise<RiskCategory | undefined> {
    const existingCategory = this.riskCategories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory: RiskCategory = { ...existingCategory, ...category };
    this.riskCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteRiskCategory(id: number): Promise<boolean> {
    return this.riskCategories.delete(id);
  }

  // Risks
  async getRisk(id: number): Promise<Risk | undefined> {
    return this.risks.get(id);
  }

  async getAllRisks(): Promise<Risk[]> {
    return Array.from(this.risks.values());
  }

  async getRisksByCategory(categoryId: number): Promise<Risk[]> {
    return Array.from(this.risks.values()).filter(
      (risk) => risk.categoryId === categoryId,
    );
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const id = this.riskCurrentId++;
    const newRisk: Risk = { ...risk, id };
    this.risks.set(id, newRisk);
    return newRisk;
  }

  async updateRisk(id: number, risk: Partial<InsertRisk>): Promise<Risk | undefined> {
    const existingRisk = this.risks.get(id);
    if (!existingRisk) return undefined;
    
    const updatedRisk: Risk = { ...existingRisk, ...risk };
    this.risks.set(id, updatedRisk);
    return updatedRisk;
  }

  async deleteRisk(id: number): Promise<boolean> {
    return this.risks.delete(id);
  }

  // Safety Measures
  async getSafetyMeasure(id: number): Promise<SafetyMeasure | undefined> {
    return this.safetyMeasures.get(id);
  }

  async getAllSafetyMeasures(): Promise<SafetyMeasure[]> {
    return Array.from(this.safetyMeasures.values());
  }

  async getSafetyMeasuresByRiskCategory(categoryId: number): Promise<SafetyMeasure[]> {
    return Array.from(this.safetyMeasures.values()).filter(
      (measure) => measure.applicableRiskCategories.includes(categoryId),
    );
  }

  async createSafetyMeasure(measure: InsertSafetyMeasure): Promise<SafetyMeasure> {
    const id = this.safetyMeasureCurrentId++;
    const safetyMeasure: SafetyMeasure = { ...measure, id };
    this.safetyMeasures.set(id, safetyMeasure);
    return safetyMeasure;
  }

  async updateSafetyMeasure(id: number, measure: Partial<InsertSafetyMeasure>): Promise<SafetyMeasure | undefined> {
    const existingMeasure = this.safetyMeasures.get(id);
    if (!existingMeasure) return undefined;
    
    const updatedMeasure: SafetyMeasure = { ...existingMeasure, ...measure };
    this.safetyMeasures.set(id, updatedMeasure);
    return updatedMeasure;
  }

  async deleteSafetyMeasure(id: number): Promise<boolean> {
    return this.safetyMeasures.delete(id);
  }

  // Training Types
  async getTrainingType(id: number): Promise<TrainingType | undefined> {
    return this.trainingTypes.get(id);
  }

  async getAllTrainingTypes(): Promise<TrainingType[]> {
    return Array.from(this.trainingTypes.values());
  }

  async createTrainingType(type: InsertTrainingType): Promise<TrainingType> {
    const id = this.trainingTypeCurrentId++;
    const trainingType: TrainingType = { ...type, id };
    this.trainingTypes.set(id, trainingType);
    return trainingType;
  }

  async updateTrainingType(id: number, type: Partial<InsertTrainingType>): Promise<TrainingType | undefined> {
    const existingType = this.trainingTypes.get(id);
    if (!existingType) return undefined;
    
    const updatedType: TrainingType = { ...existingType, ...type };
    this.trainingTypes.set(id, updatedType);
    return updatedType;
  }

  async deleteTrainingType(id: number): Promise<boolean> {
    return this.trainingTypes.delete(id);
  }

  // Employee Trainings
  async getEmployeeTraining(id: number): Promise<EmployeeTraining | undefined> {
    return this.employeeTrainings.get(id);
  }

  async getAllEmployeeTrainings(): Promise<EmployeeTraining[]> {
    return Array.from(this.employeeTrainings.values());
  }

  async getEmployeeTrainingsByEmployee(employeeId: number): Promise<EmployeeTraining[]> {
    return Array.from(this.employeeTrainings.values()).filter(
      (training) => training.employeeId === employeeId,
    );
  }

  async getEmployeeTrainingsByStatus(status: string): Promise<EmployeeTraining[]> {
    return Array.from(this.employeeTrainings.values()).filter(
      (training) => training.status === status,
    );
  }

  async createEmployeeTraining(training: InsertEmployeeTraining): Promise<EmployeeTraining> {
    const id = this.employeeTrainingCurrentId++;
    const employeeTraining: EmployeeTraining = { ...training, id };
    this.employeeTrainings.set(id, employeeTraining);
    return employeeTraining;
  }

  async updateEmployeeTraining(id: number, training: Partial<InsertEmployeeTraining>): Promise<EmployeeTraining | undefined> {
    const existingTraining = this.employeeTrainings.get(id);
    if (!existingTraining) return undefined;
    
    const updatedTraining: EmployeeTraining = { ...existingTraining, ...training };
    this.employeeTrainings.set(id, updatedTraining);
    return updatedTraining;
  }

  async deleteEmployeeTraining(id: number): Promise<boolean> {
    return this.employeeTrainings.delete(id);
  }

  // Common Instructions
  async getCommonInstruction(id: number): Promise<CommonInstruction | undefined> {
    return this.commonInstructions.get(id);
  }

  async getAllCommonInstructions(): Promise<CommonInstruction[]> {
    return Array.from(this.commonInstructions.values());
  }

  async createCommonInstruction(instruction: InsertCommonInstruction): Promise<CommonInstruction> {
    const id = this.commonInstructionCurrentId++;
    const commonInstruction: CommonInstruction = { ...instruction, id };
    this.commonInstructions.set(id, commonInstruction);
    return commonInstruction;
  }

  async updateCommonInstruction(id: number, instruction: Partial<InsertCommonInstruction>): Promise<CommonInstruction | undefined> {
    const existingInstruction = this.commonInstructions.get(id);
    if (!existingInstruction) return undefined;
    
    const updatedInstruction: CommonInstruction = { ...existingInstruction, ...instruction };
    this.commonInstructions.set(id, updatedInstruction);
    return updatedInstruction;
  }

  async deleteCommonInstruction(id: number): Promise<boolean> {
    return this.commonInstructions.delete(id);
  }

  // Knowledge References
  async getKnowledgeReference(id: number): Promise<KnowledgeReference | undefined> {
    return this.knowledgeReferences.get(id);
  }

  async getAllKnowledgeReferences(): Promise<KnowledgeReference[]> {
    return Array.from(this.knowledgeReferences.values());
  }

  async getActiveKnowledgeReferences(): Promise<KnowledgeReference[]> {
    return Array.from(this.knowledgeReferences.values()).filter(
      (reference) => reference.isActive,
    );
  }

  async getKnowledgeReferencesByCategory(category: string): Promise<KnowledgeReference[]> {
    return Array.from(this.knowledgeReferences.values()).filter(
      (reference) => reference.category === category,
    );
  }

  async createKnowledgeReference(reference: InsertKnowledgeReference): Promise<KnowledgeReference> {
    const id = this.knowledgeReferenceCurrentId++;
    const now = new Date();
    const knowledgeReference: KnowledgeReference = { 
      ...reference, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.knowledgeReferences.set(id, knowledgeReference);
    return knowledgeReference;
  }

  async updateKnowledgeReference(id: number, reference: Partial<InsertKnowledgeReference>): Promise<KnowledgeReference | undefined> {
    const existingReference = this.knowledgeReferences.get(id);
    if (!existingReference) return undefined;
    
    const now = new Date();
    const updatedReference: KnowledgeReference = { 
      ...existingReference, 
      ...reference, 
      updatedAt: now 
    };
    this.knowledgeReferences.set(id, updatedReference);
    return updatedReference;
  }

  async deleteKnowledgeReference(id: number): Promise<boolean> {
    return this.knowledgeReferences.delete(id);
  }

  // Blog Posts
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(
      (post) => post.slug === slug,
    );
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values());
  }

  async getBlogPostsByStatus(status: string): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).filter(
      (post) => post.status === status,
    );
  }

  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).filter(
      (post) => post.category === category,
    );
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.blogPostCurrentId++;
    const now = new Date();
    const blogPost: BlogPost = { 
      ...post, 
      id, 
      createdAt: now, 
      updatedAt: now,
      viewCount: 0,
      publishedAt: post.status === 'published' ? now : null
    };
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) return undefined;
    
    const now = new Date();
    const wasPublished = existingPost.status !== 'published' && post.status === 'published';
    
    const updatedPost: BlogPost = { 
      ...existingPost, 
      ...post, 
      updatedAt: now,
      publishedAt: wasPublished ? now : existingPost.publishedAt
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async incrementBlogViewCount(id: number): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) return undefined;
    
    const updatedPost: BlogPost = {
      ...existingPost,
      viewCount: existingPost.viewCount + 1
    };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }
}

export const storage = new MemStorage();
