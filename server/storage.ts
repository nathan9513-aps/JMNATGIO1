import { 
  type User, 
  type InsertUser,
  type Client,
  type InsertClient,
  type Project,
  type InsertProject,
  type ClientProjectMapping,
  type InsertClientProjectMapping,
  type TimeEntry,
  type InsertTimeEntry,
  type JiraIssue,
  type InsertJiraIssue,
  type AppSetting,
  type InsertAppSetting
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<Client>): Promise<Client>;
  deleteClient(id: string): Promise<boolean>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<boolean>;

  // Client Project Mappings
  getClientProjectMappings(): Promise<ClientProjectMapping[]>;
  getClientProjectMapping(id: string): Promise<ClientProjectMapping | undefined>;
  createClientProjectMapping(mapping: InsertClientProjectMapping): Promise<ClientProjectMapping>;
  updateClientProjectMapping(id: string, mapping: Partial<ClientProjectMapping>): Promise<ClientProjectMapping>;
  deleteClientProjectMapping(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntries(userId?: string): Promise<TimeEntry[]>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<TimeEntry>): Promise<TimeEntry>;
  deleteTimeEntry(id: string): Promise<boolean>;
  getRunningTimeEntry(userId: string): Promise<TimeEntry | undefined>;

  // Jira Issues
  getJiraIssues(): Promise<JiraIssue[]>;
  getJiraIssue(jiraIssueKey: string): Promise<JiraIssue | undefined>;
  createJiraIssue(issue: InsertJiraIssue): Promise<JiraIssue>;
  updateJiraIssue(jiraIssueKey: string, issue: Partial<JiraIssue>): Promise<JiraIssue>;

  // App Settings
  getAppSetting(key: string): Promise<AppSetting | undefined>;
  setAppSetting(key: string, value: string): Promise<AppSetting>;
  deleteAppSetting(key: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private projects: Map<string, Project> = new Map();
  private clientProjectMappings: Map<string, ClientProjectMapping> = new Map();
  private timeEntries: Map<string, TimeEntry> = new Map();
  private jiraIssues: Map<string, JiraIssue> = new Map();
  private appSettings: Map<string, AppSetting> = new Map();

  constructor() {
    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default user
    const defaultUser: User = {
      id: "default-user",
      username: "admin",
      password: "password",
      email: "admin@company.com",
      jiraUsername: "",
      jiraApiToken: "",
      jiraDomain: "",
      filemakerHost: "",
      filemakerDatabase: "",
      filemakerUsername: "",
      filemakerPassword: "",
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { 
      ...insertClient, 
      id, 
      createdAt: new Date() 
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, clientUpdate: Partial<Client>): Promise<Client> {
    const client = this.clients.get(id);
    if (!client) throw new Error("Client not found");
    const updatedClient = { ...client, ...clientUpdate };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, projectUpdate: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    const updatedProject = { ...project, ...projectUpdate };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Client Project Mappings
  async getClientProjectMappings(): Promise<ClientProjectMapping[]> {
    return Array.from(this.clientProjectMappings.values());
  }

  async getClientProjectMapping(id: string): Promise<ClientProjectMapping | undefined> {
    return this.clientProjectMappings.get(id);
  }

  async createClientProjectMapping(insertMapping: InsertClientProjectMapping): Promise<ClientProjectMapping> {
    const id = randomUUID();
    const mapping: ClientProjectMapping = { 
      ...insertMapping, 
      id, 
      createdAt: new Date() 
    };
    this.clientProjectMappings.set(id, mapping);
    return mapping;
  }

  async updateClientProjectMapping(id: string, mappingUpdate: Partial<ClientProjectMapping>): Promise<ClientProjectMapping> {
    const mapping = this.clientProjectMappings.get(id);
    if (!mapping) throw new Error("Client project mapping not found");
    const updatedMapping = { ...mapping, ...mappingUpdate };
    this.clientProjectMappings.set(id, updatedMapping);
    return updatedMapping;
  }

  async deleteClientProjectMapping(id: string): Promise<boolean> {
    return this.clientProjectMappings.delete(id);
  }

  // Time Entries
  async getTimeEntries(userId?: string): Promise<TimeEntry[]> {
    const entries = Array.from(this.timeEntries.values());
    return userId ? entries.filter(entry => entry.userId === userId) : entries;
  }

  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = randomUUID();
    const entry: TimeEntry = { 
      ...insertEntry, 
      id, 
      createdAt: new Date() 
    };
    this.timeEntries.set(id, entry);
    return entry;
  }

  async updateTimeEntry(id: string, entryUpdate: Partial<TimeEntry>): Promise<TimeEntry> {
    const entry = this.timeEntries.get(id);
    if (!entry) throw new Error("Time entry not found");
    const updatedEntry = { ...entry, ...entryUpdate };
    this.timeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  async getRunningTimeEntry(userId: string): Promise<TimeEntry | undefined> {
    return Array.from(this.timeEntries.values()).find(
      entry => entry.userId === userId && entry.isRunning
    );
  }

  // App Settings
  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    return this.appSettings.get(key);
  }

  async setAppSetting(key: string, value: string): Promise<AppSetting> {
    const setting: AppSetting = {
      id: randomUUID(),
      key: key,
      value: value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appSettings.set(key, setting);
    return setting;
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    return this.appSettings.delete(key);
  }

  // Jira Issues
  async getJiraIssues(): Promise<JiraIssue[]> {
    return Array.from(this.jiraIssues.values());
  }

  async getJiraIssue(jiraIssueKey: string): Promise<JiraIssue | undefined> {
    return Array.from(this.jiraIssues.values()).find(
      issue => issue.jiraIssueKey === jiraIssueKey
    );
  }

  async createJiraIssue(insertIssue: InsertJiraIssue): Promise<JiraIssue> {
    const id = randomUUID();
    const issue: JiraIssue = { 
      ...insertIssue, 
      id, 
      lastSynced: new Date() 
    };
    this.jiraIssues.set(id, issue);
    return issue;
  }

  async updateJiraIssue(jiraIssueKey: string, issueUpdate: Partial<JiraIssue>): Promise<JiraIssue> {
    const issue = Array.from(this.jiraIssues.values()).find(
      issue => issue.jiraIssueKey === jiraIssueKey
    );
    if (!issue) throw new Error("Jira issue not found");
    const updatedIssue = { ...issue, ...issueUpdate, lastSynced: new Date() };
    this.jiraIssues.set(issue.id, updatedIssue);
    return updatedIssue;
  }
}

export const storage = new MemStorage();
