import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  name: text("name").notNull(),
  phone: text("phone").unique(),
  role: text("role", { enum: ['admin', 'designer', 'sales'] }).notNull().default('sales'),
  activePlan: text("active_plan").default('free'),
  firebaseUid: text("firebase_uid").unique(),
  supabaseUid: text("supabase_uid").unique(),
  company: text("company"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    roleIdx: index("user_role_idx").on(table.role),
    planIdx: index("user_plan_idx").on(table.activePlan),
  }
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  company: text("company"),
  project_id: integer("project_id"),
  portal_access: boolean("portal_access").default(false),
  last_login: timestamp("last_login"),
  notes: text("notes"),
  status: text("status").default("active"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    emailIdx: index("client_email_idx").on(table.email),
    phoneIdx: index("client_phone_idx").on(table.phone),
  }
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Leads schema
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  source: text("source"),
  stage: text("stage", { enum: ['new', 'in_discussion', 'won', 'lost'] }).default("new"),
  tag: text("tag"),
  assignedTo: integer("assigned_to").references(() => users.id),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    stageIdx: index("lead_stage_idx").on(table.stage),
    assignedToIdx: index("lead_assigned_to_idx").on(table.assignedTo),
    followUpIdx: index("lead_follow_up_idx").on(table.followUpDate),
  }
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Project schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  status: text("status").default("planning"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: integer("budget"),
  progress: integer("progress").default(0),
  // Rooms/zones within the project - Array of objects with id, name, status, progress
  rooms: jsonb("rooms").default([]),
  // Tasks assigned per room with due dates and status
  tasks: jsonb("tasks").default([]),
  // Photos uploaded for daily progress logs
  photos: jsonb("photos").default([]),
  // Daily logs with timestamps, photos, text notes
  logs: jsonb("logs").default([]),
  // Last weekly PDF report generation timestamp
  lastReportDate: timestamp("last_report_date"),
  // Weekly report settings (auto-generate, recipients)
  reportSettings: jsonb("report_settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("project_client_idx").on(table.client_id),
    statusIdx: index("project_status_idx").on(table.status),
  }
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Proposal schema
// Note: This schema has been updated to match the actual database structure
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").references(() => clients.id),
  lead_id: integer("lead_id").references(() => leads.id),
  created_by: integer("created_by").references(() => users.id),
  dataJSON: jsonb("data_json").default({}),
  pdfURL: text("pdf_url"),
  sharedLink: text("shared_link"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("proposal_client_idx").on(table.client_id),
    leadIdx: index("proposal_lead_idx").on(table.lead_id),
    statusIdx: index("proposal_status_idx").on(table.status),
  }
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Moodboard schema
export const moodboards = pgTable("moodboards", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").references(() => clients.id),
  name: text("name").default("Untitled Moodboard"),
  description: text("description"),
  theme: text("theme"),
  // Sections: color palette, furniture, layout, lighting, theme inspiration
  sections: jsonb("sections").default({}),
  // All media items grouped by section
  media: jsonb("media").default([]),
  comments: jsonb("comments").default([]),
  sharedLink: text("shared_link"),
  pdfURL: text("pdf_url"),
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("moodboard_client_idx").on(table.client_id),
  }
});

export const insertMoodboardSchema = createInsertSchema(moodboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Pricing configurations for estimates
export const estimateConfigs = pgTable("estimate_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  configType: text("config_type").notNull(), // base_price, layout_price, finish_price, room_price
  config: jsonb("config").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    configTypeIdx: index("config_type_idx").on(table.configType),
  }
});

