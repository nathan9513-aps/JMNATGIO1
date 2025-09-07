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

    return `${this.baseAuthUrl}/authorize?${params.toString()}`;
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

// Create OAuth service instance
export function createJiraOAuthService(): JiraOAuthService {
  const config = {
    clientId: process.env.JIRA_OAUTH_CLIENT_ID!,
    clientSecret: process.env.JIRA_OAUTH_CLIENT_SECRET!,
    redirectUri: process.env.JIRA_OAUTH_REDIRECT_URI!,
  };

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('Jira OAuth configuration is incomplete. Please configure JIRA_OAUTH_CLIENT_ID, JIRA_OAUTH_CLIENT_SECRET, and JIRA_OAUTH_REDIRECT_URI environment variables.');
  }

  return new JiraOAuthService(config);
}