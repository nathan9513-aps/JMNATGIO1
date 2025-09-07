import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createJiraService } from "./services/jira";
import { createFileMakerService } from "./services/filemaker";
import { 
  insertTimeEntrySchema, 
  insertClientSchema, 
  insertProjectSchema, 
  insertClientProjectMappingSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User settings
  app.put("/api/user/:id/settings", async (req, res) => {
    try {
      const { id } = req.params;
      const settings = req.body;
      
      const updatedUser = await storage.updateUser(id, settings);
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user settings" });
    }
  });

  // Time entries
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { userId } = req.query;
      const entries = await storage.getTimeEntries(userId as string);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse(req.body);
      const entry = await storage.createTimeEntry(validatedData);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid time entry data" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const entry = await storage.updateTimeEntry(id, updates);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTimeEntry(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });

  app.get("/api/time-entries/running/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const entry = await storage.getRunningTimeEntry(userId);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch running time entry" });
    }
  });

  // Jira integration
  app.post("/api/jira/search-issues", async (req, res) => {
    try {
      const { query, jiraConfig } = req.body;
      
      if (!jiraConfig || !jiraConfig.domain || !jiraConfig.username || !jiraConfig.apiToken) {
        return res.status(400).json({ error: "Jira configuration is required" });
      }

      const jiraService = createJiraService(jiraConfig);
      const issues = await jiraService.searchIssues(query);
      res.json(issues);
    } catch (error) {
      console.error("Jira search error:", error);
      res.status(500).json({ error: "Failed to search Jira issues" });
    }
  });

  app.post("/api/jira/worklog", async (req, res) => {
    try {
      const { issueKey, timeSpent, comment, started, jiraConfig } = req.body;
      
      if (!jiraConfig || !jiraConfig.domain || !jiraConfig.username || !jiraConfig.apiToken) {
        return res.status(400).json({ error: "Jira configuration is required" });
      }

      const jiraService = createJiraService(jiraConfig);
      const worklog = await jiraService.addWorklog(issueKey, {
        timeSpent,
        comment,
        started,
      });
      
      res.json(worklog);
    } catch (error) {
      console.error("Jira worklog error:", error);
      res.status(500).json({ error: "Failed to create Jira worklog" });
    }
  });

  app.get("/api/jira/projects", async (req, res) => {
    try {
      const { jiraConfig } = req.query;
      
      if (!jiraConfig) {
        return res.status(400).json({ error: "Jira configuration is required" });
      }

      const config = JSON.parse(jiraConfig as string);
      const jiraService = createJiraService(config);
      const projects = await jiraService.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Jira projects error:", error);
      res.status(500).json({ error: "Failed to fetch Jira projects" });
    }
  });

  // FileMaker integration
  app.get("/api/filemaker/clients", async (req, res) => {
    try {
      const { filemakerConfig } = req.query;
      
      if (!filemakerConfig) {
        return res.status(400).json({ error: "FileMaker configuration is required" });
      }

      const config = JSON.parse(filemakerConfig as string);
      const filemakerService = createFileMakerService(config);
      const clients = await filemakerService.getClients();
      res.json(clients);
    } catch (error) {
      console.error("FileMaker clients error:", error);
      res.status(500).json({ error: "Failed to fetch FileMaker clients" });
    }
  });

  // Local clients CRUD
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });

  // Projects CRUD
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  // Client-Project mappings
  app.get("/api/client-project-mappings", async (req, res) => {
    try {
      const mappings = await storage.getClientProjectMappings();
      
      // Enrich with client and project data
      const enrichedMappings = await Promise.all(
        mappings.map(async (mapping) => {
          const client = await storage.getClient(mapping.clientId);
          const project = await storage.getProject(mapping.projectId);
          return {
            ...mapping,
            client,
            project,
          };
        })
      );
      
      res.json(enrichedMappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mappings" });
    }
  });

  app.post("/api/client-project-mappings", async (req, res) => {
    try {
      const validatedData = insertClientProjectMappingSchema.parse(req.body);
      const mapping = await storage.createClientProjectMapping(validatedData);
      res.json(mapping);
    } catch (error) {
      res.status(400).json({ error: "Invalid mapping data" });
    }
  });

  app.delete("/api/client-project-mappings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClientProjectMapping(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mapping" });
    }
  });

  // Reports
  app.get("/api/reports/time-summary", async (req, res) => {
    try {
      const { userId, startDate, endDate } = req.query;
      const entries = await storage.getTimeEntries(userId as string);
      
      // Filter by date range if provided
      let filteredEntries = entries;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        filteredEntries = entries.filter(entry => {
          const entryDate = entry.startTime;
          return entryDate >= start && entryDate <= end;
        });
      }

      // Calculate summary statistics
      const totalSeconds = filteredEntries.reduce((sum, entry) => 
        sum + (entry.durationSeconds || 0), 0
      );
      
      const billableSeconds = filteredEntries
        .filter(entry => entry.isBillable)
        .reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);

      const projectCounts = filteredEntries.reduce((acc, entry) => {
        if (entry.projectId) {
          acc[entry.projectId] = (acc[entry.projectId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalSeconds,
        billableSeconds,
        totalEntries: filteredEntries.length,
        activeProjects: Object.keys(projectCounts).length,
        entries: filteredEntries,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
