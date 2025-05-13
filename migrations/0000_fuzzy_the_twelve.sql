CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"client_id" integer,
	"project_id" integer,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"company" text,
	"project_id" integer,
	"portal_access" boolean DEFAULT false,
	"last_login" timestamp,
	"notes" text,
	"status" text DEFAULT 'active',
	"avatar" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"config_json" jsonb DEFAULT '{}'::jsonb,
	"total" integer DEFAULT 0,
	"gst" integer DEFAULT 0,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"source" text,
	"stage" text DEFAULT 'new',
	"tag" text,
	"assigned_to" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "moodboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"theme" text,
	"media" jsonb DEFAULT '[]'::jsonb,
	"comments" jsonb DEFAULT '[]'::jsonb,
	"shared_link" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"name" text NOT NULL,
	"description" text,
	"location" text,
	"status" text DEFAULT 'planning',
	"start_date" timestamp,
	"end_date" timestamp,
	"budget" integer,
	"progress" integer DEFAULT 0,
	"tasks" jsonb DEFAULT '[]'::jsonb,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"logs" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"created_by" integer,
	"data_json" jsonb DEFAULT '{}'::jsonb,
	"pdf_url" text,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"plan" text DEFAULT 'free',
	"billing_status" text DEFAULT 'active',
	"expiry" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'sales' NOT NULL,
	"active_plan" text DEFAULT 'free',
	"firebase_uid" text,
	"company" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moodboards" ADD CONSTRAINT "moodboards_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_user_idx" ON "activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_client_idx" ON "activities" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "activity_project_idx" ON "activities" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "activity_type_idx" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "client_email_idx" ON "clients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "client_phone_idx" ON "clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "estimate_client_idx" ON "estimates" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "lead_stage_idx" ON "leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "lead_assigned_to_idx" ON "leads" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "moodboard_client_idx" ON "moodboards" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "project_client_idx" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "project_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposal_client_idx" ON "proposals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "proposal_status_idx" ON "proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_plan_idx" ON "subscriptions" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_plan_idx" ON "users" USING btree ("active_plan");