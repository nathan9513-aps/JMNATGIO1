import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createJiraOAuthService } from "./services/jira-oauth";
import { createJiraService } from "./services/jira";
import { createFileMakerService } from "./services/filemaker";
import { 
  insertTimeEntrySchema, 
  insertClientSchema, 
  insertProjectSchema, 
  insertClientProjectMappingSchema,
  insertAppSettingSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // OAuth callback logging
  app.use('/oauth-callback', (req, res, next) => {
    console.log(`🔐 OAuth callback: ${req.method} ${req.originalUrl}`, req.query);
    next();
  });

  // OAuth callback endpoint (backend) - handles Atlassian redirect
  app.get("/oauth-callback", async (req, res) => {
    console.log("🔐 OAuth callback received:", req.query);
    
    const { code, state, error } = req.query;
    
    if (error) {
      console.error("❌ OAuth error from Atlassian:", error);
      return res.redirect(`/settings?error=${encodeURIComponent(error as string)}`);
    }
    
    if (!code) {
      console.error("❌ No authorization code received");
      return res.redirect("/settings?error=no_code");
    }
    
    try {
      console.log("🔄 Starting token exchange with code:", (code as string).substring(0, 10) + "...");
      const oauthService = await createJiraOAuthService();
      
      if (!oauthService) {
        console.error("❌ OAuth service not configured");
        return res.redirect("/settings?error=oauth_not_configured");
      }
      
      // Exchange code for tokens using our improved service
      const tokens = await oauthService.exchangeCodeForTokens(code as string);
      console.log("✅ Token exchange successful:", { 
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        token_type: tokens.token_type 
      });
      
      // Get accessible Jira sites
      const resources = await oauthService.getAccessibleResources(tokens.access_token);
      console.log("✅ Retrieved accessible resources:", { count: resources.length });
      
      if (resources.length === 0) {
        console.error("❌ No accessible Jira sites found");
        return res.redirect("/settings?error=no_jira_sites");
      }

      // Use the first available site
      const primarySite = resources[0];
      console.log("📍 Using primary site:", { name: primarySite.name, url: primarySite.url });
      
      // Save tokens and site info to storage
      await storage.setAppSetting("JIRA_OAUTH_ACCESS_TOKEN", tokens.access_token);
      if (tokens.refresh_token) {
        await storage.setAppSetting("JIRA_OAUTH_REFRESH_TOKEN", tokens.refresh_token);
      }
      await storage.setAppSetting("JIRA_SITE_ID", primarySite.id);
      await storage.setAppSetting("JIRA_SITE_URL", primarySite.url);
      await storage.setAppSetting("JIRA_SITE_NAME", primarySite.name);
      
      // Set environment variables for this session
      process.env.JIRA_AUTH_TYPE = 'oauth';
      process.env.JIRA_OAUTH_ACCESS_TOKEN = tokens.access_token;
      process.env.JIRA_OAUTH_REFRESH_TOKEN = tokens.refresh_token;
      process.env.JIRA_SITE_ID = primarySite.id;
      
      console.log("✅ OAuth authentication successful! Redirecting to settings...");
      return res.redirect("/settings?success=oauth_connected");
      
    } catch (error: any) {
      console.error("❌ OAuth token exchange failed:", error);
      const errorMessage = error.message || 'token_exchange_failed';
      return res.redirect(`/settings?error=${encodeURIComponent(errorMessage)}`);
    }
  });

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
      const { query } = req.body;
      
      const jiraService = createJiraService();
      const issues = await jiraService.searchIssues(query);
      res.json(issues);
    } catch (error) {
      console.error("Jira search error:", error);
      res.status(500).json({ error: "Failed to search Jira issues. Please ensure Jira credentials are configured." });
    }
  });

  app.post("/api/jira/worklog", async (req, res) => {
    try {
      const { issueKey, timeSpent, comment, started } = req.body;
      
      const jiraService = createJiraService();
      const worklog = await jiraService.addWorklog(issueKey, {
        timeSpent,
        comment,
        started,
      });
      
      res.json(worklog);
    } catch (error) {
      console.error("Jira worklog error:", error);
      res.status(500).json({ error: "Failed to create Jira worklog. Please ensure Jira credentials are configured." });
    }
  });

  app.get("/api/jira/projects", async (req, res) => {
    try {
      const jiraService = createJiraService();
      const projects = await jiraService.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Jira projects error:", error);
      res.status(500).json({ error: "Failed to fetch Jira projects. Please ensure Jira credentials are configured." });
    }
  });

  // Get single Jira issue
  app.post("/api/jira/get-issue", async (req, res) => {
    try {
      const { issueKey } = req.body;
      
      const jiraService = createJiraService();
      const issue = await jiraService.getIssue(issueKey);
      res.json(issue);
    } catch (error) {
      console.error("Jira get issue error:", error);
      res.status(500).json({ error: "Failed to get Jira issue. Please ensure Jira credentials are configured." });
    }
  });

  // Update Jira issue
  app.post("/api/jira/update-issue", async (req, res) => {
    try {
      const { issueKey, updateData } = req.body;
      
      const jiraService = createJiraService();
      const result = await jiraService.updateIssue(issueKey, updateData);
      res.json({ success: true, result });
    } catch (error) {
      console.error("Jira update issue error:", error);
      res.status(500).json({ error: "Failed to update Jira issue. Please ensure Jira credentials are configured." });
    }
  });

  // Create new Jira issue
  app.post("/api/jira/create-issue", async (req, res) => {
    try {
      const { issueData } = req.body;
      
      const jiraService = createJiraService();
      const result = await jiraService.createIssue(issueData);
      res.json(result);
    } catch (error) {
      console.error("Jira create issue error:", error);
      res.status(500).json({ error: "Failed to create Jira issue. Please ensure Jira credentials are configured." });
    }
  });

  // Get issue types for a project
  app.post("/api/jira/issue-types", async (req, res) => {
    try {
      const { projectKey } = req.body;
      
      const jiraService = createJiraService();
      const issueTypes = await jiraService.getIssueTypes(projectKey);
      res.json(issueTypes);
    } catch (error) {
      console.error("Jira issue types error:", error);
      res.status(500).json({ error: "Failed to fetch issue types. Please ensure Jira credentials are configured." });
    }
  });

  // Get transitions for an issue
  app.post("/api/jira/transitions", async (req, res) => {
    try {
      const { issueKey } = req.body;
      
      const jiraService = createJiraService();
      const transitions = await jiraService.getIssueTransitions(issueKey);
      res.json(transitions);
    } catch (error) {
      console.error("Jira transitions error:", error);
      res.status(500).json({ error: "Failed to fetch transitions. Please ensure Jira credentials are configured." });
    }
  });

  // Transition an issue (change status, close, etc.)
  app.post("/api/jira/transition-issue", async (req, res) => {
    try {
      const { issueKey, transitionId, comment } = req.body;
      
      const jiraService = createJiraService();
      const transitionData = {
        transition: { id: transitionId },
        ...(comment && { comment: { body: comment } })
      };
      
      await jiraService.transitionIssue(issueKey, transitionData);
      res.json({ success: true });
    } catch (error) {
      console.error("Jira transition issue error:", error);
      res.status(500).json({ error: "Failed to transition issue. Please ensure Jira credentials are configured." });
    }
  });

  // Get comments for an issue
  app.post("/api/jira/comments", async (req, res) => {
    try {
      const { issueKey } = req.body;
      
      const jiraService = createJiraService();
      const comments = await jiraService.getComments(issueKey);
      res.json(comments);
    } catch (error) {
      console.error("Jira comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments. Please ensure Jira credentials are configured." });
    }
  });

  // Add comment to an issue
  app.post("/api/jira/add-comment", async (req, res) => {
    try {
      const { issueKey, comment } = req.body;
      
      const jiraService = createJiraService();
      const result = await jiraService.addComment(issueKey, { body: comment });
      res.json(result);
    } catch (error) {
      console.error("Jira add comment error:", error);
      res.status(500).json({ error: "Failed to add comment. Please ensure Jira credentials are configured." });
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

  // Jira credentials management
  app.get("/api/jira/credentials", async (req, res) => {
    try {
      const hasCredentials = !!(
        process.env.JIRA_DOMAIN && 
        process.env.JIRA_USERNAME && 
        process.env.JIRA_API_TOKEN
      );
      
      res.json({
        configured: hasCredentials,
        domain: process.env.JIRA_DOMAIN ? "****" : "",
        username: process.env.JIRA_USERNAME ? "****" : "",
        apiToken: process.env.JIRA_API_TOKEN ? "****" : ""
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check Jira credentials" });
    }
  });

  // OAuth configuration management
  app.post("/api/oauth/config", async (req, res) => {
    try {
      const { clientId, clientSecret } = req.body;
      
      if (!clientId || !clientSecret) {
        return res.status(400).json({ error: "Client ID and Client Secret are required" });
      }
      
      // Save credentials in storage
      console.log("Saving OAuth credentials:", { clientId: clientId.substring(0, 10) + "...", clientSecret: "***" });
      const savedClientId = await storage.setAppSetting("JIRA_OAUTH_CLIENT_ID", clientId);
      const savedClientSecret = await storage.setAppSetting("JIRA_OAUTH_CLIENT_SECRET", clientSecret);
      console.log("Saved successfully:", { clientId: !!savedClientId, clientSecret: !!savedClientSecret });
      
      res.json({ 
        success: true, 
        message: "OAuth credentials saved successfully" 
      });
    } catch (error) {
      console.error("OAuth config error:", error);
      res.status(500).json({ error: "Failed to save OAuth credentials" });
    }
  });

  app.get("/api/oauth/config", async (req, res) => {
    try {
      const clientId = await storage.getAppSetting("JIRA_OAUTH_CLIENT_ID");
      const clientSecret = await storage.getAppSetting("JIRA_OAUTH_CLIENT_SECRET");
      
      console.log("Checking OAuth config:", { 
        clientId: clientId?.value ? clientId.value.substring(0, 10) + "..." : "not found", 
        clientSecret: clientSecret?.value ? "***" : "not found" 
      });
      
      res.json({
        configured: !!(clientId?.value && clientSecret?.value),
        hasClientId: !!clientId?.value,
        hasClientSecret: !!clientSecret?.value,
      });
    } catch (error) {
      console.error("OAuth config check error:", error);
      res.status(500).json({ error: "Failed to check OAuth configuration" });
    }
  });

  app.post("/api/jira/credentials", async (req, res) => {
    try {
      const { jiraDomain, jiraUsername, jiraApiToken } = req.body;
      
      if (!jiraDomain || !jiraUsername || !jiraApiToken) {
        return res.status(400).json({ error: "All Jira credentials are required" });
      }

      // Update environment variables for the current session
      process.env.JIRA_DOMAIN = jiraDomain;
      process.env.JIRA_USERNAME = jiraUsername;
      process.env.JIRA_API_TOKEN = jiraApiToken;

      // Test the credentials by trying to fetch projects
      try {
        const jiraService = createJiraService();
        await jiraService.getProjects();
      } catch (error) {
        return res.status(400).json({ error: "Invalid Jira credentials. Please check your domain, username, and API token." });
      }

      res.json({ 
        success: true, 
        message: "Jira credentials saved successfully",
        note: "Credentials are saved for this session. For permanent storage, please set them as environment variables."
      });
    } catch (error) {
      console.error("Jira credentials save error:", error);
      res.status(500).json({ error: "Failed to save Jira credentials" });
    }
  });

  // Jira OAuth endpoints
  app.get("/api/jira/oauth/auth-url", async (req, res) => {
    try {
      const oauthService = await createJiraOAuthService();
      
      if (!oauthService) {
        return res.status(400).json({ 
          error: "OAuth not configured", 
          message: "OAuth credentials not found. Please configure OAuth in admin setup." 
        });
      }
      
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state in session or memory for validation (in production, use proper session storage)
      const authUrl = oauthService.generateAuthUrl(state);
      
      res.json({ authUrl, state });
    } catch (error) {
      console.error("OAuth auth URL error:", error);
      res.status(500).json({ error: "Failed to generate OAuth URL" });
    }
  });

  app.post("/api/jira/oauth/callback", async (req, res) => {
    try {
      const { code, state } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code is required" });
      }

      const oauthService = await createJiraOAuthService();
      
      if (!oauthService) {
        return res.status(400).json({ 
          error: "OAuth not configured", 
          message: "OAuth credentials not found. Please configure OAuth in admin setup." 
        });
      }
      
      // Exchange code for tokens
      const tokens = await oauthService.exchangeCodeForTokens(code);
      
      // Get accessible resources (Jira sites)
      const resources = await oauthService.getAccessibleResources(tokens.access_token);
      
      if (resources.length === 0) {
        return res.status(400).json({ error: "No accessible Jira sites found" });
      }

      // Use the first available site (in production, let user choose)
      const primarySite = resources[0];
      
      // Store OAuth tokens in environment variables for this session
      process.env.JIRA_AUTH_TYPE = 'oauth';
      process.env.JIRA_OAUTH_ACCESS_TOKEN = tokens.access_token;
      process.env.JIRA_OAUTH_REFRESH_TOKEN = tokens.refresh_token;
      process.env.JIRA_SITE_ID = primarySite.id;

      // Test the OAuth connection by fetching projects
      try {
        const jiraService = createJiraService();
        await jiraService.getProjects();
      } catch (error) {
        return res.status(400).json({ error: "Failed to connect to Jira with OAuth tokens" });
      }

      res.json({ 
        success: true, 
        message: "OAuth authentication successful",
        siteName: primarySite.name,
        siteUrl: primarySite.url,
        accessibleSites: resources.length
      });
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "OAuth authentication failed" });
    }
  });

  app.get("/api/jira/oauth/status", async (req, res) => {
    try {
      // Check if OAuth credentials are configured in database
      const clientId = await storage.getAppSetting("JIRA_OAUTH_CLIENT_ID");
      const clientSecret = await storage.getAppSetting("JIRA_OAUTH_CLIENT_SECRET");
      const isOAuthConfigured = !!(clientId?.value && clientSecret?.value);
      
      const isAuthenticated = !!(
        process.env.JIRA_AUTH_TYPE === 'oauth' &&
        process.env.JIRA_OAUTH_ACCESS_TOKEN &&
        process.env.JIRA_SITE_ID
      );

      console.log("OAuth status check:", { 
        isOAuthConfigured,
        hasClientId: !!clientId?.value,
        hasClientSecret: !!clientSecret?.value,
        isAuthenticated
      });

      res.json({
        oauthConfigured: isOAuthConfigured,
        authenticated: isAuthenticated,
        authType: process.env.JIRA_AUTH_TYPE || 'basic'
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check OAuth status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
