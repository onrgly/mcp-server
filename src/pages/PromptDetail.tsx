import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Trash2, 
  Copy, 
  Save, 
  Check, 
  Play, 
  AlertTriangle, 
  CornerDownRight, 
  FileText, 
  Clock, 
  User, 
  ShieldAlert, 
  Settings, 
  Database, 
  Plus, 
  Cpu, 
  Terminal, 
  Flame, 
  Paperclip, 
  RefreshCw, 
  ChevronRight, 
  Eye, 
  Sliders, 
  History, 
  CheckCircle, 
  Sparkles,
  Bookmark,
  ExternalLink,
  Info
} from "lucide-react";
import { useMCP } from "@/context/MCPContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  PromptRecord, 
  PromptVersion, 
  PromptToolBinding, 
  PromptTestCase, 
  ModelSettings,
  PromptProvider 
} from "@/types/prompts";
import { AVAILABLE_MODELS_BY_PROVIDER } from "@/data/mockPrompts";

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  const { integrations } = useMCP();
  
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [prompt, setPrompt] = useState<PromptRecord | null>(null);
  
  // Working draft inputs (stored temporarily, allows "Discard" vs "Save Draft")
  const [draftSystemPrompt, setDraftSystemPrompt] = useState("");
  const [draftDeveloperPrompt, setDraftDeveloperPrompt] = useState("");
  const [draftUserPrompt, setDraftUserPrompt] = useState("");
  const [draftChangelog, setDraftChangelog] = useState("Updated prompt draft draft parameters");
  
  // Model settings draft inputs
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    provider: "OpenAI",
    model: "gpt-4o",
    temperature: 0.3,
    maxOutputTokens: 800,
  });

  // Playground workspace parameters
  const [playgroundVariables, setPlaygroundVariables] = useState<Record<string, string>>({});
  const [playgroundMessages, setPlaygroundMessages] = useState<{ role: 'user' | 'assistant' | 'tool'; content: string }[]>([]);
  const [composerMessage, setComposerMessage] = useState("");
  const [playgroundExecutionModel, setPlaygroundExecutionModel] = useState<string>("active"); // "active" or "custom-v1/v2"
  const [runWithToolsExec, setRunWithToolsExec] = useState(false); // Dry-run by default
  const [lastPlaygroundRun, setLastPlaygroundRun] = useState<{
    responseText: string;
    metrics: { inputTokens: number; outputTokens: number; totalTokens: number; costEstimate: number; latencyMs: number };
    rawRequestPayload: any;
    rawResponsePayload: any;
  } | null>(null);
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);

  // Tools Selection search inside bindings sheet
  const [searchToolQuery, setSearchToolQuery] = useState("");
  const [isToolSheetOpen, setIsToolSheetOpen] = useState(false);
  const [selectedToolPolicyNote, setSelectedToolPolicyNote] = useState("");

  // Diff comparison states
  const [diffBaseVerId, setDiffBaseVerId] = useState("v1");
  const [diffCompareVerId, setDiffCompareVerId] = useState("");

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem("mcp_admin_prompts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPrompts(parsed);
        const found = parsed.find((p: PromptRecord) => p.id === id);
        if (found) {
          setPrompt(found);
          initializeDraftValues(found);
        } else {
          toast.error("Prompt record not found in registry");
          navigate("/prompts");
        }
      } catch (err) {
        toast.error("Corrupted prompts data storage");
      }
    }
  }, [id, navigate]);

  const initializeDraftValues = (record: PromptRecord) => {
    // Determine active target version to load
    const activeVer = record.versions.find(v => v.id === record.activeVersionId) || record.versions[0];
    if (activeVer) {
      setDraftSystemPrompt(activeVer.systemPrompt);
      setDraftDeveloperPrompt(activeVer.developerPrompt || "");
      setDraftUserPrompt(activeVer.userPromptTemplate);
      setModelSettings(activeVer.modelSettings);
      
      // Seed test variables with {{placeholder}} values
      detectVariablesInTemplate(activeVer.userPromptTemplate);
    }
  };

  const detectVariablesInTemplate = (template: string) => {
    const rx = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
    let match;
    const detected: Record<string, string> = {};
    while ((match = rx.exec(template)) !== null) {
      detected[match[1]] = playgroundVariables[match[1]] || "";
    }
    setPlaygroundVariables(detected);
  };

  const handleApplyDraftUserPromptChange = (val: string) => {
    setDraftUserPrompt(val);
    detectVariablesInTemplate(val);
    markChangesUnsaved();
  };

  const markChangesUnsaved = () => {
    if (prompt && !prompt.unsavedChanges) {
      setPrompt(prev => prev ? { ...prev, unsavedChanges: true } : null);
    }
  };

  const handleUpdateStorage = (updatedRecord: PromptRecord) => {
    const updatedList = prompts.map(p => p.id === updatedRecord.id ? updatedRecord : p);
    setPrompts(updatedList);
    setPrompt(updatedRecord);
    localStorage.setItem("mcp_admin_prompts", JSON.stringify(updatedList));
  };

  // Discard local edits
  const handleDiscardChanges = () => {
    if (confirm("Discard all draft edits made since yesterday or last publish? This reverts code editor.")) {
      if (prompt) {
        initializeDraftValues(prompt);
        setPrompt(prev => prev ? { ...prev, unsavedChanges: false } : null);
        toast.info("Changes discarded, draft aligned back to active configuration.");
      }
    }
  };

  // Save current edit state as a draft version inside this prompt record
  const handleSaveDraft = () => {
    if (!prompt) return;

    // We can add or update a special vX-draft version or update the draft parameters
    const activeModelSettings = {
      ...modelSettings,
      provider: modelSettings.provider,
      model: modelSettings.model
    };

    const updatedRecord: PromptRecord = {
      ...prompt,
      unsavedChanges: false,
      updatedAt: new Date().toISOString(),
      versions: prompt.versions.map(v => {
        // If we are over-writing draft or active
        if (v.id === prompt.activeVersionId) {
          return {
            ...v,
            systemPrompt: draftSystemPrompt,
            developerPrompt: draftDeveloperPrompt,
            userPromptTemplate: draftUserPrompt,
            modelSettings: activeModelSettings
          };
        }
        return v;
      })
    };

    handleUpdateStorage(updatedRecord);
    toast.success("Draft edits successfully saved into current version context.");
  };

  // Publish a brand new version (requires confirmation and changes changelog tag)
  const handlePublishNewVersion = () => {
    if (!prompt) return;

    const comment = promptDraftChangelogDialog();
    if (!comment) return;

    const newVerNum = `v${prompt.versions.length + 1}`;
    const newVersion: PromptVersion = {
      id: newVerNum,
      promptId: prompt.id,
      systemPrompt: draftSystemPrompt,
      developerPrompt: draftDeveloperPrompt,
      userPromptTemplate: draftUserPrompt,
      changelog: comment,
      publishedAt: new Date().toISOString(),
      publishedBy: "OG",
      status: "active",
      modelSettings: { ...modelSettings }
    };

    // Deactivate previous active versions to archived status
    const archivedVersions = prompt.versions.map(v => ({
      ...v,
      status: (v.status === "active" ? "archived" : v.status) as any
    }));

    const updatedRecord: PromptRecord = {
      ...prompt,
      activeVersionId: newVerNum,
      status: "active",
      unsavedChanges: false,
      updatedAt: new Date().toISOString(),
      versions: [...archivedVersions, newVersion]
    };

    handleUpdateStorage(updatedRecord);
    setIsToolSheetOpen(false);
    toast.success(`Successfully published version ${newVerNum} as production-active!`);
  };

  const promptDraftChangelogDialog = () => {
    const feedback = window.prompt("State production upgrade comment / changelog for version promotion:", draftChangelog);
    if (feedback !== null) {
      setDraftChangelog(feedback);
      return feedback;
    }
    return "";
  };

  // Rollback active status to another past version
  const handleRollbackVersion = (versionId: string) => {
    if (!prompt) return;
    if (!confirm(`Confirm downgrading production active pointer back to version "${versionId}"?`)) {
      return;
    }

    const updatedRecord: PromptRecord = {
      ...prompt,
      activeVersionId: versionId,
      status: "active",
      updatedAt: new Date().toISOString(),
      versions: prompt.versions.map(v => ({
        ...v,
        status: v.id === versionId ? "active" : (v.status === "active" ? "archived" : v.status) as any
      }))
    };

    handleUpdateStorage(updatedRecord);
    initializeDraftValues(updatedRecord);
    toast.success(`Server rolled back active version to ${versionId}. Draft editor synced.`);
  };

  // Relational binding of tools
  const handleAttachTool = (tool: any, serverId: string, integrationId: string) => {
    if (!prompt) return;

    if (prompt.tools.some(t => t.toolName === tool.name && t.serverId === serverId)) {
      toast.warning("This tool is already attached to this prompt!");
      return;
    }

    const newBinding: PromptToolBinding = {
      toolName: tool.name,
      serverId,
      integrationId,
      description: tool.description || "No tool description retrieved.",
      inputSchemaSummary: tool.parameters ? tool.parameters.map((p: any) => `${p.name} (${p.type}${p.required ? '!' : ''})`).join(", ") : "None",
      readOnlyHint: tool.method === "GET" || tool.endpoint?.includes("lookup") || tool.name.includes("get") || tool.name.includes("lookup") || tool.name.includes("search") || tool._readOnly === true,
      destructiveHint: tool.name.includes("delete") || tool.name.includes("purge") || tool.name.includes("remove") || tool.name.includes("cancel"),
      idempotentHint: !(tool.name.includes("create") || tool.name.includes("post") || tool.name.includes("append") || tool.name.includes("charge")),
      openWorldHint: tool.endpoint?.startsWith("http") || tool.handler?.startsWith("http"),
      policyNotes: selectedToolPolicyNote || "Refer to patient record and run checks before calling."
    };

    const updatedRecord: PromptRecord = {
      ...prompt,
      attachedToolsCount: prompt.tools.length + 1,
      tools: [...prompt.tools, newBinding],
      updatedAt: new Date().toISOString()
    };

    handleUpdateStorage(updatedRecord);
    setSelectedToolPolicyNote("");
    toast.success(`MCP Tool "${tool.name}" bound into prompt context.`);
  };

  const handleDetachTool = (toolName: string, serverId: string) => {
    if (!prompt) return;

    const updatedRecord: PromptRecord = {
      ...prompt,
      attachedToolsCount: Math.max(0, prompt.tools.length - 1),
      tools: prompt.tools.filter(t => !(t.toolName === toolName && t.serverId === serverId)),
      updatedAt: new Date().toISOString()
    };

    handleUpdateStorage(updatedRecord);
    toast.info(`MCP Tool "${toolName}" detached.`);
  };

  // Run Playground API call
  const handleExecuteInPlayground = async () => {
    if (!prompt) return;

    setIsRunningPlayground(true);
    setLastPlaygroundRun(null);

    const activeBoundTools = runWithToolsExec ? prompt.tools : [];

    try {
      const res = await fetch("/api/playground-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: draftSystemPrompt,
          developerPrompt: draftDeveloperPrompt,
          userPrompt: draftUserPrompt,
          messages: playgroundMessages,
          settings: modelSettings,
          tools: activeBoundTools,
          variables: playgroundVariables
        })
      });

      const data = await res.json();
      if (data.ok) {
        setLastPlaygroundRun({
          responseText: data.responseText,
          metrics: data.metrics,
          rawRequestPayload: data.rawRequestPayload,
          rawResponsePayload: data.rawResponsePayload
        });
        toast.success("Execution completed!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Model execution failed inside terminal proxy.");
    } finally {
      setIsRunningPlayground(false);
    }
  };

  // Test variables composer triggers
  const handleExecuteWithComposer = () => {
    if (!composerMessage.trim()) return;

    const newMsgs = [
      ...playgroundMessages,
      { role: "user" as const, content: composerMessage }
    ];
    setPlaygroundMessages(newMsgs);
    setComposerMessage("");
    
    // Auto execute simulation pipeline
    setTimeout(() => {
      // Trigger execution incorporating history
      handleExecuteInPlayground();
    }, 100);
  };

  const handleLoadTestCase = (tc: PromptTestCase) => {
    setPlaygroundVariables(tc.variables);
    setPlaygroundMessages([]);
    setLastPlaygroundRun(null);
    toast.info(`Test case "${tc.name}" variables loaded into variables board!`);
  };

  const handleSaveAsTestCase = () => {
    if (!prompt) return;
    const name = window.prompt("Enter a unique name for this saved Test Case:", `Evaluation Case ${prompt.testCases.length + 1}`);
    if (!name) return;

    const newTest: PromptTestCase = {
      id: `tc-eval-${Date.now()}`,
      name,
      variables: { ...playgroundVariables },
      expectedNotes: "Evaluation results to check criteria bounds.",
      lastRunResult: "pending"
    };

    const updatedRecord: PromptRecord = {
      ...prompt,
      testCases: [...prompt.testCases, newTest],
      updatedAt: new Date().toISOString()
    };

    handleUpdateStorage(updatedRecord);
    toast.success(`Saved "${name}" as a prompt evaluation asset.`);
  };

  if (!prompt) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Loading internal operations workbench...</p>
      </div>
    );
  }

  // Find all tools from integrated server endpoints to attach
  const allAvailableToolsRegistry: { tool: any; server: any; integrationName: string }[] = [];
  integrations.forEach(integration => {
    if (integration.tools) {
      integration.tools.forEach(tool => {
        allAvailableToolsRegistry.push({
          tool,
          server: { id: integration.id, name: integration.name },
          integrationName: integration.name
        });
      });
    }
  });

  const filteredRegisterTools = allAvailableToolsRegistry.filter(item => 
    item.tool.name.toLowerCase().includes(searchToolQuery.toLowerCase()) ||
    item.integrationName.toLowerCase().includes(searchToolQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back and title bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div className="space-y-1.5 flex-1">
          <Link to="/prompts" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-1 select-none">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to prompt templates registry
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="capitalize text-muted-foreground">{prompt.id}</span>
              <span className="text-border">/</span>
              {prompt.name}
            </h1>
            <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", prompt.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/10")}>
              {prompt.status}
            </Badge>
            {prompt.unsavedChanges && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-bold uppercase animate-pulse">
                Unsaved Edits
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{prompt.description}</p>
        </div>

        {/* Saved Indicators Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {prompt.unsavedChanges && (
            <>
              <Button variant="outline" size="sm" className="h-9 font-medium text-xs text-muted-foreground border-border cursor-pointer hover:bg-secondary/40" onClick={handleDiscardChanges}>
                Discard Local Draft
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 font-bold text-xs border-primary/20 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10" onClick={handleSaveDraft}>
                <Save className="w-3.5 h-3.5" />
                Save Draft (Active Context)
              </Button>
            </>
          )}

          <Button className="ai-studio-gradient hover:opacity-95 h-9 md:px-4 text-xs font-semibold text-white cursor-pointer shadow-md" onClick={handlePublishNewVersion}>
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Publish New Version
          </Button>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto scroller-hidden">
        {[
          { tab: "overview", label: "Overview & Metrics", icon: Info },
          { tab: "editor", label: "Directives Editor", icon: FileText },
          { tab: "models", label: "Inference Profile", icon: Sliders },
          { tab: "tools", label: "MCP Tools Binding", icon: Database },
          { tab: "playground", label: "Operational Playground", icon: Terminal },
          { tab: "history", label: "Versions System", icon: History },
          { tab: "evals", label: "Evaluations (Test Cases)", icon: CheckCircle }
        ].map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setSearchParams({ tab: item.tab })}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all relative cursor-pointer outline-none whitespace-nowrap",
                isActive 
                  ? "border-primary text-primary font-bold " 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
              {item.tab === "tools" && prompt.tools.length > 0 && (
                <span className="ml-1 text-[9px] px-1 bg-primary/10 text-primary font-bold rounded-full">{prompt.tools.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW */}
        {currentTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Main specifications meta */}
              <Card className="bg-card/40 border-border">
                <CardHeader className="border-b border-secondary/25 py-4">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary" /> General Prompt Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-5 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-secondary/15 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Production Ver</p>
                      <p className="text-lg font-mono font-bold text-foreground mt-0.5">{prompt.activeVersionId}</p>
                    </div>
                    <div className="p-3 bg-secondary/15 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Default Model Group</p>
                      <p className="text-md font-mono font-bold text-primary mt-1 truncate">{prompt.defaultModel}</p>
                    </div>
                    <div className="p-3 bg-secondary/15 rounded-lg col-span-2 md:col-span-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Operations Owner</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{prompt.owner}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 border border-border bg-secondary/10 rounded-xl space-y-1">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 leading-none">
                      <Info className="w-3.5 h-3.5 text-primary" /> Behavioral Role Specification
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This template is managed by <strong>{prompt.role}</strong> and operates as a vendor-neutral prompt. All executions are strictly logged for auditing purposes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Code Usage Snippets */}
              <Card className="bg-card/40 border-border overflow-hidden">
                <CardHeader className="border-b border-secondary/25 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary" /> Production Client Snippet (API Integration)
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-[9px] uppercase">Node.js / SDKv1</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 font-mono text-xs">
                  <pre className="bg-zinc-950 dark:bg-zinc-950 text-zinc-300 p-4 overflow-x-auto text-[11px] leading-relaxed">
{`import { GoogleGenAI } from "@google/genai";

// Load active version system directives safely from the API
const adminPromptId = "${prompt.id}";
const runPayload = {
  promptId: adminPromptId,
  variables: {
    customer_name: "John Doe",
    incoming_message: "Book me tomorrow"
  }
};

// Target endpoints route backend lookup to preserve secret credentials
const response = await fetch(\`/api/admin/prompts/\${adminPromptId}/execute\`, {
  method: "POST",
  headers: { "Authorization": "Bearer ADMIN_KEY" },
  body: JSON.stringify(runPayload)
});
const { choiceText } = await response.json();
console.log("Response:", choiceText);`}
                  </pre>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar info stats */}
            <div className="space-y-6">
              <Card className="bg-card/40 border-border">
                <CardHeader className="border-b border-border py-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Deployments</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3.5">
                  {prompt.deployments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-xs font-semibold">Offline Sandbox</p>
                      <p className="text-[10px] opacity-70">No webhooks currently registered in live environments.</p>
                    </div>
                  ) : (
                    prompt.deployments.map(dep => (
                      <div key={dep.id} className="p-3 border border-border/80 bg-secondary/10 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">{dep.name}</span>
                          <Badge variant="outline" className={cn("text-[8px] uppercase font-bold", dep.environment === "production" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-muted text-muted-foreground")}>
                            {dep.environment}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border/50 pt-1.5 font-mono">
                          <div>
                            <span className="text-muted-foreground">Hits: </span>
                            <span className="text-foreground font-bold">{dep.callCount}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground">Err: </span>
                            <span className={cn("font-bold", dep.errorRate && dep.errorRate > 0.02 ? "text-amber-500" : "text-green-500")}>
                              {(dep.errorRate ?? 0) * 100}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Security Health audit bound to MCP details */}
              <Card className="bg-card/40 border-border">
                <CardHeader className="border-b border-border py-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Context Risks</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded bg-secondary">
                      <Database className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Attached Tools Volume</p>
                      <p className="text-muted-foreground mt-0.5">{prompt.tools.length} functional servers attached via secure JSON endpoints.</p>
                    </div>
                  </div>

                  {prompt.tools.some(t => !t.readOnlyHint) && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg flex gap-2.5 text-amber-500">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[11px] uppercase tracking-wider leading-none">Write-capable Tools Loaded</p>
                        <p className="text-[10px] opacity-90 mt-1">This prompt template binds mutations (e.g. updating reservation records). Ensure strict preconditions are parsed in playground before deployment.</p>
                      </div>
                    </div>
                  )}

                  {prompt.tools.some(t => t.destructiveHint) && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex gap-2.5 text-red-500">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[11px] uppercase tracking-wider leading-none">Destructive Deletion Risk</p>
                        <p className="text-[10px] opacity-90 mt-1">Bound tools permit purges or deletion operations. Explicit authorization triggers are highly recommended inside caller agents.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: EDITOR */}
        {currentTab === "editor" && (
          <div className="space-y-6">
            <Card className="bg-card/40 border-border">
              <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Version Directives Configuration
                  </CardTitle>
                  <CardDescription className="text-xs">System role instructions, LLM Developer flags, and User templates containing variable structures.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">Current editor focus: <strong>{prompt.activeVersionId}</strong></span>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* System Prompt */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="sys" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-primary" /> System Directives
                    </Label>
                    <span className="text-[10px] text-muted-foreground uppercase opacity-75">Visible to AI Model</span>
                  </div>
                  <textarea 
                    id="sys"
                    rows={6}
                    className="w-full text-xs font-mono p-3.5 border border-border bg-zinc-950 dark:bg-zinc-950 text-foreground rounded-xl outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed shadow-inner"
                    value={draftSystemPrompt}
                    onChange={e => { setDraftSystemPrompt(e.target.value); markChangesUnsaved(); }}
                    placeholder="e.g. You are a senior coordinator tasked with dental scheduling triage logic..."
                  />
                </div>

                {/* Developer Instructions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="dev" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-primary" /> Developer Guardrails
                    </Label>
                    <span className="text-[10px] text-muted-foreground uppercase opacity-75">Optional Rules / Constraints</span>
                  </div>
                  <textarea 
                    id="dev"
                    rows={3}
                    className="w-full text-xs font-mono p-3.5 border border-border bg-zinc-950 dark:bg-zinc-950 text-foreground rounded-xl outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed shadow-inner"
                    value={draftDeveloperPrompt}
                    onChange={e => { setDraftDeveloperPrompt(e.target.value); markChangesUnsaved(); }}
                    placeholder="State model filtering behavior constraints, e.g. Do not recommend surgical parameters directly."
                  />
                </div>

                {/* User template */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="usr" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-primary" /> User Prompt Template
                    </Label>
                    <span className="text-[10px] text-primary font-mono font-bold">Use Double Braces: {"{{variable_name}}"}</span>
                  </div>
                  <textarea 
                    id="usr"
                    rows={5}
                    className="w-full text-xs font-mono p-3.5 border border-border bg-zinc-950 dark:bg-zinc-950 text-foreground rounded-xl outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed shadow-inner"
                    value={draftUserPrompt}
                    onChange={e => handleApplyDraftUserPromptChange(e.target.value)}
                    placeholder="New incoming customer request: \nName: {{customer_name}}\nQuery: {{incoming_message}}"
                  />
                </div>

                {/* Live Variables Preview */}
                <div className="p-4 bg-secondary/15 rounded-xl space-y-2 border border-border/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Parsed Template Variables Detected:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(playgroundVariables).length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No variables detected. Write {"{{variable}}"} above to enable variable injection.</span>
                    ) : (
                      Object.keys(playgroundVariables).map(v => (
                        <Badge key={v} variant="outline" className="font-mono text-xs px-2.5 py-1 text-primary bg-primary/5 border-primary/10">
                          {`{{ ${v} }}`}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: MODEL SETTINGS */}
        {currentTab === "models" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="bg-card/40 border-border">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" /> Vendor-Neutral Inference Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="py-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">LLM Vendor Provider</Label>
                    <Select 
                      value={modelSettings.provider} 
                      onValueChange={value => {
                        const newProvider = value as PromptProvider;
                        const models = AVAILABLE_MODELS_BY_PROVIDER[newProvider] || [];
                        setModelSettings(prev => ({
                          ...prev,
                          provider: newProvider,
                          model: models[0] || ""
                        }));
                        markChangesUnsaved();
                      }}
                    >
                      <SelectTrigger className="bg-secondary/30 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OpenAI">OpenAI</SelectItem>
                        <SelectItem value="Gemini">Gemini</SelectItem>
                        <SelectItem value="Anthropic">Anthropic</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Target Model</Label>
                    <Select 
                      value={modelSettings.model || ""} 
                      onValueChange={value => {
                        setModelSettings(p => ({ ...p, model: value }));
                        markChangesUnsaved();
                      }}
                    >
                      <SelectTrigger className="bg-secondary/30 border-border font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-mono text-xs">
                        {(AVAILABLE_MODELS_BY_PROVIDER[modelSettings.provider] || []).map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="font-semibold text-foreground">Sampling Temperature</Label>
                    <span className="font-mono font-bold text-primary">{modelSettings.temperature}</span>
                  </div>
                  <Input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={modelSettings.temperature}
                    onChange={e => { setModelSettings(p => ({ ...p, temperature: parseFloat(e.target.value) })); markChangesUnsaved(); }}
                    className="h-1.5 accent-primary bg-secondary/80 rounded-lg appearance-none outline-none border-none py-0 cursor-pointer w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1 select-none">
                    <span>Precise / Strict</span>
                    <span>Highly Creative / Stochastic</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3">
                  <Label className="text-xs font-semibold">Maximum Output Tokens</Label>
                  <Input 
                    type="number" 
                    className="bg-secondary/30 border-border font-mono text-xs w-48"
                    value={modelSettings.maxOutputTokens}
                    onChange={e => { setModelSettings(p => ({ ...p, maxOutputTokens: parseInt(e.target.value) || 200 })); markChangesUnsaved(); }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Truncate answers gracefully to cap regional network API costs.</p>
                </div>

                {/* Expandable Advanced */}
                <details className="group border-t border-border pt-4">
                  <summary className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none flex items-center justify-between list-none">
                    <span>Advanced Provider-Specific System Settings</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>

                  <div className="space-y-4 pt-4 animate-in fade-in duration-300">
                    <div className="p-3.5 bg-secondary/15 rounded-xl border border-border">
                      <p className="text-xs font-semibold text-foreground">Constraint Mode Parameters</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure custom header triggers or routing tags when communicating with multi-region inference endpoints.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Response Layout Format</Label>
                        <Select 
                          value={modelSettings.responseFormat || "text"} 
                          onValueChange={value => {
                            setModelSettings(p => ({ ...p, responseFormat: value as any }));
                            markChangesUnsaved();
                          }}
                        >
                          <SelectTrigger className="bg-secondary/30 border-border text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="text">Plain Markdown Text</SelectItem>
                            <SelectItem value="json_object">Structured JSON Object</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Reasoning Pipeline Depth</Label>
                        <Select 
                          value={modelSettings.reasoningEffort || "medium"} 
                          onValueChange={value => {
                            setModelSettings(p => ({ ...p, reasoningEffort: value as any }));
                            markChangesUnsaved();
                          }}
                        >
                          <SelectTrigger className="bg-secondary/30 border-border text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="low">Low (Fast Inference)</SelectItem>
                            <SelectItem value="medium">Medium Standard</SelectItem>
                            <SelectItem value="high">High Deconstruct (o1/o3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: MCP TOOLS BINDING */}
        {currentTab === "tools" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-foreground">Relational MCP Tools Binding</h2>
                <p className="text-xs text-muted-foreground">Attach schema-validated local tools to this active prompt context. attached tools are visible to the LLM agent during evaluation.</p>
              </div>

              {/* Slider trigger sheet */}
              <Button className="gap-1.5 ai-studio-gradient border-none text-white text-xs font-semibold h-9 cursor-pointer shadow" onClick={() => setIsToolSheetOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                Attach MCP Tool
              </Button>
            </div>

            {/* List attached tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prompt.tools.length === 0 ? (
                <div className="md:col-span-2 border border-dashed border-border p-8 rounded-2xl text-center text-muted-foreground bg-secondary/5">
                  <Database className="w-8 h-8 opacity-40 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No tools attached to this template</p>
                  <p className="text-xs">Click "Attach MCP Tool" to list verified endpoints and secure execution schemas.</p>
                </div>
              ) : (
                prompt.tools.map(tool => (
                  <Card key={`${tool.serverId}-${tool.toolName}`} className="bg-card/40 border-border flex flex-col justify-between overflow-hidden">
                    <div>
                      {/* Card Header indicators */}
                      <div className="bg-secondary/25 p-4 flex justify-between items-center border-b border-border">
                        <div>
                          <p className="font-mono text-xs font-bold text-foreground">{tool.toolName}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Attached via: {tool.serverId}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer rounded-full"
                          onClick={() => handleDetachTool(tool.toolName, tool.serverId)}
                          title="Detach tool from template context"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Security risks Warnings */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                        
                        {/* Parameter quick overview */}
                        <div className="bg-zinc-950 dark:bg-zinc-950 p-2 rounded-lg border border-border/80">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono leading-none mb-1">Inference Parameters Schema:</p>
                          <p className="font-mono text-[10px] text-zinc-300 truncate">{tool.inputSchemaSummary || "No input parameters necessary"}</p>
                        </div>

                        {/* Annotations checks */}
                        <div className="space-y-1.5 border-t border-secondary/15 pt-3">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">Execution Health:</span>
                          
                          {/* 1. readOnly check */}
                          {!tool.readOnlyHint ? (
                            <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-500 border-amber-500/10 flex gap-1 items-center justify-start w-full py-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" /> Side-Effects: Writes/Alters states
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-bold bg-green-500/10 text-green-500 border-green-500/10 flex gap-1 items-center justify-start w-full py-1">
                              <CheckCircle className="w-3 h-3 shrink-0" /> Safe Read-Only operations bound
                            </Badge>
                          )}

                          {/* 2. destructive check */}
                          {tool.destructiveHint && (
                            <Badge variant="outline" className="text-[9px] font-bold bg-red-500/10 text-red-500 border-red-500/10 flex gap-1 items-center justify-start w-full py-1">
                              <ShieldAlert className="w-3 h-3 shrink-0" /> CRITICAL: Destructive deletion action active
                            </Badge>
                          )}

                          {/* 3. idempotency check */}
                          {!tool.idempotentHint && (
                            <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/5 text-amber-400 border-amber-500/10 flex gap-1 items-center justify-start w-full py-1">
                              <Info className="w-3 h-3 shrink-0" /> Duplicate Action Risk: Repeated calls create entries
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Policy notes input */}
                    <div className="p-4 bg-secondary/5 border-t border-border mt-auto">
                      <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1 block">Context Call Policy Guidelines:</Label>
                      <textarea
                        rows={2}
                        className="w-full text-xs p-2 bg-secondary/20 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20"
                        value={tool.policyNotes || ""}
                        onChange={e => {
                          const updatedTools = prompt.tools.map(t => {
                            if (t.toolName === tool.toolName && t.serverId === tool.serverId) {
                              return { ...t, policyNotes: e.target.value };
                            }
                            return t;
                          });
                          handleUpdateStorage({ ...prompt, tools: updatedTools });
                        }}
                        placeholder="e.g. Only invoke lookup reservation when user query points to pre-existing scheduler logs..."
                      />
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Slideout Tool Attach Sheet (Standard HTML Dialog wrapper) */}
            {isToolSheetOpen && (
              <div className="fixed inset-0 z-50 flex justify-end bg-background/50 backdrop-blur-sm">
                <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/15">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Bind Available Setup Tools</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 mt-0.5">Attach server actions into prompt instructions.</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 cursor-pointer" onClick={() => setIsToolSheetOpen(false)}>Close</Button>
                  </div>

                  {/* Search inside list */}
                  <div className="p-4 border-b border-border flex gap-2">
                    <Input 
                      placeholder="Search active tools..." 
                      className="h-9 bg-secondary/10 border-border text-xs"
                      value={searchToolQuery}
                      onChange={e => setSearchToolQuery(e.target.value)}
                    />
                  </div>

                  {/* Attachment prompt notes */}
                  <div className="p-4 border-b border-border bg-amber-500/5 text-amber-500 text-[10px] flex gap-1.5 items-start">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>Select tool entry. Real tool invocations are run through credentials saved inside local servers context.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {filteredRegisterTools.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-8">No matching integration tools detected on registry.</p>
                    ) : (
                      filteredRegisterTools.map(item => (
                        <div key={`${item.server.id}-${item.tool.name}`} className="p-3 border border-border bg-secondary/10 rounded-xl space-y-2 hover:border-primary/40 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono text-xs font-bold text-foreground truncate max-w-[200px]">{item.tool.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Server integration: {item.integrationName}</p>
                            </div>
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] bg-primary text-white border-none shrink-0 cursor-pointer"
                              onClick={() => handleAttachTool(item.tool, item.server.id, item.integrationName)}
                            >
                              Attach Tool
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{item.tool.description || "No tool description annotated."}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: OPERATIONAL PLAYGROUND */}
        {currentTab === "playground" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
            {/* Play columns left sidebar control */}
            <div className="space-y-6">
              <Card className="bg-card/40 border-border">
                <CardHeader className="border-b border-border py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary" /> Inputs & Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  {/* Test case bindings */}
                  {prompt.testCases.length > 0 && (
                    <div className="space-y-1.5 pb-3 border-b border-border">
                      <Label className="font-semibold text-muted-foreground">Load Template Test Case:</Label>
                      <div className="space-y-1">
                        {prompt.testCases.map(tc => (
                          <button
                            key={tc.id}
                            onClick={() => handleLoadTestCase(tc)}
                            className="w-full text-left p-2 rounded border border-border bg-secondary/10 hover:bg-secondary/40 text-xs font-mono font-medium truncate cursor-pointer block"
                          >
                            🚀 {tc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variables Inputs board */}
                  <div className="space-y-3">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">Template Variables values:</span>
                    {Object.keys(playgroundVariables).length === 0 ? (
                      <p className="text-muted-foreground italic text-[11px]">No variable keys found. Add {"{{bracket_parameters}}"} inside your editor templates to list parameters here.</p>
                    ) : (
                      Object.keys(playgroundVariables).map(key => (
                        <div key={key} className="space-y-1">
                          <Label className="font-mono text-[11px] text-foreground">{`{{ ${key} }}`}</Label>
                          <Input
                            className="bg-secondary/30 border-border font-serif h-8 text-xs placeholder:text-muted-foreground"
                            value={playgroundVariables[key]}
                            onChange={e => setPlaygroundVariables(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={`Inject string for ${key}...`}
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Toggle MCP tools dry run or execute */}
                  {prompt.tools.length > 0 && (
                    <div className="space-y-2 border-t border-border pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase text-muted-foreground">MCP Active Execution</span>
                        <Badge variant="outline" className={cn("text-[8px] uppercase", runWithToolsExec ? "bg-amber-500/10 text-amber-500" : "bg-neutral-500/10 text-muted-foreground")}>
                          {runWithToolsExec ? "INTEGRATED" : "DRY-RUN MODE"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/5 text-[10px] text-orange-500/90 border border-orange-500/10 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <p>Real tool execution is default-disabled inside sandbox. Active bound tools must be toggled on below.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="runWithTools"
                          checked={runWithToolsExec}
                          onChange={e => setRunWithToolsExec(e.target.checked)}
                          className="rounded border-border text-primary cursor-pointer h-4 w-4"
                        />
                        <Label htmlFor="runWithTools" className="text-xs font-bold text-foreground cursor-pointer select-none">
                          Enable bound MCP Tools ({prompt.tools.length})
                        </Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Middle panel chat history console and composers */}
            <div className="xl:col-span-2 space-y-4 flex flex-col justify-between">
              <Card className="bg-card/40 border-border flex-1 flex flex-col justify-between overflow-hidden min-h-[480px]">
                <CardHeader className="border-b border-border py-3 bg-secondary/10 flex flex-row justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Playground Terminal Workspace</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] text-muted-foreground hover:bg-secondary cursor-pointer border border-border/80"
                    onClick={() => { setPlaygroundMessages([]); setLastPlaygroundRun(null); }}
                  >
                    Clear History
                  </Button>
                </CardHeader>

                {/* Conversation board */}
                <CardContent className="p-4 flex-1 overflow-y-auto space-y-4 select-text">
                  {/* System instruction loaded block */}
                  <div className="p-3 border border-dashed border-border/80 bg-secondary/10 rounded-xl space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground font-semibold uppercase">System Message context preloaded:</p>
                    <p className="text-xs font-mono text-foreground italic/60 truncate">{draftSystemPrompt || "Empty system template context"}</p>
                  </div>

                  {playgroundMessages.map((m, idx) => (
                    <div key={idx} className={cn("flex flex-col gap-1.5 p-3 rounded-xl max-w-[85%] text-xs", m.role === "assistant" ? "bg-primary/5 border border-primary/10 mr-auto text-foreground" : "bg-secondary text-foreground ml-auto")}>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-primary">{m.role === "assistant" ? "AI Model Response" : "Self"}</span>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                  ))}

                  {/* Play Response stream */}
                  {isRunningPlayground && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 text-primary border border-primary/10 w-fit max-w-[85%] mr-auto text-xs font-mono select-none">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluating template directives and fetching parameters live...
                    </div>
                  )}

                  {lastPlaygroundRun && (
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl max-w-[95%] border border-primary/25 bg-secondary/20 mr-auto text-xs">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-green-500">AI Model Response</span>
                      <p className="whitespace-pre-wrap leading-relaxed select-text text-foreground font-sans">{lastPlaygroundRun.responseText}</p>
                    </div>
                  )}
                </CardContent>

                {/* Composer controls bottom */}
                <div className="p-4 border-t border-border bg-secondary/15 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter conversational tester message or variables scenario guidelines..."
                      className="flex-1 bg-secondary/30 border-border text-xs"
                      value={composerMessage}
                      onChange={e => setComposerMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleExecuteWithComposer()}
                    />
                    <Button 
                      className="ai-studio-gradient hover:opacity-90 text-white font-bold text-xs h-10 border-none cursor-pointer shadow px-5"
                      onClick={handleExecuteInPlayground}
                      disabled={isRunningPlayground}
                    >
                      Run Template
                    </Button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Press Enter to chat. Multi-turn responses are securely processed.</span>
                    <button className="hover:text-foreground underline cursor-pointer" onClick={handleSaveAsTestCase}>
                      Save current variables as active test case
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right sidebar metrics diagnostics cost loggers panels */}
            <div className="space-y-6">
              <Card className="bg-card/40 border-border">
                <CardHeader className="border-b border-border py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Metrics & Analytics</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {lastPlaygroundRun ? (
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3.5 bg-secondary/20 rounded-lg">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Latency</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{lastPlaygroundRun.metrics.latencyMs} ms</p>
                      </div>
                      <div className="p-3.5 bg-secondary/20 rounded-lg">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Cost Estimate</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">${lastPlaygroundRun.metrics.costEstimate}</p>
                      </div>
                      <div className="p-3.5 bg-secondary/10 rounded-lg col-span-2">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1.5 block">Estimated tokens breakdown</p>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prompt inputs:</span>
                            <span className="font-bold text-foreground">{lastPlaygroundRun.metrics.inputTokens}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Choice completion:</span>
                            <span className="font-bold text-foreground">{lastPlaygroundRun.metrics.outputTokens}</span>
                          </div>
                          <div className="h-px bg-border pt-0.5" />
                          <div className="flex justify-between font-bold text-primary pt-0.5">
                            <span>Aggregate tokens:</span>
                            <span>{lastPlaygroundRun.metrics.totalTokens}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-6">Run execution template to retrieve token counts and pricing calculations.</p>
                  )}
                </CardContent>
              </Card>

              {/* Raw JSON diagnostics viewers */}
              {lastPlaygroundRun && (
                <details className="group border border-border bg-card/40 rounded-xl overflow-hidden">
                  <summary className="p-3.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none flex items-center justify-between bg-secondary/15 select-none list-none">
                    <span>Inspect Raw API Payloads</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>

                  <div className="p-4 border-t border-border bg-zinc-950 dark:bg-zinc-950 text-foreground font-mono text-[10px] space-y-4 max-h-[250px] overflow-y-auto">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground pb-1 leading-none">POST Request RequestJSON:</p>
                      <pre className="text-green-500 overflow-x-auto p-1.5 bg-secondary/10 rounded-lg">{JSON.stringify(lastPlaygroundRun.rawRequestPayload, null, 2)}</pre>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground pb-1 leading-none">POST Response ResponseJSON:</p>
                      <pre className="text-blue-400 overflow-x-auto p-1.5 bg-secondary/10 rounded-lg">{JSON.stringify(lastPlaygroundRun.rawResponsePayload, null, 2)}</pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: VERSIONS HISTORY */}
        {currentTab === "history" && (
          <div className="space-y-6">
            <Card className="bg-card/40 border-border">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Immutable Versions System Log
                </CardTitle>
                <CardDescription className="text-xs">Archive logs of published versions. Demoting versions will securely rollback calling webhook pointers.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3.5">
                  {prompt.versions.map((ver, idx) => (
                    <div key={ver.id} className="p-4 border border-border bg-secondary/10 rounded-xl space-y-3 hover:border-border/80 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-foreground px-2 py-0.5 bg-secondary border border-border rounded">{ver.id}</span>
                          <span className="text-xs font-medium text-muted-foreground">{new Date(ver.publishedAt || "").toLocaleString()}</span>
                          <span className="text-xs font-medium text-foreground px-2 py-1 bg-secondary/50 rounded-lg">Publisher: {ver.publishedBy}</span>
                          {ver.id === prompt.activeVersionId ? (
                            <Badge variant="outline" className="text-[9px] font-bold bg-green-500/10 text-green-500 border-green-500/20 uppercase tracking-wide">
                              Production Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-muted border-border text-muted-foreground uppercase opacity-75">
                              Archived System Pointer
                            </Badge>
                          )}
                        </div>

                        {/* Rollback trigger actions */}
                        {ver.id !== prompt.activeVersionId && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-semibold cursor-pointer border-border hover:bg-secondary/20"
                            onClick={() => handleRollbackVersion(ver.id)}
                          >
                            Promote to Active Production
                          </Button>
                        )}
                      </div>

                      <div className="text-xs space-y-2">
                        <div className="bg-zinc-950 dark:bg-zinc-950 p-2 border border-border/80 rounded font-mono text-muted-foreground">
                          <span className="text-[9px] uppercase block font-bold text-primary">Upgrade Comments:</span>
                          <span className="text-zinc-200">{ver.changelog || "No upgrade comment logged."}</span>
                        </div>
                        
                        <details className="group">
                          <summary className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer select-none">
                            Display compiled text templates directives &gt;
                          </summary>
                          <div className="p-3 bg-secondary/5 border border-border/50 rounded-lg mt-1 font-mono text-[10px] leading-relaxed max-h-[160px] overflow-y-auto space-y-2">
                            <div>
                              <span className="text-primary font-bold">[SYSTEM]: </span>
                              <p className="whitespace-pre-wrap text-foreground">{ver.systemPrompt}</p>
                            </div>
                            {ver.developerPrompt && (
                              <div>
                                <span className="text-primary font-bold">[DEVELOPER]: </span>
                                <p className="whitespace-pre-wrap text-foreground">{ver.developerPrompt}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-primary font-bold">[USER]: </span>
                              <p className="whitespace-pre-wrap text-foreground">{ver.userPromptTemplate}</p>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Diff Viewer section */}
                {prompt.versions.length > 1 && (
                  <div className="border hover:border-border p-4.5 rounded-xl border-dashed border-border/70 mt-4 space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground leading-none">Interactive Version Diff comparison tools</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Select any past draft version to deconstruct changes line-by-line against production active.</p>
                      </div>

                      <div className="flex gap-2 items-center">
                        <Select value={diffBaseVerId} onValueChange={setDiffBaseVerId}>
                          <SelectTrigger className="font-mono text-[11px] h-8 w-24 bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="font-mono text-[11px]">
                            {prompt.versions.map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">Compare against:</span>
                        <Select value={diffCompareVerId || prompt.versions[prompt.versions.length - 1].id} onValueChange={setDiffCompareVerId}>
                          <SelectTrigger className="font-mono text-[11px] h-8 w-24 bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="font-mono text-[11px]">
                            {prompt.versions.map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Fictional/Visual Diff line presentation */}
                    <div className="p-4 bg-zinc-950 dark:bg-zinc-950 font-mono text-[11px] text-zinc-300 rounded-xl max-h-[220px] overflow-y-auto space-y-1 select-text">
                      <p className="text-primary text-[10px] uppercase font-bold text-center border-b border-secondary/20 pb-1.5 mb-2 select-none">Comparing {diffBaseVerId} (Base) with {diffCompareVerId || prompt.versions[prompt.versions.length - 1].id} (Source)</p>
                      
                      {prompt.versions.find(x => x.id === diffBaseVerId)?.systemPrompt === prompt.versions.find(y => y.id === (diffCompareVerId || prompt.versions[prompt.versions.length - 1].id))?.systemPrompt ? (
                        <p className="text-center italic opacity-60 text-muted-foreground">System directive parameters remain identical between selections.</p>
                      ) : (
                        <>
                          <p className="text-red-500 bg-red-500/10 p-1 rounded select-all">- SYSTEM PREVIOUS: {prompt.versions.find(x => x.id === diffBaseVerId)?.systemPrompt.substring(0, 100)}...</p>
                          <p className="text-green-500 bg-green-500/10 p-1 rounded select-all">+ SYSTEM RECENT: {prompt.versions.find(y => y.id === (diffCompareVerId || prompt.versions[prompt.versions.length - 1].id))?.systemPrompt.substring(0, 100)}...</p>
                        </>
                      )}

                      {prompt.versions.find(x => x.id === diffBaseVerId)?.userPromptTemplate === prompt.versions.find(y => y.id === (diffCompareVerId || prompt.versions[prompt.versions.length - 1].id))?.userPromptTemplate ? (
                        <p className="text-center italic opacity-60 text-muted-foreground pt-1 pb-1">User prompt templates matches completely.</p>
                      ) : (
                        <>
                          <p className="text-red-500 bg-red-500/10 p-1 rounded select-all">- USER PREVIOUS: {prompt.versions.find(x => x.id === diffBaseVerId)?.userPromptTemplate}</p>
                          <p className="text-green-500 bg-green-500/10 p-1 rounded select-all">+ USER RECENT: {prompt.versions.find(y => y.id === (diffCompareVerId || prompt.versions[prompt.versions.length - 1].id))?.userPromptTemplate}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 7: TEST CASES EVALUATIONS */}
        {currentTab === "evals" && (
          <div className="space-y-6">
            <Card className="bg-card/40 border-border">
              <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" /> Evaluation Test Cases Assets
                  </CardTitle>
                  <CardDescription className="text-xs">Saved user variable values scenario setups. Run tests to evaluate behavior changes across version upgrades.</CardDescription>
                </div>

                <Button className="h-8.5 text-xs bg-secondary border border-border select-none hover:bg-secondary/50 cursor-pointer" onClick={handleSaveAsTestCase}>
                  Create Saved Evaluation Case
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {prompt.testCases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bookmark className="w-8 h-8 opacity-40 mx-auto mb-2 animate-bounce" />
                      <p className="text-sm font-semibold">No saved evaluations</p>
                      <p className="text-xs">Generate variables within playground section and click "Save as Evaluation Test Case".</p>
                    </div>
                  ) : (
                    prompt.testCases.map(tc => (
                      <div key={tc.id} className="p-4 border border-border bg-secondary/15 rounded-xl space-y-3">
                        <div className="flex justify-between items-center bg-secondary/20 p-2.5 rounded-lg border border-border">
                          <div>
                            <p className="font-semibold text-xs text-foreground">{tc.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Parameters: {Object.keys(tc.variables).map(k => `${k}="${tc.variables[k]}"`).join(", ")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[9px] uppercase font-bold", tc.lastRunResult === "passed" ? "bg-green-500/10 text-green-500 border-green-500/20" : tc.lastRunResult === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>
                              {tc.lastRunResult || "pending"}
                            </Badge>
                            
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] bg-primary text-white border-none cursor-pointer px-3 flex gap-1 items-center" 
                              onClick={() => {
                                handleLoadTestCase(tc);
                                setSearchParams({ tab: "playground" });
                              }}
                            >
                              <Play className="w-3 h-3" /> Load Scenario
                            </Button>
                          </div>
                        </div>

                        {/* Variables grid */}
                        <div className="p-3 bg-secondary/5 rounded-lg border border-border/80 space-y-1 text-xs">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Expected notes/criteria:</p>
                          <p className="text-foreground">{tc.expectedNotes || "No specific evaluation bounds declared."}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
