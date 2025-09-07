interface JiraConfig {
  domain: string;
  username: string;
  apiToken: string;
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

export class JiraService {
  private config: JiraConfig;
  private baseUrl: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `https://${config.domain}.atlassian.net/rest/api/3`;
  }

  private getAuthHeader(): string {
    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64');
    return `Basic ${auth}`;
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

export function createJiraService(config: JiraConfig): JiraService {
  return new JiraService(config);
}
