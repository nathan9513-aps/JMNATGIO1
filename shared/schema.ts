import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  jiraUsername: text("jira_username"),
  jiraApiToken: text("jira_api_token"),
  jiraDomain: text("jira_domain"),
  filemakerHost: text("filemaker_host"),
  filemakerDatabase: text("filemaker_database"),
  filemakerUsername: text("filemaker_username"),
  filemakerPassword: text("filemaker_password"),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileMakerId: text("filemaker_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  contactEmail: text("contact_email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jiraProjectKey: text("jira_project_key").notNull(),
  jiraProjectId: text("jira_project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const clientProjectMappings = pgTable("client_project_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  defaultAssignee: text("default_assignee"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  jiraIssueKey: text("jira_issue_key"),
  jiraIssueId: text("jira_issue_id"),
  jiraWorklogId: text("jira_worklog_id"),
  description: text("description").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationSeconds: integer("duration_seconds"),
  isBillable: boolean("is_billable").default(true),
  isRunning: boolean("is_running").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const jiraIssues = pgTable("jira_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jiraIssueId: text("jira_issue_id").notNull().unique(),
  jiraIssueKey: text("jira_issue_key").notNull().unique(),
  projectId: varchar("project_id").references(() => projects.id),
  summary: text("summary").notNull(),
  issueType: text("issue_type"),
  status: text("status"),
  assignee: text("assignee"),
  metadata: jsonb("metadata"),
  lastSynced: timestamp("last_synced").default(sql`now()`),
});

// App settings for OAuth configuration
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertClientProjectMappingSchema = createInsertSchema(clientProjectMappings).omit({
  id: true,
  createdAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertJiraIssueSchema = createInsertSchema(jiraIssues).omit({
  id: true,
  lastSynced: true,
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ClientProjectMapping = typeof clientProjectMappings.$inferSelect;
export type InsertClientProjectMapping = z.infer<typeof insertClientProjectMappingSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type JiraIssue = typeof jiraIssues.$inferSelect;
export type InsertJiraIssue = z.infer<typeof insertJiraIssueSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
