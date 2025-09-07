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
    const response = await fetch(`${this.baseAuthUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth token exchange failed: ${errorText}`);
    }

    return response.json();
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<JiraOAuthTokens> {
    const response = await fetch(`${this.baseAuthUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    return response.json();
  }

  // Get accessible Jira sites for the user
  async getAccessibleResources(accessToken: string): Promise<JiraAccessibleResource[]> {
    const response = await fetch(`${this.baseApiUrl}/oauth/token/accessible-resources`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get accessible resources: ${errorText}`);
    }

    return response.json();
  }

  // Get user information
  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseApiUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user info: ${errorText}`);
    }

    return response.json();
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
  
  // Determine base URL - check if we're in a Replit environment
  const replId = process.env.REPL_ID;
  const replOwner = process.env.REPL_OWNER;
  const replSlug = process.env.REPL_SLUG;
  
  let hostname: string;
  let baseUrl: string;
  
  if (replId && replOwner && replSlug) {
    // Replit environment - use the proper replit.dev domain
    hostname = `${replSlug}.${replOwner}.repl.co`;
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