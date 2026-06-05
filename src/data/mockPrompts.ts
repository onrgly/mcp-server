import { PromptRecord } from "@/types/prompts";

export const INITIAL_PROMPTS: PromptRecord[] = [
  {
    id: "whatsapp-support-router",
    name: "WhatsApp Support Desk Router",
    description: "Automated routing prompt for incoming WhatsApp customer messages. Determines intent and executes reservations lookup.",
    role: "AI Operations Engineers",
    status: "active",
    activeVersionId: "v2",
    provider: "OpenAI",
    defaultModel: "gpt-4o",
    attachedToolsCount: 2,
    updatedAt: "2026-06-04T12:00:00Z",
    owner: "onurgulay@gmail.com",
    versions: [
      {
        id: "v1",
        promptId: "whatsapp-support-router",
        systemPrompt: "You are an automated support router for Smile Center Turkey. Your goal is to guide patients.",
        userPromptTemplate: "Please greet the client. Message: {{incoming_message}}",
        changelog: "Initial prompt setup",
        publishedAt: "2026-05-10T09:00:00Z",
        publishedBy: "OG",
        status: "archived",
        modelSettings: {
          provider: "OpenAI",
          model: "gpt-4-turbo",
          temperature: 0.3,
          maxOutputTokens: 500
        }
      },
      {
        id: "v2",
        promptId: "whatsapp-support-router",
        systemPrompt: "You are the primary WhatsApp Router Agent for the clinic. Keep answers short (under 3 sentences). Utilize active tools to lookup bookings before responding. Be helpful, professional, and empathetic.",
        developerPrompt: "Focus on dentist booking intents and filter out unsolicited spam messages or junk queries.",
        userPromptTemplate: "New patient message received:\nName: {{customer_name}}\nMessage: {{incoming_message}}\n\nPlease evaluate and respond carefully. Use tools if patient asks about an existing reservation.",
        changelog: "Updated prompt behavior to restrict output to short paragraphs and enforce tool guidelines.",
        publishedAt: "2026-06-01T15:30:00Z",
        publishedBy: "OG",
        status: "active",
        modelSettings: {
          provider: "OpenAI",
          model: "gpt-4o",
          temperature: 0.2,
          maxOutputTokens: 400,
          responseFormat: "text"
        }
      }
    ],
    tools: [
      {
        toolName: "lookup_booking",
        serverId: "clinic-core-server",
        integrationId: "Smile_Clinic",
        description: "Returns existing patient booking reservations using telephone/name matching lookup index.",
        inputSchemaSummary: "phone_number (string, required), patient_name (string)",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        policyNotes: "Always lookup whenever the user asks 'where is my clinic details' or 'what time is my appointment'. Avoid querying duplicate names."
      },
      {
        toolName: "update_booking_notes",
        serverId: "clinic-core-server",
        integrationId: "Smile_Clinic",
        description: "Appends medical history notes or schedule comments to a specific booking record.",
        inputSchemaSummary: "booking_id (string, required), notes (string, required)",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
        policyNotes: "Only invoke when the patient explicitly requests to append specific clinical directions, allergies, or travel preferences. Do not write diagnostic speculation."
      }
    ],
    testCases: [
      {
        id: "tc-1",
        name: "Standard Booking Greeting",
        variables: {
          customer_name: "John Doe",
          incoming_message: "Hello! I want to confirm if my dental crown appointment is booked for tomorrow at 2 PM?"
        },
        expectedNotes: "The model should use the lookup_booking tool since the message inquiries about an existing appointment.",
        lastRunResult: "passed",
        lastRunAt: "2026-06-04T10:15:00Z",
        lastRunOutput: "Thinking trace: User wants to check appointment.\nTool Call lookup_booking(phone_number: 'N/A', patient_name: 'John Doe')"
      },
      {
        id: "tc-2",
        name: "Spam / Greeting query",
        variables: {
          customer_name: "SpamBot",
          incoming_message: "Get cheap backlinks to your clinic site click here!"
        },
        expectedNotes: "Should politely defer or ignore, zero tool calls expected.",
        lastRunResult: "pending"
      }
    ],
    deployments: [
      {
        id: "dep-1",
        name: "WhatsApp Twilio Webhook Integration",
        environment: "production",
        lastUsedAt: "2026-06-05T18:30:00Z",
        callCount: 1450,
        errorRate: 0.05
      },
      {
        id: "dep-2",
        name: "Internal Staff Console Sandbox",
        environment: "dev",
        lastUsedAt: "2026-06-04T16:00:00Z",
        callCount: 120,
        errorRate: 0.0
      }
    ]
  },
  {
    id: "system-status-monitor",
    name: "System Diagnostics & Alert Monitor",
    description: "Evaluates raw hardware logs and database health parameters, formats incident descriptions for Slack pipelines.",
    role: "System Administrators",
    status: "active",
    activeVersionId: "v1",
    provider: "Gemini",
    defaultModel: "gemini-2.5-flash",
    attachedToolsCount: 1,
    updatedAt: "2026-06-03T09:45:00Z",
    owner: "onurgulay@gmail.com",
    versions: [
      {
        id: "v1",
        promptId: "system-status-monitor",
        systemPrompt: "You are a senior DevOps diagnostic assistant. Analyze the incoming error telemetry. Categorize severity (LOW, MEDIUM, HIGH, CRITICAL). Use active tools to retrieve auxiliary server stats.",
        userPromptTemplate: "Telemetry Payload:\n{{server_telemetry_payload}}\n\nPlease analyze, pinpoint potential database bottlenecks, and offer structured resolution steps.",
        changelog: "Base release for automatic warning reports.",
        publishedAt: "2026-06-02T11:00:00Z",
        publishedBy: "OG",
        status: "active",
        modelSettings: {
          provider: "Gemini",
          model: "gemini-2.5-flash",
          temperature: 0.1,
          maxOutputTokens: 800,
          responseFormat: "json_object"
        }
      }
    ],
    tools: [
      {
        toolName: "get_server_metrics",
        serverId: "devops-utility-server",
        integrationId: "DevOps_Core",
        description: "Returns CPU load, virtual memory pressure, and filesystem IO metrics for virtual containers.",
        inputSchemaSummary: "server_id (string, required), metric_window (string)",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        policyNotes: "Required helper to query server logs whenever server_telemetry_payload points to high thread pools."
      }
    ],
    testCases: [
      {
        id: "tc-3",
        name: "Disk Full Alert Evaluation",
        variables: {
          server_telemetry_payload: "CRITICAL: Partition /var/lib/docker reached 98% capacity on replica-node-04"
        },
        expectedNotes: "Should output JSON object flagging severity as CRITICAL, suggesting log rotation or volume expansion.",
        lastRunResult: "passed",
        lastRunAt: "2026-06-03T18:20:00Z",
        lastRunOutput: "{\n  \"severity\": \"CRITICAL\",\n  \"incident_identified\": \"Docker filesystem capacity exhausted\",\n  \"action_items\": [\"docker system prune\", \"trigger disk expansion\"]\n}"
      }
    ],
    deployments: [
      {
        id: "dep-3",
        name: "DevOps Slack Alert Webhook",
        environment: "production",
        lastUsedAt: "2026-06-05T17:01:00Z",
        callCount: 3100,
        errorRate: 0.01
      }
    ]
  },
  {
    id: "invoice-pdf-reviewer",
    name: "Patient Invoice PDF Reviewer",
    description: "Evaluates patient billing logs against hospital coverage tables, checks for double-billing or tax miscalculations.",
    role: "Prompt Maintainers",
    status: "draft",
    activeVersionId: "v1",
    provider: "Anthropic",
    defaultModel: "claude-3-5-sonnet",
    attachedToolsCount: 1,
    updatedAt: "2026-06-05T08:12:00Z",
    owner: "onurgulay@gmail.com",
    versions: [
      {
        id: "v1",
        promptId: "invoice-pdf-reviewer",
        systemPrompt: "You are an insurance claim auditor. Inspect the parsed bill lines. Highlight items whose pricing exceeds normal ranges.",
        userPromptTemplate: "Bill details:\n{{invoice_json_payload}}\n\nReference limits:\n{{coverage_bounds}}",
        changelog: "First draft",
        publishedAt: "2026-06-05T08:10:00Z",
        publishedBy: "OG",
        status: "active",
        modelSettings: {
          provider: "Anthropic",
          model: "claude-3-5-sonnet",
          temperature: 0.0,
          maxOutputTokens: 1000
        }
      }
    ],
    tools: [
      {
        toolName: "purge_invoice",
        serverId: "clinic-billing-server",
        integrationId: "Smile_Clinic",
        description: "Deletes a billing record permanently from regional databases to allow corrections.",
        inputSchemaSummary: "invoice_id (string, required)",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
        policyNotes: "CRITICAL WARNING: This completely deletes invoice rows. NEVER call unless patient specifically requested full cancellation and audit trace is logged."
      }
    ],
    testCases: [],
    deployments: []
  }
];
export const AVAILABLE_MODELS_BY_PROVIDER = {
  OpenAI: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"],
  Gemini: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
  Anthropic: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
  Custom: ["llama-3.3-70b-instruct", "deepseek-v3", "custom-model"]
};
