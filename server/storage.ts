import { 
  users, User, InsertUser, 
  clients, Client, InsertClient,
  leads, Lead, InsertLead,
  projects, Project, InsertProject,
  proposals, Proposal, InsertProposal,
  moodboards, Moodboard, InsertMoodboard,
  estimates, Estimate, InsertEstimate,
  estimateConfigs, EstimateConfig, InsertEstimateConfig,
  activities, Activity, InsertActivity,
  whatsappMessages, WhatsappMessage, InsertWhatsappMessage
} from "@shared/schema";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Initialize a direct PostgreSQL connection
// This works with any Postgres database, including Supabase
const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 10, // Connection pool size
  ssl: 'require', // Enable SSL for secure connections
  connect_timeout: 10, // Increase timeout to give connection time to establish
});

export const db = drizzle(queryClient);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserBySupabaseUid(supabaseUid: string): Promise<User | undefined>;
  getUserByField(field: string, value: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Lead methods
  getLeads(userId: number): Promise<Lead[]>;
  getLeadsByStage(stage: string): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  
  // Client methods
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Project methods
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByClientId(clientId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project rooms methods
  addProjectRoom(projectId: number, roomData: {name: string, description?: string}): Promise<Project>;
  updateProjectRoom(projectId: number, roomId: number, roomData: any): Promise<Project>;
  deleteProjectRoom(projectId: number, roomId: number): Promise<Project>;
  
  // Project tasks methods
  addProjectRoomTask(projectId: number, roomId: number | null, taskData: any): Promise<Project>;
  updateProjectTask(projectId: number, taskId: number, taskData: any): Promise<Project>;
  deleteProjectTask(projectId: number, taskId: number): Promise<Project>;
  
  // Project logs methods
  addProjectLog(projectId: number, logData: any, userId: number): Promise<Project>;
  
  // Project reports methods
  configureProjectReports(projectId: number, reportSettings: any): Promise<Project>;
  
  // Proposal methods
  getProposals(userId: number): Promise<Proposal[]>;
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposalsByProjectId(projectId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, proposal: Partial<Proposal>): Promise<Proposal | undefined>;
  deleteProposal(id: number): Promise<boolean>;
  
  // Moodboard methods
  getMoodboards(): Promise<Moodboard[]>;
  getMoodboard(id: number): Promise<Moodboard | undefined>;
  getMoodboardsByClientId(clientId: number): Promise<Moodboard[]>;
  getMoodboardTemplates(): Promise<Moodboard[]>;
  duplicateMoodboard(id: number): Promise<Moodboard | undefined>;
  createMoodboard(moodboard: InsertMoodboard): Promise<Moodboard>;
  updateMoodboard(id: number, moodboard: Partial<Moodboard>): Promise<Moodboard | undefined>;
  deleteMoodboard(id: number): Promise<boolean>;
  
  // EstimateConfig methods
  getEstimateConfigs(): Promise<EstimateConfig[]>;
  getActiveEstimateConfigs(): Promise<EstimateConfig[]>;
  getEstimateConfigsByType(configType: string): Promise<EstimateConfig[]>;
  getEstimateConfig(id: number): Promise<EstimateConfig | undefined>;
  createEstimateConfig(config: InsertEstimateConfig): Promise<EstimateConfig>;
  updateEstimateConfig(id: number, config: Partial<EstimateConfig>): Promise<EstimateConfig | undefined>;
  deleteEstimateConfig(id: number): Promise<boolean>;
  
  // Estimate methods
  getEstimate(id: number): Promise<Estimate | undefined>;
  getEstimatesByClientId(clientId: number): Promise<Estimate[]>;
  getEstimatesByLeadId(leadId: number): Promise<Estimate[]>;
  getEstimateTemplates(): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: number, estimate: Partial<Estimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: number): Promise<boolean>;
  
  // Activity methods
  getActivities(userId: number, limit?: number): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByClientId(clientId: number): Promise<Activity[]>;
  getActivitiesByProjectId(projectId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // WhatsApp message methods
  getWhatsAppMessages(): Promise<WhatsappMessage[]>;
  getWhatsAppMessagesByLeadId(leadId: number): Promise<WhatsappMessage[]>;
  getWhatsAppMessagesByClientId(clientId: number): Promise<WhatsappMessage[]>;
  getWhatsAppMessageById(messageId: string): Promise<WhatsappMessage | undefined>;
  getWhatsAppFailedMessages(maxRetries: number): Promise<WhatsappMessage[]>;
  createWhatsAppMessageLog(message: Omit<WhatsappMessage, 'createdAt' | 'updatedAt'>): Promise<WhatsappMessage>;
  updateWhatsAppMessageStatus(messageId: string, statusUpdate: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined>;
  updateWhatsAppMessageRetryCount(messageId: string, retryCount: number): Promise<WhatsappMessage | undefined>;
  
  // Company settings methods
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings | undefined>;
  
  // Templates methods
  getTemplateCategories(type?: string): Promise<TemplateCategory[]>;
  getTemplateCategory(id: number): Promise<TemplateCategory | undefined>;
  createTemplateCategory(category: InsertTemplateCategory): Promise<TemplateCategory>;
  updateTemplateCategory(id: number, category: Partial<TemplateCategory>): Promise<TemplateCategory | undefined>;
  deleteTemplateCategory(id: number): Promise<boolean>;
  
  getTemplates(type?: string, categoryId?: number): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  getDefaultTemplate(type: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  setDefaultTemplate(id: number, type: string): Promise<boolean>;
  
  // Analytics methods
  getAnalytics(metric?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalyticsEntry(entry: InsertAnalytics): Promise<Analytics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private proposals: Map<number, Proposal>;
  private moodboards: Map<number, Moodboard>;
  private estimates: Map<number, Estimate>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  private companySettings: CompanySettings | undefined;
  private templateCategories: Map<number, TemplateCategory>;
  private templates: Map<number, Template>;
  private analytics: Map<number, Analytics>;
  
  private userId: number;
  private leadId: number;
  private clientId: number;
  private projectId: number;
  private proposalId: number;
  private moodboardId: number;
  private estimateId: number;
  private taskId: number;
  private activityId: number;
  private templateCategoryId: number;
  private templateId: number;
  private analyticsId: number;
  private whatsappMessages: Map<string, WhatsappMessage>;

  // Add estimateConfig map
  private estimateConfigs = new Map<number, EstimateConfig>();
  private estimateConfigId = 1;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.proposals = new Map();
    this.moodboards = new Map();
    this.estimates = new Map();
    this.estimateConfigs = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    this.whatsappMessages = new Map();
    this.templateCategories = new Map();
    this.templates = new Map();
    this.analytics = new Map();
    
    // Initialize company settings with defaults
    this.companySettings = {
      id: 1,
      name: "Design Studio",
      logo: null,
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      enabledFeatures: {
        crm: true,
        proposals: true,
        moodboards: true,
        estimates: true,
        whatsapp: true,
        tasks: true
      },
      planLimits: {
        free: {
          maxUsers: 2,
          maxClients: 10,
          maxProjects: 5,
          maxProposals: 10,
          maxStorage: 100, // MB
        },
        pro: {
          maxUsers: 5,
          maxClients: 50,
          maxProjects: 20,
          maxProposals: 100,
          maxStorage: 1000, // MB
        },
        enterprise: {
          maxUsers: -1, // unlimited
          maxClients: -1, // unlimited
          maxProjects: -1, // unlimited
          maxProposals: -1, // unlimited
          maxStorage: 10000, // MB
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userId = 1;
    this.leadId = 1;
    this.clientId = 1;
    this.projectId = 1;
    this.proposalId = 1;
    this.templateCategoryId = 1;
    this.templateId = 1;
    this.analyticsId = 1;
    this.moodboardId = 1;
    this.estimateId = 1;
    this.estimateConfigId = 1;
    this.taskId = 1;
    this.activityId = 1;
    
    // Add a default user for testing
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      fullName: "Sophia Martinez",
      name: "Sophia Martinez", // Add name field to match schema
      role: "admin",
      company: "InteriDesign Studio",
      phone: null,
      avatar: null,
      firebaseUid: null,
      supabaseUid: null,
      activePlan: "pro"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }
  
  async getUserBySupabaseUid(supabaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.supabaseUid === supabaseUid,
    );
  }
  
  async getUserByField(field: string, value: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user[field as keyof User] === value,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    
    // Ensure all required fields have values
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      updatedAt: now,
      // Set defaults for missing optional fields
      role: insertUser.role || "designer",
      phone: insertUser.phone || null,
      activePlan: insertUser.activePlan || "free",
      firebaseUid: insertUser.firebaseUid || null,
      supabaseUid: insertUser.supabaseUid || null,
      company: insertUser.company || null,
      avatar: insertUser.avatar || null
    };
    
    this.users.set(id, user);
    console.log(`Created user: id=${id}, name=${user.name}, email=${user.email}`);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Lead methods
  async getLeads(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.assignedTo === userId,
    );
  }

  async getLeadsByStage(stage: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.stage === stage,
    );
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadId++;
    const now = new Date();
    const lead: Lead = { 
      ...insertLead, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, leadData: Partial<Lead>): Promise<Lead | undefined> {
    const existingLead = await this.getLead(id);
    if (!existingLead) return undefined;
    
    const updatedLead = { 
      ...existingLead, 
      ...leadData,
      updatedAt: new Date()
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    const existingLead = await this.getLead(id);
    if (!existingLead) return false;
    
    return this.leads.delete(id);
  }

  // Client methods
  async getClients(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId,
    );
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const now = new Date();
    const client: Client = { ...insertClient, id, createdAt: now };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const existingClient = await this.getClient(id);
    if (!existingClient) return undefined;
    
    const updatedClient = { ...existingClient, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Project methods
  async getProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId,
    );
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId,
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const now = new Date();
    const project: Project = { ...insertProject, id, createdAt: now };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const existingProject = await this.getProject(id);
    if (!existingProject) return undefined;
    
    const updatedProject = { ...existingProject, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Project room methods
  async addProjectRoom(projectId: number, roomData: {name: string, description?: string}): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const rooms = Array.isArray(project.rooms) ? project.rooms : [];
    const roomId = rooms.length > 0 ? Math.max(...rooms.map((r: any) => r.id)) + 1 : 1;
    
    const newRoom = {
      id: roomId,
      name: roomData.name,
      description: roomData.description || null,
      createdAt: new Date()
    };
    
    const updatedRooms = [...rooms, newRoom];
    
    const updatedProject = {
      ...project,
      rooms: updatedRooms,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
  
  async updateProjectRoom(projectId: number, roomId: number, roomData: any): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const rooms = Array.isArray(project.rooms) ? project.rooms : [];
    const roomIndex = rooms.findIndex((r: any) => r.id === roomId);
    
    if (roomIndex === -1) {
      throw new Error(`Room with ID ${roomId} not found in project ${projectId}`);
    }
    
    const updatedRooms = [...rooms];
    updatedRooms[roomIndex] = {
      ...updatedRooms[roomIndex],
      ...roomData,
      id: roomId
    };
    
    const updatedProject = {
      ...project,
      rooms: updatedRooms,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
  
  async deleteProjectRoom(projectId: number, roomId: number): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const rooms = Array.isArray(project.rooms) ? project.rooms : [];
    const updatedRooms = rooms.filter((r: any) => r.id !== roomId);
    
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const updatedTasks = tasks.filter((t: any) => t.roomId !== roomId);
    
    const updatedProject = {
      ...project,
      rooms: updatedRooms,
      tasks: updatedTasks,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
  
  // Project task methods
  async addProjectRoomTask(projectId: number, roomId: number | null, taskData: any): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    if (roomId !== null) {
      const rooms = Array.isArray(project.rooms) ? project.rooms : [];
      const roomExists = rooms.some((r: any) => r.id === roomId);
      
      if (!roomExists) {
        throw new Error(`Room with ID ${roomId} not found in project ${projectId}`);
      }
    }
    
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const taskId = tasks.length > 0 ? Math.max(...tasks.map((t: any) => t.id)) + 1 : 1;
    
    const newTask = {
      id: taskId,
      name: taskData.name,
      description: taskData.description || null,
      status: taskData.status || "not_started",
      roomId: roomId,
      dueDate: taskData.dueDate || null,
      assignedTo: taskData.assignedTo || null,
      createdAt: new Date()
    };
    
    const updatedTasks = [...tasks, newTask];
    
    let progress = 0;
    if (updatedTasks.length > 0) {
      const completedTasks = updatedTasks.filter((t: any) => t.status === "done").length;
      progress = Math.round((completedTasks / updatedTasks.length) * 100);
    }
    
    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      progress,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
  
  async updateProjectTask(projectId: number, taskId: number, taskData: any): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in project ${projectId}`);
    }
    
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      ...taskData,
      id: taskId
    };
    
    let progress = 0;
    if (updatedTasks.length > 0) {
      const completedTasks = updatedTasks.filter((t: any) => t.status === "done").length;
      progress = Math.round((completedTasks / updatedTasks.length) * 100);
    }
    
    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      progress,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
  
  async deleteProjectTask(projectId: number, taskId: number): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const updatedTasks = tasks.filter((t: any) => t.id !== taskId);
    
    let progress = 0;
    if (updatedTasks.length > 0) {
      const completedTasks = updatedTasks.filter((t: any) => t.status === "done").length;
      progress = Math.round((completedTasks / updatedTasks.length) * 100);
    }
    
    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      progress,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
  
  // Project log methods
  async addProjectLog(projectId: number, logData: any, userId: number): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const logs = Array.isArray(project.logs) ? project.logs : [];
    const logId = logs.length > 0 ? Math.max(...logs.map((l: any) => l.id)) + 1 : 1;
    
    const newLog = {
      id: logId,
      text: logData.text,
      roomId: logData.roomId || null,
      photoUrl: logData.photoUrl || null,
      photoCaption: logData.photoCaption || null,
      createdAt: new Date(),
      createdBy: { id: userId }
    };
    
    const updatedLogs = [newLog, ...logs];
    
    let updatedPhotos = project.photos || [];
    if (logData.photoUrl) {
      const photoId = updatedPhotos.length > 0 
        ? Math.max(...updatedPhotos.map((p: any) => p.id)) + 1 
        : 1;
        
      const newPhoto = {
        id: photoId,
        url: logData.photoUrl,
        caption: logData.photoCaption || null,
        roomId: logData.roomId || null,
        logId: logId,
        createdAt: new Date(),
        createdBy: { id: userId }
      };
      
      updatedPhotos = [newPhoto, ...updatedPhotos];
    }
    
    const updatedProject = {
      ...project,
      logs: updatedLogs,
      photos: updatedPhotos,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }
  
  // Project report methods
  async configureProjectReports(projectId: number, reportSettings: any): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const updatedProject = {
      ...project,
      reportSettings,
      lastReportDate: reportSettings.generateNow ? new Date() : project.lastReportDate,
      updatedAt: new Date()
    };
    
    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }

  // Proposal methods
  async getProposals(userId: number): Promise<Proposal[]> {
    // In Postgres storage, proposals have created_by field instead of userId
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.created_by === userId,
    );
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByProjectId(projectId: number): Promise<Proposal[]> {
    // In Postgres storage, proposals have lead_id field instead of projectId
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.lead_id === projectId,
    );
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const id = this.proposalId++;
    const now = new Date();
    const proposal: Proposal = { 
      ...insertProposal, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposal(id: number, proposalData: Partial<Proposal>): Promise<Proposal | undefined> {
    const existingProposal = await this.getProposal(id);
    if (!existingProposal) return undefined;
    
    const now = new Date();
    const updatedProposal = { 
      ...existingProposal, 
      ...proposalData,
      updatedAt: now 
    };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  async deleteProposal(id: number): Promise<boolean> {
    return this.proposals.delete(id);
  }

  // Moodboard methods
  async getMoodboards(): Promise<Moodboard[]> {
    return Array.from(this.moodboards.values());
  }

  async getMoodboard(id: number): Promise<Moodboard | undefined> {
    return this.moodboards.get(id);
  }

  async getMoodboardsByClientId(clientId: number): Promise<Moodboard[]> {
    return Array.from(this.moodboards.values()).filter(
      (moodboard) => moodboard.client_id === clientId,
    );
  }

  async getMoodboardTemplates(): Promise<Moodboard[]> {
    return Array.from(this.moodboards.values()).filter(
      (moodboard) => moodboard.isTemplate === true,
    );
  }

  async createMoodboard(insertMoodboard: InsertMoodboard): Promise<Moodboard> {
    try {
      const id = this.moodboardId++;
      const now = new Date();
      
      // Set default sections if not provided
      if (!insertMoodboard.sections) {
        insertMoodboard.sections = {
          colorPalette: { title: "Color Palette", items: [] },
          furniture: { title: "Furniture", items: [] },
          layout: { title: "Layout", items: [] },
          lighting: { title: "Lighting", items: [] },
          inspiration: { title: "Theme Inspiration", items: [] }
        };
      }
      
      const moodboard: Moodboard = { 
        ...insertMoodboard, 
        id, 
        createdAt: now,
        updatedAt: now 
      };
      
      this.moodboards.set(id, moodboard);
      return moodboard;
    } catch (error) {
      console.error("Error creating moodboard:", error);
      throw new Error(`Failed to create moodboard: ${error.message || String(error)}`);
    }
  }

  async updateMoodboard(id: number, moodboardData: Partial<Moodboard>): Promise<Moodboard | undefined> {
    try {
      const existingMoodboard = await this.getMoodboard(id);
      if (!existingMoodboard) return undefined;
      
      const updatedMoodboard = { 
        ...existingMoodboard, 
        ...moodboardData,
        updatedAt: new Date() 
      };
      
      this.moodboards.set(id, updatedMoodboard);
      return updatedMoodboard;
    } catch (error) {
      console.error("Error updating moodboard:", error);
      throw new Error(`Failed to update moodboard: ${error.message || String(error)}`);
    }
  }

  async deleteMoodboard(id: number): Promise<boolean> {
    try {
      return this.moodboards.delete(id);
    } catch (error) {
      console.error("Error deleting moodboard:", error);
      throw new Error(`Failed to delete moodboard: ${error.message || String(error)}`);
    }
  }
  
  async duplicateMoodboard(id: number): Promise<Moodboard | undefined> {
    try {
      const existingMoodboard = await this.getMoodboard(id);
      if (!existingMoodboard) return undefined;
      
      // Create a new moodboard based on the existing one
      const newMoodboard: InsertMoodboard = {
        client_id: existingMoodboard.client_id,
        name: `${existingMoodboard.name} (Copy)`,
        description: existingMoodboard.description,
        theme: existingMoodboard.theme,
        sections: existingMoodboard.sections,
        media: existingMoodboard.media,
        comments: existingMoodboard.comments,
        isTemplate: false
      };
      
      return this.createMoodboard(newMoodboard);
    } catch (error) {
      console.error("Error duplicating moodboard:", error);
      throw new Error(`Failed to duplicate moodboard: ${error.message || String(error)}`);
    }
  }

  // Estimate methods
  async getEstimates(userId: number): Promise<Estimate[]> {
    // Return all estimates since we don't have a user_id in the estimates schema
    // In a real app, we would add the user_id to the schema or filter by created_by
    return Array.from(this.estimates.values());
  }

  async getEstimate(id: number): Promise<Estimate | undefined> {
    return this.estimates.get(id);
  }

  async getEstimatesByProjectId(projectId: number): Promise<Estimate[]> {
    return Array.from(this.estimates.values()).filter(
      (estimate) => estimate.projectId === projectId,
    );
  }

  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const id = this.estimateId++;
    const now = new Date();
    const estimate: Estimate = { ...insertEstimate, id, createdAt: now };
    this.estimates.set(id, estimate);
    return estimate;
  }

  async updateEstimate(id: number, estimateData: Partial<Estimate>): Promise<Estimate | undefined> {
    const existingEstimate = await this.getEstimate(id);
    if (!existingEstimate) return undefined;
    
    const updatedEstimate = { ...existingEstimate, ...estimateData };
    this.estimates.set(id, updatedEstimate);
    return updatedEstimate;
  }

  async deleteEstimate(id: number): Promise<boolean> {
    return this.estimates.delete(id);
  }
  
  async getEstimatesByLeadId(leadId: number): Promise<Estimate[]> {
    return Array.from(this.estimates.values()).filter(
      (estimate) => estimate.lead_id === leadId,
    );
  }
  
  async getEstimatesByClientId(clientId: number): Promise<Estimate[]> {
    return Array.from(this.estimates.values()).filter(
      (estimate) => estimate.client_id === clientId,
    );
  }
  
  async getEstimateTemplates(): Promise<Estimate[]> {
    return Array.from(this.estimates.values()).filter(
      (estimate) => estimate.isTemplate === true,
    );
  }
  
  // EstimateConfig methods
  async getEstimateConfigs(): Promise<EstimateConfig[]> {
    return Array.from(this.estimateConfigs.values());
  }
  
  async getActiveEstimateConfigs(): Promise<EstimateConfig[]> {
    return Array.from(this.estimateConfigs.values()).filter(
      (config) => config.isActive === true,
    );
  }
  
  async getEstimateConfigsByType(configType: string): Promise<EstimateConfig[]> {
    return Array.from(this.estimateConfigs.values()).filter(
      (config) => config.configType === configType,
    );
  }
  
  async getEstimateConfig(id: number): Promise<EstimateConfig | undefined> {
    return this.estimateConfigs.get(id);
  }
  
  async getEstimateConfigByName(name: string): Promise<EstimateConfig | undefined> {
    return Array.from(this.estimateConfigs.values()).find(
      (config) => config.name === name
    );
  }
  
  async createEstimateConfig(insertConfig: InsertEstimateConfig): Promise<EstimateConfig> {
    const id = this.estimateConfigId++;
    const now = new Date();
    const config: EstimateConfig = { 
      ...insertConfig, 
      id, 
      createdAt: now,
      updatedAt: now,
      isActive: insertConfig.isActive ?? true
    };
    this.estimateConfigs.set(id, config);
    return config;
  }
  
  async updateEstimateConfig(id: number, configData: Partial<EstimateConfig>): Promise<EstimateConfig | undefined> {
    const existingConfig = await this.getEstimateConfig(id);
    if (!existingConfig) return undefined;
    
    const now = new Date();
    const updatedConfig = { 
      ...existingConfig, 
      ...configData,
      updatedAt: now 
    };
    this.estimateConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
  
  async deleteEstimateConfig(id: number): Promise<boolean> {
    return this.estimateConfigs.delete(id);
  }

  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId,
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProjectId(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.projectId === projectId,
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const now = new Date();
    const task: Task = { ...insertTask, id, createdAt: now };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const existingTask = await this.getTask(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Activity methods
  async getActivities(userId: number, limit?: number): Promise<Activity[]> {
    const userActivities = Array.from(this.activities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return 0;
      });
    
    if (limit) {
      return userActivities.slice(0, limit);
    }
    
    return userActivities;
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByClientId(clientId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.clientId === clientId)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return 0;
      });
  }

  async getActivitiesByProjectId(projectId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.projectId === projectId)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return 0;
      });
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }
  
  // WhatsApp message methods
  async getWhatsAppMessages(): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values())
      .sort((a, b) => {
        if (a.sentAt && b.sentAt) {
          return b.sentAt.getTime() - a.sentAt.getTime();
        }
        return 0;
      });
  }
  
  async getWhatsAppMessagesByLeadId(leadId: number): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values())
      .filter(message => message.leadId === leadId)
      .sort((a, b) => {
        if (a.sentAt && b.sentAt) {
          return b.sentAt.getTime() - a.sentAt.getTime();
        }
        return 0;
      });
  }
  
  async getWhatsAppMessagesByClientId(clientId: number): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values())
      .filter(message => message.clientId === clientId)
      .sort((a, b) => {
        if (a.sentAt && b.sentAt) {
          return b.sentAt.getTime() - a.sentAt.getTime();
        }
        return 0;
      });
  }
  
  async getWhatsAppMessageById(messageId: string): Promise<WhatsappMessage | undefined> {
    return this.whatsappMessages.get(messageId);
  }
  
  async getWhatsAppFailedMessages(maxRetries: number): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values())
      .filter(message => message.status === 'failed' && (message.retryCount || 0) < maxRetries)
      .sort((a, b) => {
        if (a.sentAt && b.sentAt) {
          return a.sentAt.getTime() - b.sentAt.getTime(); // Oldest first for retries
        }
        return 0;
      });
  }
  
  async createWhatsAppMessageLog(message: Omit<WhatsappMessage, 'createdAt' | 'updatedAt'>): Promise<WhatsappMessage> {
    const now = new Date();
    const whatsappMessage: WhatsappMessage = {
      ...message,
      createdAt: now,
      updatedAt: now
    };
    this.whatsappMessages.set(message.id, whatsappMessage);
    return whatsappMessage;
  }
  
  async updateWhatsAppMessageStatus(messageId: string, statusUpdate: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const existingMessage = this.whatsappMessages.get(messageId);
    if (!existingMessage) {
      return undefined;
    }
    
    const updatedMessage: WhatsappMessage = {
      ...existingMessage,
      ...statusUpdate,
      updatedAt: new Date()
    };
    
    this.whatsappMessages.set(messageId, updatedMessage);
    return updatedMessage;
  }
  
  async updateWhatsAppMessageRetryCount(messageId: string, retryCount: number): Promise<WhatsappMessage | undefined> {
    const existingMessage = this.whatsappMessages.get(messageId);
    if (!existingMessage) {
      return undefined;
    }
    
    const updatedMessage: WhatsappMessage = {
      ...existingMessage,
      retryCount,
      updatedAt: new Date()
    };
    
    this.whatsappMessages.set(messageId, updatedMessage);
    return updatedMessage;
  }
  
  // Company settings methods
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    return this.companySettings;
  }
  
  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings | undefined> {
    if (!this.companySettings) {
      return undefined;
    }
    
    this.companySettings = {
      ...this.companySettings,
      ...settings,
      updatedAt: new Date()
    };
    
    return this.companySettings;
  }
  
  // Template category methods
  async getTemplateCategories(type?: string): Promise<TemplateCategory[]> {
    const categories = [...this.templateCategories.values()];
    
    if (type) {
      return categories.filter(category => category.type === type);
    }
    
    return categories;
  }
  
  async getTemplateCategory(id: number): Promise<TemplateCategory | undefined> {
    return this.templateCategories.get(id);
  }
  
  async createTemplateCategory(category: InsertTemplateCategory): Promise<TemplateCategory> {
    const newCategory: TemplateCategory = {
      id: this.templateCategoryId++,
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.templateCategories.set(newCategory.id, newCategory);
    return newCategory;
  }
  
  async updateTemplateCategory(id: number, category: Partial<TemplateCategory>): Promise<TemplateCategory | undefined> {
    const existingCategory = this.templateCategories.get(id);
    
    if (!existingCategory) {
      return undefined;
    }
    
    const updatedCategory: TemplateCategory = {
      ...existingCategory,
      ...category,
      updatedAt: new Date()
    };
    
    this.templateCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteTemplateCategory(id: number): Promise<boolean> {
    return this.templateCategories.delete(id);
  }
  
  // Template methods
  async getTemplates(type?: string, categoryId?: number): Promise<Template[]> {
    const templates = [...this.templates.values()];
    
    if (type && categoryId) {
      return templates.filter(template => template.type === type && template.categoryId === categoryId);
    } else if (type) {
      return templates.filter(template => template.type === type);
    } else if (categoryId) {
      return templates.filter(template => template.categoryId === categoryId);
    }
    
    return templates;
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }
  
  async getDefaultTemplate(type: string): Promise<Template | undefined> {
    const templates = [...this.templates.values()];
    return templates.find(template => template.type === type && template.isDefault);
  }
  
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const newTemplate: Template = {
      id: this.templateId++,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }
  
  async updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined> {
    const existingTemplate = this.templates.get(id);
    
    if (!existingTemplate) {
      return undefined;
    }
    
    const updatedTemplate: Template = {
      ...existingTemplate,
      ...template,
      updatedAt: new Date()
    };
    
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }
  
  async setDefaultTemplate(id: number, type: string): Promise<boolean> {
    // First, unset any existing default templates for this type
    const templates = [...this.templates.values()];
    const defaultTemplates = templates.filter(template => template.type === type && template.isDefault);
    
    for (const defaultTemplate of defaultTemplates) {
      await this.updateTemplate(defaultTemplate.id, { isDefault: false });
    }
    
    // Then set the new default template
    const template = this.templates.get(id);
    if (!template || template.type !== type) {
      return false;
    }
    
    await this.updateTemplate(id, { isDefault: true });
    return true;
  }
  
  // Analytics methods
  async getAnalytics(metric?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    let analytics = [...this.analytics.values()];
    
    if (metric) {
      analytics = analytics.filter(entry => entry.metric === metric);
    }
    
    if (startDate) {
      analytics = analytics.filter(entry => entry.date >= startDate);
    }
    
    if (endDate) {
      analytics = analytics.filter(entry => entry.date <= endDate);
    }
    
    return analytics;
  }
  
  async createAnalyticsEntry(entry: InsertAnalytics): Promise<Analytics> {
    const newEntry: Analytics = {
      id: this.analyticsId++,
      ...entry,
      createdAt: new Date()
    };
    
    this.analytics.set(newEntry.id, newEntry);
    return newEntry;
  }
}

// Drizzle DB implementation
export class DrizzleStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!firebaseUid) return undefined;
    const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return result[0];
  }
  
  async getUserBySupabaseUid(supabaseUid: string): Promise<User | undefined> {
    if (!supabaseUid) return undefined;
    console.log("Looking up user by Supabase UID:", supabaseUid);
    try {
      const result = await db.select().from(users).where(eq(users.supabaseUid, supabaseUid));
      console.log("Supabase UID lookup result:", result);
      return result[0];
    } catch (error) {
      console.error("Error in getUserBySupabaseUid:", error);
      throw error;
    }
  }
  
  async getUserByField(field: string, value: string): Promise<User | undefined> {
    if (!field || !value) return undefined;
    
    // Convert camelCase field to snake_case for database query
    const snakeField = field.replace(/([A-Z])/g, "_$1").toLowerCase();
    
    // Using a raw SQL query with parameterized values for safe dynamic column access
    const result = await db.execute(
      drizzleSql`SELECT * FROM users WHERE ${drizzleSql.identifier(snakeField)} = ${value} LIMIT 1`
    );
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    console.log("Creating user with data in storage:", JSON.stringify({
      ...user,
      password: "[REDACTED]"
    }, null, 2));
    
    try {
      // Instead of using raw SQL, let's use the Drizzle ORM directly
      const newUser = await db
        .insert(users)
        .values({
          username: user.username,
          password: user.password,
          email: user.email,
          name: user.name || user.username,
          fullName: user.fullName || user.name || user.username,
          phone: user.phone || null,
          role: user.role || 'designer',
          activePlan: user.activePlan || 'free',
          firebaseUid: user.firebaseUid || null,
          supabaseUid: user.supabaseUid || null,
          company: user.company || null,
          avatar: user.avatar || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()
        .execute();
      
      if (newUser && newUser.length > 0) {
        console.log("User created successfully:", newUser[0].id);
        return newUser[0];
      } else {
        throw new Error("Failed to create user, no result returned");
      }
    } catch (error) {
      console.error("Database error in createUser:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    console.log("Updating user with data:", {
      ...userData,
      password: userData.password ? "[REDACTED]" : undefined
    });
    
    try {
      // First, check if the user exists
      const existingUser = await this.getUser(id);
      if (!existingUser) {
        console.error("User not found with ID:", id);
        return undefined;
      }
      
      // Prepare data for update with snake_case keys for the database
      const updateData: Record<string, any> = {
        ...userData,
        updated_at: new Date()
      };
      
      // Update the user in the database
      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      
      if (result && result.length > 0) {
        return result[0];
      } else {
        // Return the existing user if no database update occurred
        return existingUser;
      }
    } catch (error) {
      console.error("Error updating user:", error);
      // On database error, fall back to existing user data
      const existingUser = await this.getUser(id);
      return existingUser;
    }
  }
  
  // Lead methods
  async getLeads(userId: number): Promise<Lead[]> {
    const result = await db
      .select()
      .from(leads)
      .where(eq(leads.assignedTo, userId));
    
    return result;
  }
  
  async getLeadsByStage(stage: string): Promise<Lead[]> {
    const result = await db
      .select()
      .from(leads)
      .where(eq(leads.stage, stage));
    
    return result;
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    const result = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id));
    
    return result[0];
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await db
      .insert(leads)
      .values(lead)
      .returning();
    
    return result[0];
  }
  
  async updateLead(id: number, leadData: Partial<Lead>): Promise<Lead | undefined> {
    const result = await db
      .update(leads)
      .set({ ...leadData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteLead(id: number): Promise<boolean> {
    const result = await db
      .delete(leads)
      .where(eq(leads.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Client methods
  async getClients(userId: number): Promise<Client[]> {
    return db.select().from(clients);
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }
  
  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const result = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }
  
  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }
  
  // Project methods
  async getProjects(userId: number): Promise<Project[]> {
    return db.select().from(projects);
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }
  
  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.client_id, clientId));
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }
  
  // Project room methods
  async addProjectRoom(projectId: number, roomData: {name: string, description?: string}): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get current rooms array or initialize if not exists
      const currentRooms = Array.isArray(project.rooms) ? project.rooms : [];
      
      // Generate a new room ID
      const roomId = currentRooms.length > 0 
        ? Math.max(...currentRooms.map((r: any) => r.id)) + 1 
        : 1;
      
      // Create the new room object
      const newRoom = {
        id: roomId,
        name: roomData.name,
        description: roomData.description || null,
        createdAt: new Date(),
      };
      
      // Add to rooms array
      const updatedRooms = [...currentRooms, newRoom];
      
      // Update the project
      const result = await db
        .update(projects)
        .set({ 
          rooms: updatedRooms as any,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error adding room to project:", error);
      throw error;
    }
  }
  
  async updateProjectRoom(projectId: number, roomId: number, roomData: any): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get current rooms array
      const currentRooms = Array.isArray(project.rooms) ? project.rooms : [];
      
      // Find the room to update
      const roomIndex = currentRooms.findIndex((r: any) => r.id === roomId);
      
      if (roomIndex === -1) {
        throw new Error(`Room with ID ${roomId} not found in project ${projectId}`);
      }
      
      // Update the room
      const updatedRooms = [...currentRooms];
      updatedRooms[roomIndex] = {
        ...updatedRooms[roomIndex],
        ...roomData,
        id: roomId // Ensure ID doesn't change
      };
      
      // Update the project
      const result = await db
        .update(projects)
        .set({ 
          rooms: updatedRooms as any,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating room in project:", error);
      throw error;
    }
  }
  
  async deleteProjectRoom(projectId: number, roomId: number): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get current rooms array
      const currentRooms = Array.isArray(project.rooms) ? project.rooms : [];
      
      // Filter out the room to delete
      const updatedRooms = currentRooms.filter((r: any) => r.id !== roomId);
      
      // Also update tasks to remove those associated with this room
      const currentTasks = Array.isArray(project.tasks) ? project.tasks : [];
      const updatedTasks = currentTasks.filter((t: any) => t.roomId !== roomId);
      
      // Update the project
      const result = await db
        .update(projects)
        .set({ 
          rooms: updatedRooms as any,
          tasks: updatedTasks as any,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error deleting room from project:", error);
      throw error;
    }
  }
  
  // Project task methods
  async addProjectRoomTask(projectId: number, roomId: number | null, taskData: any): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // If roomId is provided, verify it exists in the project
      if (roomId !== null) {
        const rooms = Array.isArray(project.rooms) ? project.rooms : [];
        const roomExists = rooms.some((r: any) => r.id === roomId);
        
        if (!roomExists) {
          throw new Error(`Room with ID ${roomId} not found in project ${projectId}`);
        }
      }
      
      // Get current tasks array
      const currentTasks = Array.isArray(project.tasks) ? project.tasks : [];
      
      // Generate a new task ID
      const taskId = currentTasks.length > 0 
        ? Math.max(...currentTasks.map((t: any) => t.id)) + 1 
        : 1;
      
      // Create the new task object
      const newTask = {
        id: taskId,
        name: taskData.name,
        description: taskData.description || null,
        status: taskData.status || "not_started",
        roomId: roomId,
        dueDate: taskData.dueDate || null,
        assignedTo: taskData.assignedTo || null,
        createdAt: new Date(),
      };
      
      // Add to tasks array
      const updatedTasks = [...currentTasks, newTask];
      
      // Calculate progress based on task completion
      let progress = 0;
      if (updatedTasks.length > 0) {
        const completedTasks = updatedTasks.filter((t: any) => t.status === "done").length;
        progress = Math.round((completedTasks / updatedTasks.length) * 100);
      }
      
      // Update the project
      const result = await db
        .update(projects)
        .set({ 
          tasks: updatedTasks as any,
          progress,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error adding task to project:", error);
      throw error;
    }
  }
  
  async updateProjectTask(projectId: number, taskId: number, taskData: any): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get current tasks array
      const currentTasks = Array.isArray(project.tasks) ? project.tasks : [];
      
      // Find the task to update
      const taskIndex = currentTasks.findIndex((t: any) => t.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`Task with ID ${taskId} not found in project ${projectId}`);
      }
      
      // Update the task
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        ...taskData,
        id: taskId // Ensure ID doesn't change
      };
      
      // Calculate progress based on task completion
      let progress = 0;
      if (updatedTasks.length > 0) {
        const completedTasks = updatedTasks.filter((t: any) => t.status === "done").length;
        progress = Math.round((completedTasks / updatedTasks.length) * 100);
      }
      
      // Update the project
      const result = await db
        .update(projects)
        .set({ 
          tasks: updatedTasks as any,
          progress,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating task in project:", error);
      throw error;
    }
  }
  
  async deleteProjectTask(projectId: number, taskId: number): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get current tasks array
      const currentTasks = Array.isArray(project.tasks) ? project.tasks : [];
      
      // Filter out the task to delete
      const updatedTasks = currentTasks.filter((t: any) => t.id !== taskId);
      
      // Calculate progress based on task completion
      let progress = 0;
      if (updatedTasks.length > 0) {
        const completedTasks = updatedTasks.filter((t: any) => t.status === "done").length;
        progress = Math.round((completedTasks / updatedTasks.length) * 100);
      }
      
      // Update the project
      const result = await db
        .update(projects)
        .set({ 
          tasks: updatedTasks as any,
          progress,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error deleting task from project:", error);
      throw error;
    }
  }
  
  // Project log methods
  async addProjectLog(projectId: number, logData: any, userId: number): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get current logs array
      const currentLogs = Array.isArray(project.logs) ? project.logs : [];
      
      // Generate a new log ID
      const logId = currentLogs.length > 0 
        ? Math.max(...currentLogs.map((l: any) => l.id)) + 1 
        : 1;
      
      // Create the new log object
      const newLog = {
        id: logId,
        text: logData.text,
        roomId: logData.roomId || null,
        photoUrl: logData.photoUrl || null,
        photoCaption: logData.photoCaption || null,
        createdAt: new Date(),
        createdBy: { id: userId }
      };
      
      // Add to logs array
      const updatedLogs = [newLog, ...currentLogs];
      
      // If it has a photo, also add to photos array
      let updatedPhotos = project.photos || [];
      if (logData.photoUrl) {
        const photoId = updatedPhotos.length > 0 
          ? Math.max(...updatedPhotos.map((p: any) => p.id)) + 1 
          : 1;
          
        const newPhoto = {
          id: photoId,
          url: logData.photoUrl,
          caption: logData.photoCaption || null,
          roomId: logData.roomId || null,
          logId: logId,
          createdAt: new Date(),
          createdBy: { id: userId }
        };
        
        updatedPhotos = [newPhoto, ...updatedPhotos];
      }
      
      // Update the project
      const result = await db
        .update(projects)
        .set({ 
          logs: updatedLogs as any,
          photos: updatedPhotos as any,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error adding log to project:", error);
      throw error;
    }
  }
  
  // Project report methods
  async configureProjectReports(projectId: number, reportSettings: any): Promise<Project> {
    try {
      // First, get the current project
      const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));
      const project = projectResult[0];
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Update the project report settings
      const result = await db
        .update(projects)
        .set({ 
          reportSettings: reportSettings as any,
          lastReportDate: reportSettings.generateNow ? new Date() : project.lastReportDate,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error configuring project reports:", error);
      throw error;
    }
  }
  
  // Proposal methods
  async getProposals(userId: number): Promise<Proposal[]> {
    try {
      // Just return all proposals for now since we're having issues with the database
      // TODO: Once database issues are fixed, uncomment the line below to filter by userId
      // return db.select().from(proposals).where(eq(proposals.created_by, userId));
      return db.select().from(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return []; // Return empty array instead of letting the error propagate
    }
  }
  
  async getProposal(id: number): Promise<Proposal | undefined> {
    const result = await db.select().from(proposals).where(eq(proposals.id, id));
    return result[0];
  }
  
  async getProposalsByProjectId(projectId: number): Promise<Proposal[]> {
    const projectProposals = await db.select().from(proposals);
    // Filter by client_id that matches the project's client_id
    const project = await this.getProject(projectId);
    if (!project) return [];
    
    return projectProposals.filter(p => p.client_id === project.client_id);
  }
  
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const result = await db.insert(proposals).values(proposal).returning();
    return result[0];
  }
  
  async updateProposal(id: number, proposalData: Partial<Proposal>): Promise<Proposal | undefined> {
    const result = await db
      .update(proposals)
      .set(proposalData)
      .where(eq(proposals.id, id))
      .returning();
    return result[0];
  }
  
  async deleteProposal(id: number): Promise<boolean> {
    const result = await db.delete(proposals).where(eq(proposals.id, id)).returning();
    return result.length > 0;
  }
  
  // Moodboard methods
  async getMoodboards(): Promise<Moodboard[]> {
    return db.select().from(moodboards);
  }
  
  async getMoodboard(id: number): Promise<Moodboard | undefined> {
    const result = await db.select().from(moodboards).where(eq(moodboards.id, id));
    return result[0];
  }
  
  async getMoodboardsByClientId(clientId: number): Promise<Moodboard[]> {
    return db.select().from(moodboards).where(eq(moodboards.client_id, clientId));
  }
  
  async getMoodboardTemplates(): Promise<Moodboard[]> {
    return db.select().from(moodboards).where(eq(moodboards.isTemplate, true));
  }
  
  async duplicateMoodboard(id: number): Promise<Moodboard | undefined> {
    try {
      const existingMoodboard = await this.getMoodboard(id);
      if (!existingMoodboard) return undefined;
      
      // Create a new moodboard based on the existing one
      const newMoodboard: InsertMoodboard = {
        client_id: existingMoodboard.client_id,
        name: `${existingMoodboard.name} (Copy)`,
        description: existingMoodboard.description,
        theme: existingMoodboard.theme,
        sections: existingMoodboard.sections,
        media: existingMoodboard.media,
        comments: existingMoodboard.comments,
        sharedLink: existingMoodboard.sharedLink,
        pdfURL: existingMoodboard.pdfURL,
        isTemplate: false
      };
      
      return this.createMoodboard(newMoodboard);
    } catch (error) {
      console.error("Error duplicating moodboard:", error);
      throw new Error(`Failed to duplicate moodboard: ${String(error)}`);
    }
  }
  
  async createMoodboard(moodboard: InsertMoodboard): Promise<Moodboard> {
    // Set default sections if not provided
    if (!moodboard.sections) {
      moodboard.sections = {
        colorPalette: { title: "Color Palette", items: [] },
        furniture: { title: "Furniture", items: [] },
        layout: { title: "Layout", items: [] },
        lighting: { title: "Lighting", items: [] },
        inspiration: { title: "Theme Inspiration", items: [] }
      };
    }
    
    const result = await db.insert(moodboards).values(moodboard).returning();
    return result[0];
  }
  
  async updateMoodboard(id: number, moodboardData: Partial<Moodboard>): Promise<Moodboard | undefined> {
    const result = await db
      .update(moodboards)
      .set(moodboardData)
      .where(eq(moodboards.id, id))
      .returning();
    return result[0];
  }
  
  async deleteMoodboard(id: number): Promise<boolean> {
    const result = await db.delete(moodboards).where(eq(moodboards.id, id)).returning();
    return result.length > 0;
  }
  
  // Estimate methods
  async getEstimates(userId: number): Promise<Estimate[]> {
    try {
      // For now, return all estimates since we're not filtering by userId yet
      // In production, we would want to add this filter
      return await db.select().from(estimates);
    } catch (error) {
      console.error("Database error in getEstimates:", error);
      return []; // Return empty array on error instead of failing
    }
  }
  
  async getEstimate(id: number): Promise<Estimate | undefined> {
    try {
      const result = await db.select().from(estimates).where(eq(estimates.id, id));
      return result[0];
    } catch (error) {
      console.error(`Database error in getEstimate for id ${id}:`, error);
      return undefined;
    }
  }
  
  async getEstimatesByProjectId(projectId: number): Promise<Estimate[]> {
    const project = await this.getProject(projectId);
    if (!project) return [];
    
    return db.select().from(estimates).where(eq(estimates.client_id, project.client_id));
  }
  
  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const result = await db.insert(estimates).values(estimate).returning();
    return result[0];
  }
  
  async updateEstimate(id: number, estimateData: Partial<Estimate>): Promise<Estimate | undefined> {
    const result = await db
      .update(estimates)
      .set(estimateData)
      .where(eq(estimates.id, id))
      .returning();
    return result[0];
  }
  
  async deleteEstimate(id: number): Promise<boolean> {
    const result = await db.delete(estimates).where(eq(estimates.id, id)).returning();
    return result.length > 0;
  }
  
  async getEstimatesByLeadId(leadId: number): Promise<Estimate[]> {
    return db.select().from(estimates).where(eq(estimates.lead_id, leadId));
  }
  
  async getEstimatesByClientId(clientId: number): Promise<Estimate[]> {
    return db.select().from(estimates).where(eq(estimates.client_id, clientId));
  }
  
  async getEstimateTemplates(): Promise<Estimate[]> {
    return db.select().from(estimates).where(eq(estimates.isTemplate, true));
  }
  
  // EstimateConfig methods
  async getEstimateConfigs(): Promise<EstimateConfig[]> {
    return db.select().from(estimateConfigs);
  }
  
  async getActiveEstimateConfigs(): Promise<EstimateConfig[]> {
    return db.select().from(estimateConfigs).where(eq(estimateConfigs.isActive, true));
  }
  
  async getEstimateConfigsByType(configType: string): Promise<EstimateConfig[]> {
    return db.select().from(estimateConfigs).where(eq(estimateConfigs.configType, configType));
  }
  
  async getEstimateConfig(id: number): Promise<EstimateConfig | undefined> {
    const result = await db.select().from(estimateConfigs).where(eq(estimateConfigs.id, id));
    return result[0];
  }
  
  async getEstimateConfigByName(name: string): Promise<EstimateConfig | undefined> {
    const result = await db.select().from(estimateConfigs).where(eq(estimateConfigs.name, name));
    return result[0];
  }
  
  async createEstimateConfig(config: InsertEstimateConfig): Promise<EstimateConfig> {
    const result = await db.insert(estimateConfigs).values(config).returning();
    return result[0];
  }
  
  async updateEstimateConfig(id: number, configData: Partial<EstimateConfig>): Promise<EstimateConfig | undefined> {
    const result = await db
      .update(estimateConfigs)
      .set(configData)
      .where(eq(estimateConfigs.id, id))
      .returning();
    return result[0];
  }
  
  async deleteEstimateConfig(id: number): Promise<boolean> {
    const result = await db.delete(estimateConfigs).where(eq(estimateConfigs.id, id)).returning();
    return result.length > 0;
  }
  
  // Activity methods
  async getActivities(userId: number, limit?: number): Promise<Activity[]> {
    const query = db
      .select()
      .from(activities)
      .where(eq(activities.user_id, userId))
      .orderBy(desc(activities.createdAt));
    
    if (limit) {
      return query.limit(limit);
    }
    
    return query;
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    const result = await db.select().from(activities).where(eq(activities.id, id));
    return result[0];
  }
  
  async getActivitiesByClientId(clientId: number): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(eq(activities.client_id, clientId))
      .orderBy(desc(activities.createdAt));
  }
  
  async getActivitiesByProjectId(projectId: number): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(eq(activities.project_id, projectId))
      .orderBy(desc(activities.createdAt));
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(activity).returning();
    return result[0];
  }
  
  // WhatsApp message methods
  async getWhatsAppMessages(): Promise<WhatsappMessage[]> {
    return await db
      .select()
      .from(whatsappMessages)
      .orderBy(desc(whatsappMessages.sentAt));
  }
  
  async getWhatsAppMessagesByLeadId(leadId: number): Promise<WhatsappMessage[]> {
    return await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.leadId, leadId))
      .orderBy(desc(whatsappMessages.sentAt));
  }
  
  async getWhatsAppMessagesByClientId(clientId: number): Promise<WhatsappMessage[]> {
    return await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.clientId, clientId))
      .orderBy(desc(whatsappMessages.sentAt));
  }
  
  async getWhatsAppMessageById(messageId: string): Promise<WhatsappMessage | undefined> {
    const result = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.id, messageId));
    return result[0];
  }
  
  async getWhatsAppFailedMessages(maxRetries: number): Promise<WhatsappMessage[]> {
    return await db
      .select()
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.status, 'failed'),
          drizzleSql`${whatsappMessages.retryCount} < ${maxRetries}`
        )
      )
      .orderBy(whatsappMessages.sentAt);
  }
  
  async createWhatsAppMessageLog(message: Omit<WhatsappMessage, 'createdAt' | 'updatedAt'>): Promise<WhatsappMessage> {
    const result = await db
      .insert(whatsappMessages)
      .values(message)
      .returning();
    return result[0];
  }
  
  async updateWhatsAppMessageStatus(messageId: string, statusUpdate: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const result = await db
      .update(whatsappMessages)
      .set(statusUpdate)
      .where(eq(whatsappMessages.id, messageId))
      .returning();
    return result[0];
  }
  
  async updateWhatsAppMessageRetryCount(messageId: string, retryCount: number): Promise<WhatsappMessage | undefined> {
    const result = await db
      .update(whatsappMessages)
      .set({ retryCount })
      .where(eq(whatsappMessages.id, messageId))
      .returning();
    return result[0];
  }
  
  // Company settings methods
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const result = await db.select().from(companySettings).limit(1);
    return result[0];
  }
  
  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings | undefined> {
    const currentSettings = await this.getCompanySettings();
    
    if (!currentSettings) {
      // Create settings if they don't exist
      const result = await db.insert(companySettings).values({
        ...settings,
        name: settings.name || "My Company",
        enabledFeatures: settings.enabledFeatures || {
          crm: true,
          proposals: true,
          moodboards: true,
          estimates: true,
          whatsapp: true,
          tasks: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return result[0];
    }
    
    // Update existing settings
    const result = await db.update(companySettings)
      .set({
        ...settings,
        updatedAt: new Date()
      })
      .where(eq(companySettings.id, currentSettings.id))
      .returning();
    
    return result[0];
  }
  
  // Template category methods
  async getTemplateCategories(type?: string): Promise<TemplateCategory[]> {
    if (type) {
      return await db.select().from(templateCategories).where(eq(templateCategories.type, type));
    }
    
    return await db.select().from(templateCategories);
  }
  
  async getTemplateCategory(id: number): Promise<TemplateCategory | undefined> {
    const result = await db.select().from(templateCategories).where(eq(templateCategories.id, id));
    return result[0];
  }
  
  async createTemplateCategory(category: InsertTemplateCategory): Promise<TemplateCategory> {
    const result = await db.insert(templateCategories).values({
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateTemplateCategory(id: number, category: Partial<TemplateCategory>): Promise<TemplateCategory | undefined> {
    const result = await db.update(templateCategories)
      .set({
        ...category,
        updatedAt: new Date()
      })
      .where(eq(templateCategories.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteTemplateCategory(id: number): Promise<boolean> {
    const result = await db.delete(templateCategories).where(eq(templateCategories.id, id));
    return result.count > 0;
  }
  
  // Template methods
  async getTemplates(type?: string, categoryId?: number): Promise<Template[]> {
    if (type && categoryId) {
      return await db.select().from(templates)
        .where(and(
          eq(templates.type, type),
          eq(templates.categoryId, categoryId)
        ));
    } else if (type) {
      return await db.select().from(templates).where(eq(templates.type, type));
    } else if (categoryId) {
      return await db.select().from(templates).where(eq(templates.categoryId, categoryId));
    }
    
    return await db.select().from(templates);
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    const result = await db.select().from(templates).where(eq(templates.id, id));
    return result[0];
  }
  
  async getDefaultTemplate(type: string): Promise<Template | undefined> {
    const result = await db.select().from(templates)
      .where(and(
        eq(templates.type, type),
        eq(templates.isDefault, true)
      ));
    
    return result[0];
  }
  
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const result = await db.insert(templates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined> {
    const result = await db.update(templates)
      .set({
        ...template,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return result.count > 0;
  }
  
  async setDefaultTemplate(id: number, type: string): Promise<boolean> {
    try {
      // First, unset any existing default templates for this type
      await db.update(templates)
        .set({ isDefault: false })
        .where(and(
          eq(templates.type, type),
          eq(templates.isDefault, true)
        ));
      
      // Then set the new default template
      const result = await db.update(templates)
        .set({ isDefault: true })
        .where(and(
          eq(templates.id, id),
          eq(templates.type, type)
        ));
      
      return result.count > 0;
    } catch (error) {
      console.error("Error setting default template:", error);
      return false;
    }
  }
  
  // Analytics methods
  async getAnalytics(metric?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    let query = db.select().from(analytics);
    
    if (metric) {
      query = query.where(eq(analytics.metric, metric));
    }
    
    if (startDate) {
      query = query.where(gte(analytics.date, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(analytics.date, endDate));
    }
    
    return await query;
  }
  
  async createAnalyticsEntry(entry: InsertAnalytics): Promise<Analytics> {
    const result = await db.insert(analytics).values({
      ...entry,
      createdAt: new Date()
    }).returning();
    
    return result[0];
  }
}

// Choose which implementation to use
// export const storage = new MemStorage();
// This adapter class helps to bridge the casing differences between our API (camelCase)
// Helper functions to convert between camelCase and snake_case
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (match, group) => group.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Recursively convert object keys from camelCase to snake_case
function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result: any = {};
  Object.keys(obj).forEach(key => {
    // Skip undefined values
    if (obj[key] === undefined) return;
    
    // Convert the key to snake_case
    const snakeKey = toSnakeCase(key);
    
    // Recursively convert nested objects
    result[snakeKey] = typeof obj[key] === 'object' && obj[key] !== null 
      ? convertKeysToSnakeCase(obj[key]) 
      : obj[key];
  });
  
  return result;
}

// Recursively convert object keys from snake_case to camelCase
function convertKeysToCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result: any = {};
  Object.keys(obj).forEach(key => {
    // Convert the key to camelCase
    const camelKey = toCamelCase(key);
    
    // Recursively convert nested objects (including arrays)
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[camelKey] = Array.isArray(obj[key])
        ? obj[key].map((item: any) => 
            typeof item === 'object' && item !== null 
              ? convertKeysToCamelCase(item) 
              : item
          )
        : convertKeysToCamelCase(obj[key]);
    } else {
      result[camelKey] = obj[key];
    }
  });
  
  return result;
}

// Adapter to handle conversion between our API naming convention (camelCase)
// and our database schema (snake_case)
export class StorageAdapter implements IStorage {
  private drizzleStorage = new DrizzleStorage();
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await this.drizzleStorage.getUser(id);
    return user ? convertKeysToCamelCase(user) : undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.drizzleStorage.getUserByUsername(username);
    return user ? convertKeysToCamelCase(user) : undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.drizzleStorage.getUserByEmail(email);
    return user ? convertKeysToCamelCase(user) : undefined;
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const user = await this.drizzleStorage.getUserByFirebaseUid(firebaseUid);
    return user ? convertKeysToCamelCase(user) : undefined;
  }
  
  async getUserBySupabaseUid(supabaseUid: string): Promise<User | undefined> {
    const user = await this.drizzleStorage.getUserBySupabaseUid(supabaseUid);
    return user ? convertKeysToCamelCase(user) : undefined;
  }
  
  async getUserByField(field: string, value: string): Promise<User | undefined> {
    // Fallback to using direct search on users table
    const user = await this.drizzleStorage.getUserByEmail(value);
    return user ? convertKeysToCamelCase(user) : undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const snakeCaseUser = convertKeysToSnakeCase(user);
    const createdUser = await this.drizzleStorage.createUser(snakeCaseUser);
    return convertKeysToCamelCase(createdUser);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const snakeCaseUserData = convertKeysToSnakeCase(userData);
    const updatedUser = await this.drizzleStorage.updateUser(id, snakeCaseUserData);
    return updatedUser ? convertKeysToCamelCase(updatedUser) : undefined;
  }
  
  // Lead methods
  async getLeads(userId: number): Promise<Lead[]> {
    const leads = await this.drizzleStorage.getLeads(userId);
    return leads.map(lead => convertKeysToCamelCase(lead));
  }
  
  async getLeadsByStage(stage: string): Promise<Lead[]> {
    const leads = await this.drizzleStorage.getLeadsByStage(stage);
    return leads.map(lead => convertKeysToCamelCase(lead));
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    const lead = await this.drizzleStorage.getLead(id);
    return lead ? convertKeysToCamelCase(lead) : undefined;
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    const snakeCaseLead = convertKeysToSnakeCase(lead);
    const createdLead = await this.drizzleStorage.createLead(snakeCaseLead);
    return convertKeysToCamelCase(createdLead);
  }
  
  async updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined> {
    const snakeCaseLead = convertKeysToSnakeCase(lead);
    const updatedLead = await this.drizzleStorage.updateLead(id, snakeCaseLead);
    return updatedLead ? convertKeysToCamelCase(updatedLead) : undefined;
  }
  
  async deleteLead(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteLead(id);
  }
  
  // Client methods
  async getClients(userId: number): Promise<Client[]> {
    const clients = await this.drizzleStorage.getClients(userId);
    return clients.map(client => convertKeysToCamelCase(client));
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    const client = await this.drizzleStorage.getClient(id);
    return client ? convertKeysToCamelCase(client) : undefined;
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const snakeCaseClient = convertKeysToSnakeCase(client);
    const createdClient = await this.drizzleStorage.createClient(snakeCaseClient);
    return convertKeysToCamelCase(createdClient);
  }
  
  async updateClient(id: number, client: Partial<Client>): Promise<Client | undefined> {
    const snakeCaseClient = convertKeysToSnakeCase(client);
    const updatedClient = await this.drizzleStorage.updateClient(id, snakeCaseClient);
    return updatedClient ? convertKeysToCamelCase(updatedClient) : undefined;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteClient(id);
  }
  
  // Project methods
  async getProjects(userId: number): Promise<Project[]> {
    const projects = await this.drizzleStorage.getProjects(userId);
    return projects.map(project => convertKeysToCamelCase(project));
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const project = await this.drizzleStorage.getProject(id);
    return project ? convertKeysToCamelCase(project) : undefined;
  }
  
  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    const projects = await this.drizzleStorage.getProjectsByClientId(clientId);
    return projects.map(project => convertKeysToCamelCase(project));
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const snakeCaseProject = convertKeysToSnakeCase(project);
    const createdProject = await this.drizzleStorage.createProject(snakeCaseProject);
    return convertKeysToCamelCase(createdProject);
  }
  
  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const snakeCaseProject = convertKeysToSnakeCase(project);
    const updatedProject = await this.drizzleStorage.updateProject(id, snakeCaseProject);
    return updatedProject ? convertKeysToCamelCase(updatedProject) : undefined;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteProject(id);
  }
  
  // Project room methods
  async addProjectRoom(projectId: number, roomData: {name: string, description?: string}): Promise<Project> {
    const result = await this.drizzleStorage.addProjectRoom(projectId, roomData);
    return convertKeysToCamelCase(result);
  }
  
  async updateProjectRoom(projectId: number, roomId: number, roomData: any): Promise<Project> {
    const result = await this.drizzleStorage.updateProjectRoom(projectId, roomId, roomData);
    return convertKeysToCamelCase(result);
  }
  
  async deleteProjectRoom(projectId: number, roomId: number): Promise<Project> {
    const result = await this.drizzleStorage.deleteProjectRoom(projectId, roomId);
    return convertKeysToCamelCase(result);
  }
  
  // Project task methods
  async addProjectRoomTask(projectId: number, roomId: number | null, taskData: any): Promise<Project> {
    const result = await this.drizzleStorage.addProjectRoomTask(projectId, roomId, taskData);
    return convertKeysToCamelCase(result);
  }
  
  async updateProjectTask(projectId: number, taskId: number, taskData: any): Promise<Project> {
    const result = await this.drizzleStorage.updateProjectTask(projectId, taskId, taskData);
    return convertKeysToCamelCase(result);
  }
  
  async deleteProjectTask(projectId: number, taskId: number): Promise<Project> {
    const result = await this.drizzleStorage.deleteProjectTask(projectId, taskId);
    return convertKeysToCamelCase(result);
  }
  
  // Project log methods
  async addProjectLog(projectId: number, logData: any, userId: number): Promise<Project> {
    const result = await this.drizzleStorage.addProjectLog(projectId, logData, userId);
    return convertKeysToCamelCase(result);
  }
  
  // Project report methods
  async configureProjectReports(projectId: number, reportSettings: any): Promise<Project> {
    const result = await this.drizzleStorage.configureProjectReports(projectId, reportSettings);
    return convertKeysToCamelCase(result);
  }
  
  // Proposal methods
  async getProposals(userId: number): Promise<Proposal[]> {
    const proposals = await this.drizzleStorage.getProposals(userId);
    return proposals.map(proposal => convertKeysToCamelCase(proposal));
  }
  
  async getProposal(id: number): Promise<Proposal | undefined> {
    const proposal = await this.drizzleStorage.getProposal(id);
    return proposal ? convertKeysToCamelCase(proposal) : undefined;
  }
  
  async getProposalsByProjectId(projectId: number): Promise<Proposal[]> {
    const proposals = await this.drizzleStorage.getProposalsByProjectId(projectId);
    return proposals.map(proposal => convertKeysToCamelCase(proposal));
  }
  
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const snakeCaseProposal = convertKeysToSnakeCase(proposal);
    const createdProposal = await this.drizzleStorage.createProposal(snakeCaseProposal);
    return convertKeysToCamelCase(createdProposal);
  }
  
  async updateProposal(id: number, proposal: Partial<Proposal>): Promise<Proposal | undefined> {
    const snakeCaseProposal = convertKeysToSnakeCase(proposal);
    const updatedProposal = await this.drizzleStorage.updateProposal(id, snakeCaseProposal);
    return updatedProposal ? convertKeysToCamelCase(updatedProposal) : undefined;
  }
  
  async deleteProposal(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteProposal(id);
  }
  
  // Moodboard methods
  async getMoodboards(): Promise<Moodboard[]> {
    const moodboards = await this.drizzleStorage.getMoodboards();
    return moodboards.map(moodboard => convertKeysToCamelCase(moodboard));
  }
  
  async getMoodboard(id: number): Promise<Moodboard | undefined> {
    const moodboard = await this.drizzleStorage.getMoodboard(id);
    return moodboard ? convertKeysToCamelCase(moodboard) : undefined;
  }
  
  async getMoodboardsByClientId(clientId: number): Promise<Moodboard[]> {
    const moodboards = await this.drizzleStorage.getMoodboardsByClientId(clientId);
    return moodboards.map(moodboard => convertKeysToCamelCase(moodboard));
  }
  
  async getMoodboardTemplates(): Promise<Moodboard[]> {
    const templates = await this.drizzleStorage.getMoodboardTemplates();
    return templates.map(template => convertKeysToCamelCase(template));
  }
  
  async duplicateMoodboard(id: number): Promise<Moodboard | undefined> {
    const duplicatedMoodboard = await this.drizzleStorage.duplicateMoodboard(id);
    return duplicatedMoodboard ? convertKeysToCamelCase(duplicatedMoodboard) : undefined;
  }
  
  async createMoodboard(moodboard: InsertMoodboard): Promise<Moodboard> {
    const snakeCaseMoodboard = convertKeysToSnakeCase(moodboard);
    const createdMoodboard = await this.drizzleStorage.createMoodboard(snakeCaseMoodboard);
    return convertKeysToCamelCase(createdMoodboard);
  }
  
  async updateMoodboard(id: number, moodboard: Partial<Moodboard>): Promise<Moodboard | undefined> {
    const snakeCaseMoodboard = convertKeysToSnakeCase(moodboard);
    const updatedMoodboard = await this.drizzleStorage.updateMoodboard(id, snakeCaseMoodboard);
    return updatedMoodboard ? convertKeysToCamelCase(updatedMoodboard) : undefined;
  }
  
  async deleteMoodboard(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteMoodboard(id);
  }
  
  // Estimate methods
  async getEstimates(userId: number): Promise<Estimate[]> {
    const estimates = await this.drizzleStorage.getEstimates(userId);
    return estimates.map(estimate => convertKeysToCamelCase(estimate));
  }
  
  async getEstimate(id: number): Promise<Estimate | undefined> {
    const estimate = await this.drizzleStorage.getEstimate(id);
    return estimate ? convertKeysToCamelCase(estimate) : undefined;
  }
  
  async getEstimatesByProjectId(projectId: number): Promise<Estimate[]> {
    const estimates = await this.drizzleStorage.getEstimatesByProjectId(projectId);
    return estimates.map(estimate => convertKeysToCamelCase(estimate));
  }
  
  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const snakeCaseEstimate = convertKeysToSnakeCase(estimate);
    const createdEstimate = await this.drizzleStorage.createEstimate(snakeCaseEstimate);
    return convertKeysToCamelCase(createdEstimate);
  }
  
  async updateEstimate(id: number, estimate: Partial<Estimate>): Promise<Estimate | undefined> {
    const snakeCaseEstimate = convertKeysToSnakeCase(estimate);
    const updatedEstimate = await this.drizzleStorage.updateEstimate(id, snakeCaseEstimate);
    return updatedEstimate ? convertKeysToCamelCase(updatedEstimate) : undefined;
  }
  
  async deleteEstimate(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteEstimate(id);
  }
  
  // Activity methods
  async getActivities(userId: number, limit?: number): Promise<Activity[]> {
    const activities = await this.drizzleStorage.getActivities(userId, limit);
    return activities.map(activity => convertKeysToCamelCase(activity));
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    const activity = await this.drizzleStorage.getActivity(id);
    return activity ? convertKeysToCamelCase(activity) : undefined;
  }
  
  async getActivitiesByClientId(clientId: number): Promise<Activity[]> {
    const activities = await this.drizzleStorage.getActivitiesByClientId(clientId);
    return activities.map(activity => convertKeysToCamelCase(activity));
  }
  
  async getActivitiesByProjectId(projectId: number): Promise<Activity[]> {
    const activities = await this.drizzleStorage.getActivitiesByProjectId(projectId);
    return activities.map(activity => convertKeysToCamelCase(activity));
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const snakeCaseActivity = convertKeysToSnakeCase(activity);
    const createdActivity = await this.drizzleStorage.createActivity(snakeCaseActivity);
    return convertKeysToCamelCase(createdActivity);
  }
  
  // WhatsApp message methods
  async getWhatsAppMessages(): Promise<WhatsappMessage[]> {
    const messages = await this.drizzleStorage.getWhatsAppMessages();
    return messages.map(message => convertKeysToCamelCase(message));
  }
  
  async getWhatsAppMessagesByLeadId(leadId: number): Promise<WhatsappMessage[]> {
    const messages = await this.drizzleStorage.getWhatsAppMessagesByLeadId(leadId);
    return messages.map(message => convertKeysToCamelCase(message));
  }
  
  async getWhatsAppMessagesByClientId(clientId: number): Promise<WhatsappMessage[]> {
    const messages = await this.drizzleStorage.getWhatsAppMessagesByClientId(clientId);
    return messages.map(message => convertKeysToCamelCase(message));
  }
  
  async getWhatsAppMessageById(messageId: string): Promise<WhatsappMessage | undefined> {
    const message = await this.drizzleStorage.getWhatsAppMessageById(messageId);
    return message ? convertKeysToCamelCase(message) : undefined;
  }
  
  async getWhatsAppFailedMessages(maxRetries: number): Promise<WhatsappMessage[]> {
    const messages = await this.drizzleStorage.getWhatsAppFailedMessages(maxRetries);
    return messages.map(message => convertKeysToCamelCase(message));
  }
  
  async createWhatsAppMessageLog(message: Omit<WhatsappMessage, 'createdAt' | 'updatedAt'>): Promise<WhatsappMessage> {
    const snakeCaseMessage = convertKeysToSnakeCase(message);
    const createdMessage = await this.drizzleStorage.createWhatsAppMessageLog(snakeCaseMessage);
    return convertKeysToCamelCase(createdMessage);
  }
  
  async updateWhatsAppMessageStatus(messageId: string, statusUpdate: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const snakeCaseUpdate = convertKeysToSnakeCase(statusUpdate);
    const updatedMessage = await this.drizzleStorage.updateWhatsAppMessageStatus(messageId, snakeCaseUpdate);
    return updatedMessage ? convertKeysToCamelCase(updatedMessage) : undefined;
  }
  
  async updateWhatsAppMessageRetryCount(messageId: string, retryCount: number): Promise<WhatsappMessage | undefined> {
    const updatedMessage = await this.drizzleStorage.updateWhatsAppMessageRetryCount(messageId, retryCount);
    return updatedMessage ? convertKeysToCamelCase(updatedMessage) : undefined;
  }
  
  // Company settings methods
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const settings = await this.drizzleStorage.getCompanySettings();
    return settings ? convertKeysToCamelCase(settings) : undefined;
  }
  
  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings | undefined> {
    const snakeCaseSettings = convertKeysToSnakeCase(settings);
    const updatedSettings = await this.drizzleStorage.updateCompanySettings(snakeCaseSettings);
    return updatedSettings ? convertKeysToCamelCase(updatedSettings) : undefined;
  }
  
  // Template category methods
  async getTemplateCategories(type?: string): Promise<TemplateCategory[]> {
    const categories = await this.drizzleStorage.getTemplateCategories(type);
    return categories.map(category => convertKeysToCamelCase(category));
  }
  
  async getTemplateCategory(id: number): Promise<TemplateCategory | undefined> {
    const category = await this.drizzleStorage.getTemplateCategory(id);
    return category ? convertKeysToCamelCase(category) : undefined;
  }
  
  async createTemplateCategory(category: InsertTemplateCategory): Promise<TemplateCategory> {
    const snakeCaseCategory = convertKeysToSnakeCase(category);
    const createdCategory = await this.drizzleStorage.createTemplateCategory(snakeCaseCategory);
    return convertKeysToCamelCase(createdCategory);
  }
  
  async updateTemplateCategory(id: number, category: Partial<TemplateCategory>): Promise<TemplateCategory | undefined> {
    const snakeCaseCategory = convertKeysToSnakeCase(category);
    const updatedCategory = await this.drizzleStorage.updateTemplateCategory(id, snakeCaseCategory);
    return updatedCategory ? convertKeysToCamelCase(updatedCategory) : undefined;
  }
  
  async deleteTemplateCategory(id: number): Promise<boolean> {
    return await this.drizzleStorage.deleteTemplateCategory(id);
  }
  
  // Template methods
  async getTemplates(type?: string, categoryId?: number): Promise<Template[]> {
    const templates = await this.drizzleStorage.getTemplates(type, categoryId);
    return templates.map(template => convertKeysToCamelCase(template));
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    const template = await this.drizzleStorage.getTemplate(id);
    return template ? convertKeysToCamelCase(template) : undefined;
  }
  
  async getDefaultTemplate(type: string): Promise<Template | undefined> {
    const template = await this.drizzleStorage.getDefaultTemplate(type);
    return template ? convertKeysToCamelCase(template) : undefined;
  }
  
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const snakeCaseTemplate = convertKeysToSnakeCase(template);
    const createdTemplate = await this.drizzleStorage.createTemplate(snakeCaseTemplate);
    return convertKeysToCamelCase(createdTemplate);
  }
  
  async updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined> {
    const snakeCaseTemplate = convertKeysToSnakeCase(template);
    const updatedTemplate = await this.drizzleStorage.updateTemplate(id, snakeCaseTemplate);
    return updatedTemplate ? convertKeysToCamelCase(updatedTemplate) : undefined;
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    return await this.drizzleStorage.deleteTemplate(id);
  }
  
  async setDefaultTemplate(id: number, type: string): Promise<boolean> {
    return await this.drizzleStorage.setDefaultTemplate(id, type);
  }
  
  // Analytics methods
  async getAnalytics(metric?: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    const analyticsData = await this.drizzleStorage.getAnalytics(metric, startDate, endDate);
    return analyticsData.map(entry => convertKeysToCamelCase(entry));
  }
  
  async createAnalyticsEntry(entry: InsertAnalytics): Promise<Analytics> {
    const snakeCaseEntry = convertKeysToSnakeCase(entry);
    const createdEntry = await this.drizzleStorage.createAnalyticsEntry(snakeCaseEntry);
    return convertKeysToCamelCase(createdEntry);
  }
}

export const storage = new StorageAdapter();
