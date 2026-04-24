export type AuthType = 'none' | 'api_key' | 'bearer' | 'oauth2';
export type IntegrationStatus = 'enabled' | 'disabled' | 'error';
export type ValidationStatus = 'passed' | 'failed' | 'pending';

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint?: string;
  handler?: string; // 'api', 'internal:xxx', 'mcp-remote', or Webhook URL
  parameters?: MCPParameter[];
  inputSchema?: any; // JSON Schema object
  responseFields?: string[]; // Dot notation fields to extract
  enabled: boolean;
  logs?: boolean;
  createdAt?: string;
  modifiedAt?: string;
  _remoteName?: string; // Original name for MCP Remote tools
  schemaSource?: 'json' | 'builder';
}

export interface MCPParameter {
  name: string;
  in: 'path' | 'query' | 'body' | 'header' | 'formData';
  type: string;
  description?: string;
  required: boolean;
  nullable?: boolean;
  enumValues?: string[];
  itemsType?: string; // for arrays
  items?: any; // for nested objects/arrays
  properties?: MCPParameter[]; // for recursive object builder
}

export interface MCPAuth {
  type: AuthType;
  baseUrl?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  apiKeyIn?: 'header' | 'query';
  bearerToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  tokenUrl?: string;
  authHeaderPrefix?: string;
  accessToken?: string | null;
  accessTokenExpiry?: number | null;
}

export interface MCPIntegration {
  id: string;
  name: string;
  icon?: string;
  description: string;
  status: IntegrationStatus;
  enabled: boolean;
  auth?: MCPAuth;
  toolCount: number;
  updatedAt: string;
  createdAt?: string;
  tools: MCPTool[];
  mcpRemote?: {
    serverUrl: string;
    toolPrefix: string;
    lastDiscoveredAt?: string;
    serverInfo?: any;
    protocolVersion?: string;
  };
  defaultHeaders?: Record<string, string>;
  pruneEmptyRequestOptionals?: boolean;
  customAuthRewrite?: any;
}

export interface MCPServer {
  id: string;
  name: string;
  key: string; // UUID for connection
  integrationIds: string[];
  toolFilter?: Record<string, string[]>;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AppState {
  integrations: MCPIntegration[];
  servers: MCPServer[];
  lastSyncedAt: string | null;
}
