import { 
  users, User, InsertUser, 
  clients, Client, InsertClient,
  leads, Lead, InsertLead,
  projects, Project, InsertProject,
  proposals, Proposal, InsertProposal,
  moodboards, Moodboard, InsertMoodboard,
  estimates, Estimate, InsertEstimate,
  estimateConfigs, EstimateConfig, InsertEstimateConfig,
  activities, Activity, InsertActivity
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
  
  // Proposal methods
  getProposals(userId: number): Promise<Proposal[]>;
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposalsByProjectId(projectId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, proposal: Partial<Proposal>): Promise<Proposal | undefined>;
  deleteProposal(id: number): Promise<boolean>;
  
  // Moodboard methods
  getMoodboards(userId: number): Promise<Moodboard[]>;
  getMoodboard(id: number): Promise<Moodboard | undefined>;
  getMoodboardsByProjectId(projectId: number): Promise<Moodboard[]>;
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
  
  private userId: number;
  private leadId: number;
  private clientId: number;
  private projectId: number;
  private proposalId: number;
  private moodboardId: number;
  private estimateId: number;
  private taskId: number;
  private activityId: number;

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
    
    this.userId = 1;
    this.leadId = 1;
    this.clientId = 1;
    this.projectId = 1;
    this.proposalId = 1;
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
  async getMoodboards(userId: number): Promise<Moodboard[]> {
    return Array.from(this.moodboards.values()).filter(
      (moodboard) => moodboard.userId === userId,
    );
  }

  async getMoodboard(id: number): Promise<Moodboard | undefined> {
    return this.moodboards.get(id);
  }

  async getMoodboardsByProjectId(projectId: number): Promise<Moodboard[]> {
    return Array.from(this.moodboards.values()).filter(
      (moodboard) => moodboard.projectId === projectId,
    );
  }

  async createMoodboard(insertMoodboard: InsertMoodboard): Promise<Moodboard> {
    const id = this.moodboardId++;
    const now = new Date();
    const moodboard: Moodboard = { ...insertMoodboard, id, createdAt: now };
    this.moodboards.set(id, moodboard);
    return moodboard;
  }

  async updateMoodboard(id: number, moodboardData: Partial<Moodboard>): Promise<Moodboard | undefined> {
    const existingMoodboard = await this.getMoodboard(id);
    if (!existingMoodboard) return undefined;
    
    const updatedMoodboard = { ...existingMoodboard, ...moodboardData };
    this.moodboards.set(id, updatedMoodboard);
    return updatedMoodboard;
  }

  async deleteMoodboard(id: number): Promise<boolean> {
    return this.moodboards.delete(id);
  }

  // Estimate methods
  async getEstimates(userId: number): Promise<Estimate[]> {
    return Array.from(this.estimates.values()).filter(
      (estimate) => estimate.userId === userId,
    );
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
      // Create a new object with snake_case keys
      const dataToUpdate: Record<string, any> = {};
      
      // Map the camelCase properties to snake_case for the database
      if (userData.username) dataToUpdate.username = userData.username;
      if (userData.password) dataToUpdate.password = userData.password;
      if (userData.email) dataToUpdate.email = userData.email;
      if (userData.fullName) dataToUpdate.full_name = userData.fullName;
      if (userData.name) dataToUpdate.name = userData.name;
      if (userData.phone) dataToUpdate.phone = userData.phone;
      if (userData.role) dataToUpdate.role = userData.role;
      if (userData.activePlan) dataToUpdate.active_plan = userData.activePlan;
      if (userData.firebaseUid) dataToUpdate.firebase_uid = userData.firebaseUid;
      if (userData.supabaseUid) dataToUpdate.supabase_uid = userData.supabaseUid;
      if (userData.company) dataToUpdate.company = userData.company;
      if (userData.avatar) dataToUpdate.avatar = userData.avatar;
      
      dataToUpdate.updated_at = new Date();
    
      const result = await db
        .update(users)
        .set(dataToUpdate)
        .where(eq(users.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
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
  async getMoodboards(userId: number): Promise<Moodboard[]> {
    return db.select().from(moodboards);
  }
  
  async getMoodboard(id: number): Promise<Moodboard | undefined> {
    const result = await db.select().from(moodboards).where(eq(moodboards.id, id));
    return result[0];
  }
  
  async getMoodboardsByProjectId(projectId: number): Promise<Moodboard[]> {
    const project = await this.getProject(projectId);
    if (!project) return [];
    
    return db.select().from(moodboards).where(eq(moodboards.client_id, project.client_id));
  }
  
  async createMoodboard(moodboard: InsertMoodboard): Promise<Moodboard> {
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
    return db.select().from(estimates);
  }
  
  async getEstimate(id: number): Promise<Estimate | undefined> {
    const result = await db.select().from(estimates).where(eq(estimates.id, id));
    return result[0];
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
  async getMoodboards(userId: number): Promise<Moodboard[]> {
    const moodboards = await this.drizzleStorage.getMoodboards(userId);
    return moodboards.map(moodboard => convertKeysToCamelCase(moodboard));
  }
  
  async getMoodboard(id: number): Promise<Moodboard | undefined> {
    const moodboard = await this.drizzleStorage.getMoodboard(id);
    return moodboard ? convertKeysToCamelCase(moodboard) : undefined;
  }
  
  async getMoodboardsByProjectId(projectId: number): Promise<Moodboard[]> {
    const moodboards = await this.drizzleStorage.getMoodboardsByProjectId(projectId);
    return moodboards.map(moodboard => convertKeysToCamelCase(moodboard));
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
}

export const storage = new StorageAdapter();
