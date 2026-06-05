import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Play, 
  Filter,
  Activity,
  User,
  Settings,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Terminal,
  Cpu,
  Bookmark
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PromptRecord, PromptStatus, PromptProvider } from "@/types/prompts";
import { INITIAL_PROMPTS, AVAILABLE_MODELS_BY_PROVIDER } from "@/data/mockPrompts";

export default function PromptsList() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [newPrompt, setNewPrompt] = useState({
    name: "",
    description: "",
    role: "AI Operations Engineers",
    provider: "OpenAI" as PromptProvider,
    defaultModel: "gpt-4o",
    systemPrompt: "You are a helpful assistant.",
    userPromptTemplate: "Hello, {{input}}!"
  });

  // Load from local storage or pre-populate
  useEffect(() => {
    const stored = localStorage.getItem("mcp_admin_prompts");
    if (stored) {
      try {
        setPrompts(JSON.parse(stored));
      } catch (err) {
        setPrompts(INITIAL_PROMPTS);
      }
    } else {
      setPrompts(INITIAL_PROMPTS);
      localStorage.setItem("mcp_admin_prompts", JSON.stringify(INITIAL_PROMPTS));
    }
  }, []);

  const savePromptsToStorage = (updatedList: PromptRecord[]) => {
    setPrompts(updatedList);
    localStorage.setItem("mcp_admin_prompts", JSON.stringify(updatedList));
  };

  const handleProviderChangeInForm = (provider: PromptProvider) => {
    const models = AVAILABLE_MODELS_BY_PROVIDER[provider] || [];
    setNewPrompt(prev => ({
      ...prev,
      provider,
      defaultModel: models[0] || ""
    }));
  };

  const handleCreatePrompt = () => {
    if (!newPrompt.name.trim()) {
      toast.error("Prompt name is required");
      return;
    }

    const id = newPrompt.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (prompts.some(p => p.id === id)) {
      toast.error("A prompt with a similar name or ID already exists");
      return;
    }

    const newRecord: PromptRecord = {
      id,
      name: newPrompt.name,
      description: newPrompt.description || "No description provided.",
      role: newPrompt.role,
      status: "draft",
      activeVersionId: "v1",
      provider: newPrompt.provider,
      defaultModel: newPrompt.defaultModel,
      attachedToolsCount: 0,
      updatedAt: new Date().toISOString(),
      owner: "onurgulay@gmail.com",
      versions: [
        {
          id: "v1",
          promptId: id,
          systemPrompt: newPrompt.systemPrompt,
          userPromptTemplate: newPrompt.userPromptTemplate,
          changelog: "Initial creation",
          publishedAt: new Date().toISOString(),
          publishedBy: "OG",
          status: "active",
          modelSettings: {
            provider: newPrompt.provider,
            model: newPrompt.defaultModel,
            temperature: 0.3,
            maxOutputTokens: 1000
          }
        }
      ],
      tools: [],
      testCases: [],
      deployments: []
    };

    const updated = [newRecord, ...prompts];
    savePromptsToStorage(updated);
    setIsAddDialogOpen(false);
    toast.success("Prompt created in Draft status!");
    
    // Reset form
    setNewPrompt({
      name: "",
      description: "",
      role: "AI Operations Engineers",
      provider: "OpenAI",
      defaultModel: "gpt-4o",
      systemPrompt: "You are a helpful assistant.",
      userPromptTemplate: "Hello, {{input}}!"
    });

    navigate(`/prompts/${id}`);
  };

  const handleDuplicatePrompt = (prompt: PromptRecord) => {
    const baseId = `${prompt.id}-copy`;
    let count = 1;
    let finalId = baseId;
    while (prompts.some(p => p.id === finalId)) {
      finalId = `${baseId}-${count}`;
      count++;
    }

    const duplicated: PromptRecord = {
      ...prompt,
      id: finalId,
      name: `${prompt.name} (Copy)`,
      status: "draft",
      updatedAt: new Date().toISOString(),
      deployments: [], // clear historical deploys for safety
      unsavedChanges: false
    };

    // Deep copy versions
    duplicated.versions = prompt.versions.map(v => ({
      ...v,
      promptId: finalId
    }));

    const updated = [duplicated, ...prompts];
    savePromptsToStorage(updated);
    toast.success(`Duplicated "${prompt.name}" as "${duplicated.name}"`);
  };

  const handleToggleStatus = (promptId: string, status: PromptStatus) => {
    const updated = prompts.map(p => {
      if (p.id === promptId) {
        return {
          ...p,
          status,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    savePromptsToStorage(updated);
    toast.success(`Status updated to ${status}`);
  };

  const handleDeletePrompt = (promptId: string) => {
    if (!confirm("Are you sure you want to delete this prompt and all its versions permanently? This cannot be undone.")) {
      return;
    }
    const updated = prompts.filter(p => p.id !== promptId);
    savePromptsToStorage(updated);
    toast.success("Prompt deleted from admin desk");
  };

  // Filter lists
  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.defaultModel.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvider = selectedProvider === "all" || p.provider === selectedProvider;
    const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
    const matchesRole = selectedRole === "all" || p.role === selectedRole;

    return matchesSearch && matchesProvider && matchesStatus && matchesRole;
  });

  // Theme badges styled gracefully for providers
  const getProviderBadge = (provider: PromptProvider) => {
    switch (provider) {
      case "OpenAI":
        return "bg-zinc-900 text-zinc-50 border-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-200";
      case "Gemini":
        return "bg-blue-600/10 text-blue-500 border-blue-500/20";
      case "Anthropic":
        return "bg-amber-600/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  const getStatusBadge = (status: PromptStatus) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "draft":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "archived":
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-primary shrink-0" />
            Prompts Management
          </h1>
          <p className="text-muted-foreground">Versioned prompt templates registry, tool bindings, and operational AI evaluation playdesk.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={
            <Button className="gap-2 ai-studio-gradient border-none text-white shadow-lg shadow-primary/20 cursor-pointer">
              <Plus className="w-4 h-4" />
              Create Prompt
            </Button>
          } />
          <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Prompt Template</DialogTitle>
              <DialogDescription>Initialize a reusable, versioned prompt template. Editing will generate state-secure drafts.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="prompt-name" className="text-xs font-semibold">Prompt Template Name</Label>
                <Input 
                  id="prompt-name" 
                  value={newPrompt.name} 
                  onChange={e => setNewPrompt(v => ({ ...v, name: e.target.value }))}
                  placeholder="e.g. WhatsApp Dental Counselor"
                  className="bg-secondary/30 border-border"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prompt-desc" className="text-xs font-semibold">Description / Purpose</Label>
                <Input 
                  id="prompt-desc" 
                  value={newPrompt.description} 
                  onChange={e => setNewPrompt(v => ({ ...v, description: e.target.value }))}
                  placeholder="Summarize the core execution logic and patient flow target."
                  className="bg-secondary/30 border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Operational Owner Role</Label>
                  <Select 
                    value={newPrompt.role} 
                    onValueChange={value => setNewPrompt(v => ({ ...v, role: value }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border">
                      <SelectValue placeholder="Select maintenance group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI Operations Engineers">AI Operations Engineers</SelectItem>
                      <SelectItem value="System Administrators">System Administrators</SelectItem>
                      <SelectItem value="Prompt Maintainers">Prompt Maintainers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Default LLM Provider</Label>
                  <Select 
                    value={newPrompt.provider} 
                    onValueChange={value => handleProviderChangeInForm(value as PromptProvider)}
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
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Inference Model</Label>
                <Select 
                  value={newPrompt.defaultModel} 
                  onValueChange={value => setNewPrompt(v => ({ ...v, defaultModel: value }))}
                >
                  <SelectTrigger className="bg-secondary/30 border-border font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {(AVAILABLE_MODELS_BY_PROVIDER[newPrompt.provider] || []).map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 border-t border-border pt-3 mt-2">
                <Label htmlFor="sys-prompt" className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 leading-none mb-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> System Directives
                </Label>
                <textarea 
                  id="sys-prompt"
                  rows={2}
                  className="w-full text-xs font-mono p-2 border border-border bg-secondary/20 rounded-lg outline-none focus:ring-1 focus:ring-primary/20"
                  value={newPrompt.systemPrompt}
                  onChange={e => setNewPrompt(v => ({ ...v, systemPrompt: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="user-template" className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 leading-none mb-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" /> User Prompt Template
                </Label>
                <textarea 
                  id="user-template"
                  rows={2}
                  className="w-full text-xs font-mono p-2 border border-border bg-secondary/20 rounded-lg outline-none focus:ring-1 focus:ring-primary/20"
                  value={newPrompt.userPromptTemplate}
                  onChange={e => setNewPrompt(v => ({ ...v, userPromptTemplate: e.target.value }))}
                  placeholder="Include variables like {{customer_name}}"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="h-10 cursor-pointer" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="ai-studio-gradient h-10 border-none text-white cursor-pointer" onClick={handleCreatePrompt}>
                Create & View Workbench
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dense Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card/60 border border-border/80 p-4 rounded-xl backdrop-blur-md shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <Input 
            placeholder="Search templates, models, and descriptions..." 
            className="pl-10 h-9 bg-secondary/20 border-border"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Provider:</span>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="h-9 w-32 bg-secondary/20 border-border text-xs font-medium">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="OpenAI">OpenAI</SelectItem>
                <SelectItem value="Gemini">Gemini</SelectItem>
                <SelectItem value="Anthropic">Anthropic</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 w-28 bg-secondary/20 border-border text-xs font-medium">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Category:</span>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-9 w-44 bg-secondary/20 border-border text-xs font-medium">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="AI Operations Engineers">AI Operations Engineers</SelectItem>
                <SelectItem value="System Administrators">System Administrators</SelectItem>
                <SelectItem value="Prompt Maintainers">Prompt Maintainers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Prompts Admin Registry Table */}
      <Card className="border-border bg-card/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-border">
              <TableHead className="w-[300px] pl-6 py-4.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Prompt Template</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Active Ver</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Provider</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Model</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">MCP Tools</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Updated</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Owner Role</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrompts.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={9} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <FileText className="w-8 h-8 opacity-40 animate-pulse" />
                    <p className="font-semibold text-sm">No prompt templates found</p>
                    <p className="text-xs opacity-75">Adjust filters or create a new Prompt layout configuration.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPrompts.map(prompt => (
                <TableRow key={prompt.id} className="border-border hover:bg-secondary/10 group transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Link 
                          to={`/prompts/${prompt.id}`} 
                          className="font-semibold text-sm text-foreground hover:text-primary hover:underline flex items-center gap-1"
                        >
                          {prompt.name}
                        </Link>
                        {prompt.unsavedChanges && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/15 border-amber-500/20 text-[9px] px-1 py-0 uppercase">
                            Unsaved
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[280px]">
                        {prompt.description}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5", getStatusBadge(prompt.status))}>
                      {prompt.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs font-semibold">
                    <span className="bg-secondary/40 border border-border px-1.5 py-0.5 rounded text-foreground">
                      {prompt.activeVersionId}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] font-sans font-bold py-0.5", getProviderBadge(prompt.provider))}>
                      {prompt.provider}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-xs font-medium text-foreground">
                    {prompt.defaultModel}
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-bold border border-primary/10">
                      <Cpu className="w-3 h-3" />
                      {prompt.tools.length}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(prompt.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    <span className="text-foreground font-semibold px-2 py-1 bg-secondary/50 rounded-lg text-[11px]">
                      {prompt.role}
                    </span>
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-8 px-2 cursor-pointer gap-1 hover:text-primary"
                        render={<Link to={`/prompts/${prompt.id}?tab=playground`} />}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        Playground
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground hover:bg-secondary cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-[180px] shadow-xl">
                          <DropdownMenuItem render={<Link to={`/prompts/${prompt.id}`} className="flex items-center gap-2" />}>
                            <Settings className="w-3.5 h-3.5" />
                            Open Workbench
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => handleDuplicatePrompt(prompt)}>
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate Prompt
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          {prompt.status !== "active" && (
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-green-500 hover:text-green-600 font-semibold" onClick={() => handleToggleStatus(prompt.id, "active")}>
                              <Play className="w-3.5 h-3.5 text-green-500" />
                              Promote to Active
                            </DropdownMenuItem>
                          )}
                          {prompt.status !== "archived" && (
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-amber-500" onClick={() => handleToggleStatus(prompt.id, "archived")}>
                              <AlertCircle className="w-3.5 h-3.5" />
                              Archive Prompt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10" onClick={() => handleDeletePrompt(prompt.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Prompt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
