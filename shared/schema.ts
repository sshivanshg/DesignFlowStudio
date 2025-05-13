import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, unique, index } from "drizzle-orm/pg-core";
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
  stage: text("stage").default("new"),
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
  tasks: jsonb("tasks").default([]),
  photos: jsonb("photos").default([]),
  logs: jsonb("logs").default([]),
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
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").references(() => clients.id),
  created_by: integer("created_by").references(() => users.id),
  dataJSON: jsonb("data_json").default({}),
  pdfURL: text("pdf_url"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("proposal_client_idx").on(table.client_id),
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
  theme: text("theme"),
  media: jsonb("media").default([]),
  comments: jsonb("comments").default([]),
  sharedLink: text("shared_link"),
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

// Estimate schema
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").references(() => clients.id),
  configJSON: jsonb("config_json").default({}),
  total: integer("total").default(0),
  gst: integer("gst").default(0),
  pdfURL: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("estimate_client_idx").on(table.client_id),
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

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