export const insertEstimateConfigSchema = createInsertSchema(estimateConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Estimate schema
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").references(() => clients.id),
  lead_id: integer("lead_id").references(() => leads.id),
  title: text("title").default("New Estimate"),
  configJSON: jsonb("config_json").default({}),
  subtotal: integer("subtotal").default(0),
  gst: integer("gst").default(0),
  total: integer("total").default(0),
  status: text("status").default("draft"),
  isTemplate: boolean("is_template").default(false),
  templateName: text("template_name"),
  milestoneBreakdown: jsonb("milestone_breakdown").default([]),
  pdfURL: text("pdf_url"),
  sharedLink: text("shared_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("estimate_client_idx").on(table.client_id),
    leadIdx: index("estimate_lead_idx").on(table.lead_id),
    statusIdx: index("estimate_status_idx").on(table.status),
  }
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Subscription schema
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  plan: text("plan").default("free"),
  billing_status: text("billing_status").default("active"),
  expiry: timestamp("expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userIdx: index("subscription_user_idx").on(table.user_id),
    planIdx: index("subscription_plan_idx").on(table.plan),
  }
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Task schema (using projects.tasks field now)

// Client Activity schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  client_id: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  project_id: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userIdx: index("activity_user_idx").on(table.user_id),
    clientIdx: index("activity_client_idx").on(table.client_id),
    projectIdx: index("activity_project_idx").on(table.project_id),
    typeIdx: index("activity_type_idx").on(table.type),
  }
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type Moodboard = typeof moodboards.$inferSelect;
export type InsertMoodboard = z.infer<typeof insertMoodboardSchema>;

export type EstimateConfig = typeof estimateConfigs.$inferSelect;
export type InsertEstimateConfig = z.infer<typeof insertEstimateConfigSchema>;

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Project logs schema
export const projectLogs = pgTable("project_logs", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  user_id: integer("user_id").references(() => users.id),
  text: text("text").notNull(),
  room_id: text("room_id"),
  log_type: text("log_type").default("note"), // note or photo
  photo_url: text("photo_url"),
  photo_caption: text("photo_caption"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    projectIdx: index("log_project_idx").on(table.project_id),
    userIdx: index("log_user_idx").on(table.user_id),
    roomIdx: index("log_room_idx").on(table.room_id),
    createdAtIdx: index("log_created_at_idx").on(table.created_at),
  }
});

export const insertProjectLogSchema = createInsertSchema(projectLogs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Project reports schema
export const projectReports = pgTable("project_reports", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  user_id: integer("user_id").references(() => users.id),
  report_type: text("report_type").default("weekly"), // weekly, monthly, custom
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  includes_photos: boolean("includes_photos").default(true),
  includes_notes: boolean("includes_notes").default(true),
  pdf_url: text("pdf_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    projectIdx: index("report_project_idx").on(table.project_id),
    userIdx: index("report_user_idx").on(table.user_id),
    createdAtIdx: index("report_created_at_idx").on(table.created_at),
  }
});

export const insertProjectReportSchema = createInsertSchema(projectReports).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// WhatsApp message logs
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id", { length: 50 }).primaryKey(), // Custom message ID
  to: varchar("to", { length: 20 }).notNull(), // Phone number
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  messageType: varchar("message_type", { length: 50 }).notNull(), // Template name
  status: varchar("status", { length: 20 }).notNull().default("sent"), // sent, delivered, read, failed
  content: text("content").notNull(), // Message content
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata").default({}), // Additional data like variables used
  retryCount: integer("retry_count").default(0), // For tracking retries
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    statusIdx: index("whatsapp_status_idx").on(table.status),
    leadIdx: index("whatsapp_lead_idx").on(table.leadId),
    clientIdx: index("whatsapp_client_idx").on(table.clientId),
  }
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectLog = typeof projectLogs.$inferSelect;
export type InsertProjectLog = z.infer<typeof insertProjectLogSchema>;

export type ProjectReport = typeof projectReports.$inferSelect;
export type InsertProjectReport = z.infer<typeof insertProjectReportSchema>;

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;

// Company feature toggles and settings
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("My Company"),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#6366f1"),
  secondaryColor: text("secondary_color").default("#8b5cf6"),
  enabledFeatures: jsonb("enabled_features").default({
    crm: true,
    proposals: true,
    moodboards: true,
    estimates: true,
    whatsapp: true,
    tasks: true
  }).notNull(),
  planLimits: jsonb("plan_limits").default({
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
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

// Analytics data
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  metric: text("metric").notNull(),
  value: integer("value").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

// Template categories
export const templateCategories = pgTable("template_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ['proposal', 'estimate', 'moodboard', 'email'] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTemplateCategorySchema = createInsertSchema(templateCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TemplateCategory = typeof templateCategories.$inferSelect;
export type InsertTemplateCategory = z.infer<typeof insertTemplateCategorySchema>;

// Templates
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ['proposal', 'estimate', 'moodboard', 'email'] }).notNull(),
  categoryId: integer("category_id").references(() => templateCategories.id, { onDelete: "set null" }),
  content: jsonb("content").notNull(),
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
