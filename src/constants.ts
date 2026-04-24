import { MCPIntegration } from "./types";

export const MOCK_INTEGRATIONS: any[] = [
  {
    id: "int_01",
    name: "GitHub API",
    description: "Full integration with GitHub REST API for repository management and issue tracking.",
    status: "enabled",
    enabled: true,
    toolCount: 12,
    updatedAt: "2024-03-20T14:30:00Z",
    tools: []
  },
  {
    id: "int_02",
    name: "Slack Webhooks",
    description: "Send notifications and messages to Slack channels via incoming webhooks.",
    status: "enabled",
    enabled: true,
    toolCount: 4,
    updatedAt: "2024-03-19T09:15:00Z",
    tools: []
  },
  {
    id: "int_03",
    name: "Stripe Connect",
    description: "Manage payments, customers, and subscriptions through the Stripe API.",
    status: "disabled",
    enabled: false,
    toolCount: 8,
    updatedAt: "2024-03-18T16:45:00Z",
    tools: []
  }
];
