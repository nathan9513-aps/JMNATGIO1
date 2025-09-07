interface FileMakerConfig {
  host: string;
  database: string;
  username: string;
  password: string;
}

interface FileMakerClient {
  id: string;
  name: string;
  description?: string;
  contactEmail?: string;
  isActive: boolean;
}

interface FileMakerAuthResponse {
  response: {
    token: string;
  };
}

interface FileMakerDataResponse<T> {
  response: {
    data: T[];
  };
}

export class FileMakerService {
  private config: FileMakerConfig;
  private baseUrl: string;
  private token: string | null = null;

  constructor(config: FileMakerConfig) {
    this.config = config;
    this.baseUrl = `https://${config.host}/fmi/data/v1/databases/${config.database}`;
  }

  private async authenticate(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FileMaker authentication error (${response.status}): ${errorText}`);
    }

    const authData = await response.json() as FileMakerAuthResponse;
    this.token = authData.response.token;
    return this.token;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, clear and retry
      this.token = null;
      return this.makeRequest(endpoint, options);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FileMaker API error (${response.status}): ${errorText}`);
    }

    return response.json() as T;
  }

  async getClients(layout: string = 'clients'): Promise<FileMakerClient[]> {
    try {
      const response = await this.makeRequest<FileMakerDataResponse<{ fieldData: any }>>(`/layouts/${layout}/records`);
      
      return response.response.data.map(record => ({
        id: record.fieldData.id || record.fieldData.ID || record.fieldData.recordId,
        name: record.fieldData.name || record.fieldData.Name || record.fieldData.client_name,
        description: record.fieldData.description || record.fieldData.Description,
        contactEmail: record.fieldData.contactEmail || record.fieldData.contact_email || record.fieldData.email,
        isActive: record.fieldData.isActive !== false && record.fieldData.is_active !== false,
      }));
    } catch (error) {
      console.error('FileMaker getClients error:', error);
      throw new Error(`Failed to fetch clients from FileMaker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getClient(clientId: string, layout: string = 'clients'): Promise<FileMakerClient | null> {
    try {
      const response = await this.makeRequest<FileMakerDataResponse<{ fieldData: any }>>(
        `/layouts/${layout}/records?_find.id=${clientId}`
      );
      
      if (response.response.data.length === 0) {
        return null;
      }

      const record = response.response.data[0];
      return {
        id: record.fieldData.id || record.fieldData.ID || record.fieldData.recordId,
        name: record.fieldData.name || record.fieldData.Name || record.fieldData.client_name,
        description: record.fieldData.description || record.fieldData.Description,
        contactEmail: record.fieldData.contactEmail || record.fieldData.contact_email || record.fieldData.email,
        isActive: record.fieldData.isActive !== false && record.fieldData.is_active !== false,
      };
    } catch (error) {
      console.error('FileMaker getClient error:', error);
      return null;
    }
  }

  async createClient(client: Omit<FileMakerClient, 'id'>, layout: string = 'clients'): Promise<FileMakerClient> {
    try {
      const response = await this.makeRequest<{ response: { recordId: string } }>(`/layouts/${layout}/records`, {
        method: 'POST',
        body: JSON.stringify({
          fieldData: {
            name: client.name,
            description: client.description || '',
            contactEmail: client.contactEmail || '',
            isActive: client.isActive,
          },
        }),
      });

      return {
        id: response.response.recordId,
        ...client,
      };
    } catch (error) {
      console.error('FileMaker createClient error:', error);
      throw new Error(`Failed to create client in FileMaker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateClient(clientId: string, client: Partial<FileMakerClient>, layout: string = 'clients'): Promise<FileMakerClient> {
    try {
      await this.makeRequest(`/layouts/${layout}/records/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fieldData: {
            ...(client.name && { name: client.name }),
            ...(client.description !== undefined && { description: client.description }),
            ...(client.contactEmail !== undefined && { contactEmail: client.contactEmail }),
            ...(client.isActive !== undefined && { isActive: client.isActive }),
          },
        }),
      });

      // Return updated client
      const updatedClient = await this.getClient(clientId, layout);
      if (!updatedClient) {
        throw new Error('Client not found after update');
      }
      return updatedClient;
    } catch (error) {
      console.error('FileMaker updateClient error:', error);
      throw new Error(`Failed to update client in FileMaker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteClient(clientId: string, layout: string = 'clients'): Promise<boolean> {
    try {
      await this.makeRequest(`/layouts/${layout}/records/${clientId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('FileMaker deleteClient error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.makeRequest(`/sessions/${this.token}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('FileMaker logout error:', error);
      } finally {
        this.token = null;
      }
    }
  }
}

export function createFileMakerService(config: FileMakerConfig): FileMakerService {
  return new FileMakerService(config);
}
