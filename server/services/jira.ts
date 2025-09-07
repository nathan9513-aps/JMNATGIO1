interface JiraConfig {
  domain?: string;
  username?: string;
  apiToken?: string;
  // OAuth fields
  accessToken?: string;
  siteId?: string;
  authType?: 'basic' | 'oauth';
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    issuetype: {
      name: string;
    };
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    project: {
      key: string;
      name: string;
    };
  };
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

interface WorklogRequest {
  timeSpent: string;
  comment: string;
  started: string;
}

interface WorklogResponse {
  id: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment: string;
  started: string;
  author: {
    displayName: string;
    emailAddress: string;
  };
}

interface CommentRequest {
  body: string;
  visibility?: {
    type: string;
    value: string;
  };
}

interface CommentResponse {
  id: string;
  body: string;
  author: {
    displayName: string;
    emailAddress: string;
  };
  created: string;
  updated: string;
}

interface TransitionRequest {
  transition: {
    id: string;
  };
  comment?: {
    body: string;
  };
}

interface IssueUpdateRequest {
  fields?: {
    summary?: string;
    description?: string;
    assignee?: { id: string };
    labels?: string[];
    priority?: { id: string };
    [key: string]: any;
  };
  transition?: {
    id: string;
  };
}

interface IssueCreateRequest {
  fields: {
    project: { key: string };
    summary: string;
    description?: string;
    issuetype: { name: string };
    assignee?: { id: string };
    priority?: { name: string };
    labels?: string[];
    [key: string]: any;
  };
}

export class JiraService {
  private config: JiraConfig;
  private baseUrl: string;

  constructor(config?: JiraConfig) {
    // Use environment variables if no config provided
    this.config = config || {
      domain: process.env.JIRA_DOMAIN,
      username: process.env.JIRA_USERNAME,
      apiToken: process.env.JIRA_API_TOKEN,
      accessToken: process.env.JIRA_OAUTH_ACCESS_TOKEN,
      siteId: process.env.JIRA_SITE_ID,
      authType: process.env.JIRA_AUTH_TYPE as 'basic' | 'oauth' || 'basic'
    };
    
    // Check OAuth first, then fallback to basic auth
    if (this.config.authType === 'oauth') {
      if (!this.config.accessToken || !this.config.siteId) {
        throw new Error('Jira OAuth configuration is incomplete. Please configure JIRA_OAUTH_ACCESS_TOKEN and JIRA_SITE_ID environment variables.');
      }
      this.baseUrl = `https://api.atlassian.com/ex/jira/${this.config.siteId}/rest/api/3`;
    } else {
      if (!this.config.domain || !this.config.username || !this.config.apiToken) {
        throw new Error('Jira configuration is incomplete. Please configure JIRA_DOMAIN, JIRA_USERNAME, and JIRA_API_TOKEN environment variables.');
      }
      this.baseUrl = `https://${this.config.domain}.atlassian.net/rest/api/3`;
    }
  }

  private getAuthHeader(): string {
    if (this.config.authType === 'oauth' && this.config.accessToken) {
      return `Bearer ${this.config.accessToken}`;
    } else {
      const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64');
      return `Basic ${auth}`;
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API error (${response.status}): ${errorText}`);
    }

    return response.json() as T;
  }

  async searchIssues(query: string, maxResults: number = 50): Promise<JiraIssue[]> {
    const jql = query.includes('=') ? query : `text ~ "${query}" OR key = "${query.toUpperCase()}"`;
    const response = await this.makeRequest<{ issues: JiraIssue[] }>('/search', {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults,
        fields: ['summary', 'issuetype', 'status', 'assignee', 'project'],
      }),
    });

    return response.issues;
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.makeRequest<JiraIssue>(`/issue/${issueKey}?fields=summary,issuetype,status,assignee,project`);
  }

  async getProjects(): Promise<JiraProject[]> {
    return this.makeRequest<JiraProject[]>('/project');
  }

  async addWorklog(issueKey: string, worklog: WorklogRequest): Promise<WorklogResponse> {
    return this.makeRequest<WorklogResponse>(`/issue/${issueKey}/worklog`, {
      method: 'POST',
      body: JSON.stringify(worklog),
    });
  }

  async updateWorklog(issueKey: string, worklogId: string, worklog: WorklogRequest): Promise<WorklogResponse> {
    return this.makeRequest<WorklogResponse>(`/issue/${issueKey}/worklog/${worklogId}`, {
      method: 'PUT',
      body: JSON.stringify(worklog),
    });
  }

  async deleteWorklog(issueKey: string, worklogId: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/worklog/${worklogId}`, {
      method: 'DELETE',
    });
  }

  async getWorklogs(issueKey: string): Promise<WorklogResponse[]> {
    const response = await this.makeRequest<{ worklogs: WorklogResponse[] }>(`/issue/${issueKey}/worklog`);
    return response.worklogs;
  }

  async updateIssue(issueKey: string, updateData: IssueUpdateRequest): Promise<any> {
    return this.makeRequest(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async createIssue(issueData: IssueCreateRequest): Promise<JiraIssue> {
    return this.makeRequest<JiraIssue>('/issue', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  }

  async getIssueTransitions(issueKey: string): Promise<any[]> {
    const response = await this.makeRequest<{ transitions: any[] }>(`/issue/${issueKey}/transitions`);
    return response.transitions;
  }

  async getIssueTypes(projectKey: string): Promise<any[]> {
    const response = await this.makeRequest<any[]>(`/issue/createmeta/${projectKey}/issuetypes`);
    return response;
  }

  // Comments
  async addComment(issueKey: string, comment: CommentRequest): Promise<CommentResponse> {
    return this.makeRequest<CommentResponse>(`/issue/${issueKey}/comment`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  async getComments(issueKey: string): Promise<CommentResponse[]> {
    const response = await this.makeRequest<{ comments: CommentResponse[] }>(`/issue/${issueKey}/comment`);
    return response.comments;
  }

  async updateComment(issueKey: string, commentId: string, comment: CommentRequest): Promise<CommentResponse> {
    return this.makeRequest<CommentResponse>(`/issue/${issueKey}/comment/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(comment),
    });
  }

  async deleteComment(issueKey: string, commentId: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/comment/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Transitions
  async transitionIssue(issueKey: string, transitionData: TransitionRequest): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify(transitionData),
    });
  }

  static formatTimeSpent(durationSeconds: number): string {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '1m'; // Minimum 1 minute
    }
  }

  static parseTimeSpent(timeSpent: string): number {
    const hourMatch = timeSpent.match(/(\d+)h/);
    const minuteMatch = timeSpent.match(/(\d+)m/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    return hours * 3600 + minutes * 60;
  }
}

export function createJiraService(config?: JiraConfig): JiraService {
  return new JiraService(config);
}
