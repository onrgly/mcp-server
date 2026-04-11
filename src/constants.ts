import { MCPIntegration } from "./types";

export const MOCK_INTEGRATIONS: MCPIntegration[] = [
  {
    id: "int_01",
    name: "GitHub API",
    description: "Full integration with GitHub REST API for repository management and issue tracking.",
    status: "enabled",
    authType: "oauth2",
    toolCount: 12,
    updatedAt: "2024-03-20T14:30:00Z",
    serverUrl: "https://api.github.com",
    config: {
      clientId: "gh_client_123",
      scopes: ["repo", "user"]
    },
    tools: [
      {
        id: "tool_01",
        name: "list_repositories",
        description: "Lists repositories for the authenticated user.",
        method: "GET",
        endpoint: "/user/repos",
        parameters: [],
        inputSchema: JSON.stringify({
          type: "object",
          properties: {
            visibility: { type: "string", enum: ["all", "public", "private"] }
          }
        }, null, 2),
        enabled: true
      }
    ]
  },
  {
    id: "int_02",
    name: "Slack Webhooks",
    description: "Send notifications and messages to Slack channels via incoming webhooks.",
    status: "enabled",
    authType: "bearer-token",
    toolCount: 4,
    updatedAt: "2024-03-19T09:15:00Z",
    serverUrl: "https://hooks.slack.com",
    config: {
      token: "xoxb-..."
    },
    tools: []
  },
  {
    id: "int_03",
    name: "Stripe Connect",
    description: "Manage payments, customers, and subscriptions through the Stripe API.",
    status: "disabled",
    authType: "api-key",
    toolCount: 8,
    updatedAt: "2024-03-18T16:45:00Z",
    serverUrl: "https://api.stripe.com/v1",
    config: {},
    tools: []
  }
];
