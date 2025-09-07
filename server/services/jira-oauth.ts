interface JiraOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface JiraOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface JiraAccessibleResource {
  id: string;
  name: string;
  url: string;
  scopes: string[];
  avatarUrl: string;
}

export class JiraOAuthService {
  private config: JiraOAuthConfig;
  private baseAuthUrl = 'https://auth.atlassian.com';
  private baseApiUrl = 'https://api.atlassian.com';

  constructor(config: JiraOAuthConfig) {
    this.config = config;
  }

  // Generate authorization URL for OAuth flow
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: this.config.clientId,
      scope: 'read:jira-work write:jira-work manage:jira-project read:me offline_access',
      redirect_uri: this.config.redirectUri,
      state: state,
      response_type: 'code',
      prompt: 'consent'
    });

    const authUrl = `${this.baseAuthUrl}/authorize?${params.toString()}`;
    
    console.log("Generated OAuth URL:", {
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId.substring(0, 10) + "...",
      authUrl: authUrl.substring(0, 100) + "..."
    });

    return authUrl;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<JiraOAuthTokens> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      console.log("🔄 Starting OAuth token exchange...");
      
      const response = await fetch(`${this.baseAuthUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Replit-Jira-Time-Tracker/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: code,
          redirect_uri: this.config.redirectUri,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OAuth token exchange HTTP error:", response.status, errorText);
        throw new Error(`OAuth token exchange failed (${response.status}): ${errorText}`);
      }

      console.log("✅ OAuth token exchange successful");
      return response.json();
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ OAuth token exchange network error:", error);
      
      if (error.name === 'AbortError') {
        throw new Error('OAuth token exchange timed out after 30 seconds');
      }
      
      if (error.code === 'ENOTFOUND' || error.errno === -3001) {
        throw new Error('Network connectivity issue: Unable to reach Atlassian servers. Please check your internet connection.');
      }
      
      throw new Error(`OAuth token exchange failed: ${error.message}`);
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<JiraOAuthTokens> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      console.log("🔄 Refreshing OAuth token...");
      
      const response = await fetch(`${this.baseAuthUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Replit-Jira-Time-Tracker/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Token refresh HTTP error:", response.status, errorText);
        throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
      }

      console.log("✅ Token refresh successful");
      return response.json();
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ Token refresh network error:", error);
      
      if (error.name === 'AbortError') {
        throw new Error('Token refresh timed out after 30 seconds');
      }
      
      if (error.code === 'ENOTFOUND' || error.errno === -3001) {
        throw new Error('Network connectivity issue: Unable to reach Atlassian servers during token refresh.');
      }
      
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Get accessible Jira sites for the user
  async getAccessibleResources(accessToken: string): Promise<JiraAccessibleResource[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      console.log("🔄 Fetching accessible Jira resources...");
      
      const response = await fetch(`${this.baseApiUrl}/oauth/token/accessible-resources`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Replit-Jira-Time-Tracker/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Get accessible resources HTTP error:", response.status, errorText);
        throw new Error(`Failed to get accessible resources (${response.status}): ${errorText}`);
      }

      console.log("✅ Successfully fetched accessible resources");
      return response.json();
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ Get accessible resources network error:", error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request to get accessible resources timed out after 30 seconds');
      }
      
      if (error.code === 'ENOTFOUND' || error.errno === -3001) {
        throw new Error('Network connectivity issue: Unable to reach Atlassian API servers.');
      }
      
      throw new Error(`Failed to get accessible resources: ${error.message}`);
    }
  }

  // Get user information
  async getUserInfo(accessToken: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      console.log("🔄 Fetching user info...");
      
      const response = await fetch(`${this.baseApiUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Replit-Jira-Time-Tracker/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Get user info HTTP error:", response.status, errorText);
        throw new Error(`Failed to get user info (${response.status}): ${errorText}`);
      }

      console.log("✅ Successfully fetched user info");
      return response.json();
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ Get user info network error:", error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request to get user info timed out after 30 seconds');
      }
      
      if (error.code === 'ENOTFOUND' || error.errno === -3001) {
        throw new Error('Network connectivity issue: Unable to reach Atlassian API for user info.');
      }
      
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }
}

// Create OAuth service instance with stored credentials
export async function createJiraOAuthService(): Promise<JiraOAuthService | null> {
  // Import storage dynamically to avoid circular dependencies
  const { storage } = await import('../storage');
  
  const clientIdSetting = await storage.getAppSetting("JIRA_OAUTH_CLIENT_ID");
  const clientSecretSetting = await storage.getAppSetting("JIRA_OAUTH_CLIENT_SECRET");
  
  if (!clientIdSetting?.value || !clientSecretSetting?.value) {
    return null;
  }
  
  // Determine base URL - use deployment domain
  const deploymentDomain = 'jira-time-1.replit.app';
  const customDomain = process.env.REPLIT_CUSTOM_DOMAIN;
  const replId = process.env.REPL_ID;
  const replOwner = process.env.REPL_OWNER;
  const replSlug = process.env.REPL_SLUG;
  
  let hostname: string;
  let baseUrl: string;
  
  if (customDomain) {
    // Use custom domain (for deployment)
    hostname = customDomain;
    baseUrl = `https://${hostname}`;
  } else if (replId && replOwner && replSlug) {
    // Use deployment domain for OAuth callback
    hostname = deploymentDomain;
    baseUrl = `https://${hostname}`;
  } else {
    // Local development
    hostname = 'localhost:5000';
    baseUrl = `http://${hostname}`;
  }
  
  const redirectUri = `${baseUrl}/oauth-callback`;
  
  console.log("OAuth Service Debug:", {
    hostname,
    baseUrl,
    redirectUri,
    deploymentDomain,
    customDomain,
    replId,
    replOwner,
    replSlug,
    isReplit: !!(replId && replOwner && replSlug)
  });
  
  return new JiraOAuthService({
    clientId: clientIdSetting.value,
    clientSecret: clientSecretSetting.value,
    redirectUri,
  });
}