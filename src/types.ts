export type AuthType = 'none' | 'api-key' | 'oauth2' | 'bearer-token';
export type IntegrationStatus = 'enabled' | 'disabled' | 'error';
export type ValidationStatus = 'passed' | 'failed' | 'pending';

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  parameters: MCPParameter[];
  inputSchema: string; // JSON string
  enabled: boolean;
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

export interface MCPIntegration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  authType: AuthType;
  toolCount: number;
  updatedAt: string;
  serverUrl: string;
  config: Record<string, any>;
  tools: MCPTool[];
}

export interface AppState {
  integrations: MCPIntegration[];
  lastSyncedAt: string | null;
  validationStatus: ValidationStatus;
}
