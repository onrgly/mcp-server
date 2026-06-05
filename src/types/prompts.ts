export type PromptStatus = 'draft' | 'active' | 'archived';
export type PromptProvider = 'OpenAI' | 'Gemini' | 'Anthropic' | 'Custom';

export interface ModelSettings {
  provider: PromptProvider;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  responseFormat?: 'text' | 'json_object';
  safetySettings?: Record<string, string>;
  advancedSettings?: Record<string, any>;
}

export interface PromptVersion {
  id: string; // e.g., "v1", "v2", "v3-draft"
  promptId: string;
  systemPrompt: string;
  developerPrompt?: string;
  userPromptTemplate: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  status: 'draft' | 'active' | 'archived';
  modelSettings: ModelSettings;
}

export interface PromptToolBinding {
  toolName: string;
  serverId: string; // server ID
  integrationId: string; // integration ID or name
  description: string;
  inputSchemaSummary: string; // Quick summary string of inputs
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
  policyNotes?: string; // Rules on when to execute or avoid the tool
}

export interface PromptTestCase {
  id: string;
  name: string;
  variables: Record<string, string>; // input variables
  conversation?: { role: 'user' | 'assistant' | 'tool'; content: string; name?: string }[];
  expectedNotes?: string;
  lastRunResult?: 'passed' | 'failed' | 'pending';
  lastRunAt?: string;
  lastRunOutput?: string;
}

export interface PromptDeployment {
  id: string;
  name: string; // WhatsApp Agent, Admin Copilot, etc.
  environment: 'production' | 'staging' | 'dev';
  lastUsedAt?: string;
  callCount: number;
  errorRate?: number;
}

export interface PromptRecord {
  id: string;
  name: string;
  description: string;
  role: string; // Category or persona: e.g. "System Administrator", "AI Operations Engineer", "Prompt Maintainer"
  status: PromptStatus;
  activeVersionId: string;
  draftVersionId?: string; // Optional draft version
  provider: PromptProvider;
  defaultModel: string;
  attachedToolsCount: number;
  updatedAt: string;
  owner: string;
  versions: PromptVersion[];
  tools: PromptToolBinding[];
  testCases: PromptTestCase[];
  deployments: PromptDeployment[];
  unsavedChanges?: boolean;
}
