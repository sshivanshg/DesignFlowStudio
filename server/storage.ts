import { 
  users, User, InsertUser, 
  clients, Client, InsertClient,
  projects, Project, InsertProject,
  proposals, Proposal, InsertProposal,
  moodboards, Moodboard, InsertMoodboard,
  estimates, Estimate, InsertEstimate,
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
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
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
  
  // Estimate methods
  getEstimates(userId: number): Promise<Estimate[]>;
  getEstimate(id: number): Promise<Estimate | undefined>;
  getEstimatesByProjectId(projectId: number): Promise<Estimate[]>;
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
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private proposals: Map<number, Proposal>;
  private moodboards: Map<number, Moodboard>;
  private estimates: Map<number, Estimate>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  
  private userId: number;
  private clientId: number;
  private projectId: number;
  private proposalId: number;
  private moodboardId: number;
  private estimateId: number;
  private taskId: number;
  private activityId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.proposals = new Map();
    this.moodboards = new Map();
    this.estimates = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    
    this.userId = 1;
    this.clientId = 1;
    this.projectId = 1;
    this.proposalId = 1;
    this.moodboardId = 1;
    this.estimateId = 1;
    this.taskId = 1;
    this.activityId = 1;
    
    // Add a default user for testing
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      fullName: "Sophia Martinez",
      role: "admin",
      company: "InteriDesign Studio"
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
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
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.userId === userId,
    );
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByProjectId(projectId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.projectId === projectId,
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
    const result = await db.select().from(users).where(eq(users.firebase_uid, firebaseUid));
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
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
    return db.select().from(proposals);
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
// and our database schema (snake_case)
export class StorageAdapter implements IStorage {
  private drizzleStorage = new DrizzleStorage();
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.drizzleStorage.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.drizzleStorage.getUserByUsername(username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.drizzleStorage.getUserByEmail(email);
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return this.drizzleStorage.getUserByFirebaseUid(firebaseUid);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    // Convert camelCase to snake_case for the database
    const dbUser = {
      ...user,
      firebase_uid: user.firebaseUid,
      full_name: user.fullName,
      active_plan: user.activePlan
    };
    
    return this.drizzleStorage.createUser(dbUser as any);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const dbUserData: any = { ...userData };
    
    // Convert camelCase to snake_case fields
    if (userData.firebaseUid) dbUserData.firebase_uid = userData.firebaseUid;
    if (userData.fullName) dbUserData.full_name = userData.fullName;
    if (userData.activePlan) dbUserData.active_plan = userData.activePlan;
    
    return this.drizzleStorage.updateUser(id, dbUserData);
  }
  
  // Client methods
  async getClients(userId: number): Promise<Client[]> {
    return this.drizzleStorage.getClients(userId);
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    return this.drizzleStorage.getClient(id);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const dbClient: any = { ...client };
    
    // Convert camelCase to snake_case fields
    if (client.portalAccess) dbClient.portal_access = client.portalAccess;
    if (client.lastLogin) dbClient.last_login = client.lastLogin;
    if (client.projectId) dbClient.project_id = client.projectId;
    
    return this.drizzleStorage.createClient(dbClient);
  }
  
  async updateClient(id: number, client: Partial<Client>): Promise<Client | undefined> {
    const dbClient: any = { ...client };
    
    // Convert camelCase to snake_case fields
    if (client.portalAccess) dbClient.portal_access = client.portalAccess;
    if (client.lastLogin) dbClient.last_login = client.lastLogin;
    if (client.projectId) dbClient.project_id = client.projectId;
    
    return this.drizzleStorage.updateClient(id, dbClient);
  }
  
  async deleteClient(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteClient(id);
  }
  
  // Project methods
  async getProjects(userId: number): Promise<Project[]> {
    return this.drizzleStorage.getProjects(userId);
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.drizzleStorage.getProject(id);
  }
  
  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return this.drizzleStorage.getProjectsByClientId(clientId);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const dbProject: any = { ...project };
    
    // Convert camelCase to snake_case fields
    if (project.clientId) dbProject.client_id = project.clientId;
    if (project.startDate) dbProject.start_date = project.startDate;
    if (project.endDate) dbProject.end_date = project.endDate;
    
    return this.drizzleStorage.createProject(dbProject);
  }
  
  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const dbProject: any = { ...project };
    
    // Convert camelCase to snake_case fields
    if (project.clientId) dbProject.client_id = project.clientId;
    if (project.startDate) dbProject.start_date = project.startDate;
    if (project.endDate) dbProject.end_date = project.endDate;
    
    return this.drizzleStorage.updateProject(id, dbProject);
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteProject(id);
  }
  
  // Proposal methods
  async getProposals(userId: number): Promise<Proposal[]> {
    return this.drizzleStorage.getProposals(userId);
  }
  
  async getProposal(id: number): Promise<Proposal | undefined> {
    return this.drizzleStorage.getProposal(id);
  }
  
  async getProposalsByProjectId(projectId: number): Promise<Proposal[]> {
    return this.drizzleStorage.getProposalsByProjectId(projectId);
  }
  
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const dbProposal: any = { ...proposal };
    
    // Convert camelCase to snake_case fields
    if (proposal.clientId) dbProposal.client_id = proposal.clientId;
    if (proposal.createdBy) dbProposal.created_by = proposal.createdBy;
    if (proposal.dataJSON) dbProposal.data_json = proposal.dataJSON;
    if (proposal.pdfURL) dbProposal.pdf_url = proposal.pdfURL;
    
    return this.drizzleStorage.createProposal(dbProposal);
  }
  
  async updateProposal(id: number, proposal: Partial<Proposal>): Promise<Proposal | undefined> {
    const dbProposal: any = { ...proposal };
    
    // Convert camelCase to snake_case fields
    if (proposal.clientId) dbProposal.client_id = proposal.clientId;
    if (proposal.createdBy) dbProposal.created_by = proposal.createdBy;
    if (proposal.dataJSON) dbProposal.data_json = proposal.dataJSON;
    if (proposal.pdfURL) dbProposal.pdf_url = proposal.pdfURL;
    
    return this.drizzleStorage.updateProposal(id, dbProposal);
  }
  
  async deleteProposal(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteProposal(id);
  }
  
  // Moodboard methods
  async getMoodboards(userId: number): Promise<Moodboard[]> {
    return this.drizzleStorage.getMoodboards(userId);
  }
  
  async getMoodboard(id: number): Promise<Moodboard | undefined> {
    return this.drizzleStorage.getMoodboard(id);
  }
  
  async getMoodboardsByProjectId(projectId: number): Promise<Moodboard[]> {
    return this.drizzleStorage.getMoodboardsByProjectId(projectId);
  }
  
  async createMoodboard(moodboard: InsertMoodboard): Promise<Moodboard> {
    const dbMoodboard: any = { ...moodboard };
    
    // Convert camelCase to snake_case fields
    if ('clientId' in moodboard) {
      dbMoodboard.client_id = moodboard.clientId;
      delete dbMoodboard.clientId;
    }
    
    if ('sharedLink' in moodboard) {
      dbMoodboard.shared_link = moodboard.sharedLink;
      delete dbMoodboard.sharedLink;
    }
    
    return this.drizzleStorage.createMoodboard(dbMoodboard);
  }
  
  async updateMoodboard(id: number, moodboard: Partial<Moodboard>): Promise<Moodboard | undefined> {
    const dbMoodboard: any = { ...moodboard };
    
    // Convert camelCase to snake_case fields
    if ('clientId' in moodboard) {
      dbMoodboard.client_id = moodboard.clientId;
      delete dbMoodboard.clientId;
    }
    
    if ('sharedLink' in moodboard) {
      dbMoodboard.shared_link = moodboard.sharedLink;
      delete dbMoodboard.sharedLink;
    }
    
    return this.drizzleStorage.updateMoodboard(id, dbMoodboard);
  }
  
  async deleteMoodboard(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteMoodboard(id);
  }
  
  // Estimate methods
  async getEstimates(userId: number): Promise<Estimate[]> {
    return this.drizzleStorage.getEstimates(userId);
  }
  
  async getEstimate(id: number): Promise<Estimate | undefined> {
    return this.drizzleStorage.getEstimate(id);
  }
  
  async getEstimatesByProjectId(projectId: number): Promise<Estimate[]> {
    return this.drizzleStorage.getEstimatesByProjectId(projectId);
  }
  
  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const dbEstimate: any = { ...estimate };
    
    // Convert camelCase to snake_case fields
    if ('clientId' in estimate) {
      dbEstimate.client_id = estimate.clientId;
      delete dbEstimate.clientId;
    }
    
    if ('configJSON' in estimate) {
      dbEstimate.config_json = estimate.configJSON;
      delete dbEstimate.configJSON;
    }
    
    if ('pdfURL' in estimate) {
      dbEstimate.pdf_url = estimate.pdfURL;
      delete dbEstimate.pdfURL;
    }
    
    return this.drizzleStorage.createEstimate(dbEstimate);
  }
  
  async updateEstimate(id: number, estimate: Partial<Estimate>): Promise<Estimate | undefined> {
    const dbEstimate: any = { ...estimate };
    
    // Convert camelCase to snake_case fields
    if ('clientId' in estimate) {
      dbEstimate.client_id = estimate.clientId;
      delete dbEstimate.clientId;
    }
    
    if ('configJSON' in estimate) {
      dbEstimate.config_json = estimate.configJSON;
      delete dbEstimate.configJSON;
    }
    
    if ('pdfURL' in estimate) {
      dbEstimate.pdf_url = estimate.pdfURL;
      delete dbEstimate.pdfURL;
    }
    
    return this.drizzleStorage.updateEstimate(id, dbEstimate);
  }
  
  async deleteEstimate(id: number): Promise<boolean> {
    return this.drizzleStorage.deleteEstimate(id);
  }
  
  // Activity methods
  async getActivities(userId: number, limit?: number): Promise<Activity[]> {
    return this.drizzleStorage.getActivities(userId, limit);
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.drizzleStorage.getActivity(id);
  }
  
  async getActivitiesByClientId(clientId: number): Promise<Activity[]> {
    return this.drizzleStorage.getActivitiesByClientId(clientId);
  }
  
  async getActivitiesByProjectId(projectId: number): Promise<Activity[]> {
    return this.drizzleStorage.getActivitiesByProjectId(projectId);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const dbActivity: any = { ...activity };
    
    // Convert camelCase to snake_case fields
    if ('userId' in activity) {
      dbActivity.user_id = activity.userId;
      delete dbActivity.userId;
    }
    
    if ('clientId' in activity) {
      dbActivity.client_id = activity.clientId;
      delete dbActivity.clientId;
    }
    
    if ('projectId' in activity) {
      dbActivity.project_id = activity.projectId;
      delete dbActivity.projectId;
    }
    
    return this.drizzleStorage.createActivity(dbActivity);
  }
}

export const storage = new StorageAdapter();
