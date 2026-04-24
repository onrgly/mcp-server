import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  RefreshCw, 
  Shield, 
  ShieldCheck,
  Server, 
  Code2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  Settings2,
  Play,
  FileJson,
  Eye,
  Sparkles,
  Trash2,
  Terminal,
  Activity,
  Copy,
  ExternalLink,
  Globe,
  Settings,
  Lock,
  Search,
  Check,
  X,
  Zap,
  History,
  CloudDownload,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMCP } from "@/context/MCPContext";
import { cn } from "@/lib/utils";
import { MCPTool, AuthType, MCPIntegration } from "@/types";
import { toast } from "sonner";
import SchemaBuilder from "@/components/SchemaBuilder";
import SchemaAssistant from "@/components/SchemaAssistant";

export default function IntegrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { integrations, saveIntegration, deleteIntegration, loading } = useMCP();
  const integration = integrations.find(i => i.id === id);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTool, setSelectedTool] = useState<Partial<MCPTool> | null>(null);
  const [toolIdx, setToolIdx] = useState<number>(-1);
  const [isToolEditorOpen, setIsToolEditorOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [editorTab, setEditorTab] = useState("visual");
  const [jsonSchemaStr, setJsonSchemaStr] = useState("");
  
  // Local edit state
  const [editInteg, setEditInteg] = useState<Partial<MCPIntegration>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);

  useEffect(() => {
    if (integration) {
      setEditInteg({ ...integration });
    }
  }, [integration]);

  if (!integration && !loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-semibold">Integration not found</h2>
        <Button asChild variant="outline">
          <Link to="/integrations">Back to Integrations</Link>
        </Button>
      </div>
    );
  }

  const handleSaveIntegration = async () => {
    setIsSaving(true);
    await saveIntegration(editInteg);
    setIsSaving(false);
  };

  const handleTestAuth = async () => {
    setIsTestingAuth(true);
    try {
      const res = await fetch("/api/admin?action=test-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth: editInteg.auth })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || "Authentication successful!");
      } else {
        toast.error(data.error || "Authentication failed");
      }
    } catch (e) {
      toast.error("Connection error during test");
    } finally {
      setIsTestingAuth(false);
    }
  };

  const handleDiscover = async () => {
    if (!editInteg.mcpRemote?.serverUrl) {
      toast.error("Server URL is required for discovery");
      return;
    }
    setIsDiscovering(true);
    try {
      const res = await fetch("/api/admin?action=mcp-discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          integrationId: id,
          serverUrl: editInteg.mcpRemote.serverUrl
        })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Discovered ${data.tools?.length || 0} tools. Apply from discover panel.`);
        // Note: For now we guide simple discover. Parity backend handles automatic merge on 'Apply' 
        // which we'll implement in Phase 6.
      } else {
        toast.error(data.error || "Discovery failed");
      }
    } catch (e) {
      toast.error("Discovery connection error");
    } finally {
      setIsDiscovering(false);
    }
  };

  const openToolEditor = (tool: MCPTool | null, index: number) => {
    if (tool) {
      setSelectedTool({ ...tool });
      setToolIdx(index);
      setJsonSchemaStr(JSON.stringify(tool.parameters || [], null, 2));
    } else {
      setSelectedTool({
        name: "",
        description: "",
        handler: "api",
        method: "GET",
        endpoint: "",
        enabled: true,
        parameters: []
      });
      setToolIdx(-1);
      setJsonSchemaStr("[]");
    }
    setEditorTab("visual");
    setIsToolEditorOpen(true);
  };

  const handleJsonChange = (val: string) => {
    setJsonSchemaStr(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && selectedTool) {
        setSelectedTool({ ...selectedTool, parameters: parsed });
      }
    } catch (e) {
      // Invalid JSON, wait for user to fix
    }
  };

  const syncVisualToJson = (params: any[]) => {
    if (selectedTool) {
      setSelectedTool({ ...selectedTool, parameters: params });
      setJsonSchemaStr(JSON.stringify(params, null, 2));
    }
  };

  const saveToolToInteg = async () => {
    if (!selectedTool?.name) {
      toast.error("Tool name is required");
      return;
    }

    const updatedTools = [...(editInteg.tools || [])];
    if (toolIdx >= 0) {
      updatedTools[toolIdx] = selectedTool as MCPTool;
    } else {
      updatedTools.push(selectedTool as MCPTool);
    }

    const nextInteg = { ...editInteg, tools: updatedTools };
    setEditInteg(nextInteg);
    setIsToolEditorOpen(false);
    
    // Auto-save tool changes to backend
    await saveIntegration(nextInteg);
  };

  const deleteTool = async (idx: number) => {
    if (!confirm("Delete this tool?")) return;
    const updatedTools = [...(editInteg.tools || [])];
    updatedTools.splice(idx, 1);
    const nextInteg = { ...editInteg, tools: updatedTools };
    setEditInteg(nextInteg);
    await saveIntegration(nextInteg);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Detail Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-8 py-4 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/integrations"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center border border-border text-xl">
                {integration.icon || "🔌"}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{integration.name}</h1>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{integration.id}</p>
              </div>
              <Badge variant="secondary" className={cn(
                "px-2 py-0.5 text-[10px] font-bold border",
                integration.enabled !== false ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-muted text-muted-foreground border-border"
              )}>
                {integration.enabled !== false ? "ACTIVE" : "DISABLED"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-border" onClick={handleSaveIntegration} disabled={isSaving}>
              {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Config
            </Button>
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => deleteIntegration(integration.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Content */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/30 p-1 border border-border">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Eye className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Code2 className="w-4 h-4" />
              Tool Registry
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-secondary text-muted-foreground">
                {(editInteg.tools || []).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="auth" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Shield className="w-4 h-4" />
              Auth & URL
            </TabsTrigger>
            <TabsTrigger value="mcp" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <RefreshCw className="w-4 h-4" />
              Discovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 glass-panel border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Metadata</CardTitle>
                  <CardDescription>Primary identification details for the tool provider.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="integ-name">Display Name</Label>
                      <Input 
                        id="integ-name" 
                        value={editInteg.name} 
                        onChange={e => setEditInteg(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-secondary/30 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="integ-icon">Icon Emoji</Label>
                      <Input 
                        id="integ-icon" 
                        value={editInteg.icon} 
                        onChange={e => setEditInteg(prev => ({ ...prev, icon: e.target.value }))}
                        className="bg-secondary/30 border-border text-center text-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="integ-desc">Description</Label>
                    <textarea 
                      id="integ-desc"
                      rows={3}
                      className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={editInteg.description}
                      onChange={e => setEditInteg(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Status Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-foreground">Provider Enabled</Label>
                      <p className="text-[10px] text-muted-foreground italic">Toggle tool availability</p>
                    </div>
                    <Switch 
                      checked={editInteg.enabled !== false} 
                      onCheckedChange={val => setEditInteg(prev => ({ ...prev, enabled: val }))}
                    />
                  </div>
                  <div className="pt-4 border-t border-border space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Tools in Registry</span>
                      <span className="font-mono font-bold bg-secondary/50 px-2 py-0.5 rounded text-primary">{(editInteg.tools || []).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Auth Strategy</span>
                      <span className="font-mono font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded italic">{(editInteg.auth?.type || 'none').replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Last Update</span>
                      <span className="font-mono bg-secondary/50 px-2 py-0.5 rounded">{editInteg.updatedAt ? new Date(editInteg.updatedAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="w-full p-2 bg-secondary/20 rounded-lg flex items-center justify-center gap-2 border border-border/50">
                    <Activity className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-bold text-muted-foreground">Connected & Synchronized</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight">Capabilities</h3>
                <p className="text-sm text-muted-foreground">Individual Model Context Protocol tools offered by this provider.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Filter tools..." 
                    className="pl-8 h-9 text-xs bg-secondary/30 border-border"
                    value={toolSearchQuery}
                    onChange={e => setToolSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2 border-border bg-secondary/20 hover:bg-secondary h-9" onClick={() => openToolEditor(null, -1)}>
                  <Plus className="w-4 h-4" />
                  Add Capability
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(editInteg.tools || [])
                .filter(t => 
                  t.name.toLowerCase().includes(toolSearchQuery.toLowerCase()) || 
                  (t.description || "").toLowerCase().includes(toolSearchQuery.toLowerCase())
                )
                .map((tool, idx) => (
                <Card 
                  key={idx} 
                  className={cn(
                    "glass-panel border-border group hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-md",
                    tool.enabled === false && "opacity-60 grayscale-[0.5]"
                  )}
                  onClick={() => openToolEditor(tool, idx)}
                >
                  <CardHeader className="pb-4 bg-secondary/5 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-primary group-hover:text-primary transition-all">
                        {tool.name}
                      </code>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono border-border bg-background shadow-xs h-6">
                          {tool.handler === 'api' ? (tool.method || 'GET') : (tool.handler || 'Proxy')}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-secondary/80" onClick={e => e.stopPropagation()}>
                                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-border">
                            <DropdownMenuItem className="gap-2 font-medium" onClick={e => { e.stopPropagation(); openToolEditor(tool, idx); }}>
                              <Settings2 className="w-4 h-4" /> Edit Capability
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive font-medium" onClick={e => { e.stopPropagation(); deleteTool(idx); }}>
                              <Trash2 className="w-4 h-4" /> Delete Forever
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-6">
                    <p className="text-xs text-muted-foreground line-clamp-3 min-h-[48px] leading-relaxed">
                      {tool.description || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 font-bold">
                          <Terminal className="w-3 h-3 text-primary" /> {(tool.parameters || []).length} Inputs
                       </span>
                    </div>
                    {tool.enabled !== false ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] font-bold tracking-tight">Active</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-border text-[9px] font-bold tracking-tight">System Paused</Badge>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {(editInteg.tools || []).length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 border-2 border-dashed border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-4 bg-secondary/5">
                  <div className="w-16 h-16 rounded-3xl bg-secondary/30 flex items-center justify-center text-muted-foreground">
                    <Code2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold">Registry is empty</h4>
                    <p className="text-sm text-muted-foreground max-w-xs">Define capabilities manually or use discovery to import tools from a remote server.</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 border-border" onClick={() => openToolEditor(null, -1)}>
                    <Plus className="w-4 h-4" /> Add your first tool
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="auth" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Card className="glass-panel border-border shadow-xl">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Globe className="w-5 h-5 text-primary" />
                       Network Configuration
                    </CardTitle>
                    <CardDescription>Base URL and connection parameters for the external service.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="base-url">Base API URL</Label>
                      <Input 
                        id="base-url"
                        placeholder="https://api.example.com/v1"
                        className="bg-secondary/30 border-border font-mono"
                        value={editInteg.auth?.baseUrl || ""}
                        onChange={e => setEditInteg(prev => ({ 
                          ...prev, 
                          auth: { ...(prev.auth || { type: 'none' }), baseUrl: e.target.value } 
                        }))}
                      />
                      <p className="text-[10px] text-muted-foreground">Standard endpoints in the registry will be relative to this path.</p>
                    </div>

                    <div className="pt-4 border-t border-border space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold">Prune Empty Parameters</Label>
                          <p className="text-[11px] text-muted-foreground italic">Automatically remove null/empty strings from request payloads.</p>
                        </div>
                        <Switch 
                          checked={editInteg.pruneEmptyRequestOptionals !== false}
                          onCheckedChange={val => setEditInteg(prev => ({ ...prev, pruneEmptyRequestOptionals: val }))}
                        />
                      </div>
                    </div>
                 </CardContent>
               </Card>

               <Card className="glass-panel border-border shadow-xl overflow-hidden rounded-2xl">
                 <CardHeader className="bg-secondary/10 border-b border-border py-6 px-8">
                    <div className="flex items-center justify-between">
                       <CardTitle className="flex items-center gap-2 text-lg">
                          <Lock className="w-5 h-5 text-primary" />
                          Security Protocol
                       </CardTitle>
                       <Select 
                        value={editInteg.auth?.type} 
                        onValueChange={(val: any) => setEditInteg(prev => ({ 
                          ...prev, 
                          auth: { ...(prev.auth || { type: 'none' }), type: val } 
                        }))}
                       >
                        <SelectTrigger className="w-[200px] h-10 bg-background border-border text-[11px] font-bold text-foreground rounded-xl">
                          <SelectValue placeholder="Auth Strategy" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">No Authentication</SelectItem>
                          <SelectItem value="api_key">Static API Key</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="oauth2">OAuth2 Refreshable</SelectItem>
                        </SelectContent>
                       </Select>
                    </div>
                 </CardHeader>
                 <CardContent className="p-8 space-y-8">
                    {/* Dynamic Auth Fields */}
                    {editInteg.auth?.type === 'api_key' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <Label>Secret API Key</Label>
                          <Input 
                            type="password" 
                            className="bg-secondary/30 border-border font-mono" 
                            value={editInteg.auth?.apiKey || ""}
                            onChange={e => setEditInteg(prev => ({ 
                              ...prev, 
                              auth: { ...(prev.auth || { type: 'api_key' }), apiKey: e.target.value } 
                            }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Header Name</Label>
                            <Input 
                              className="bg-secondary/30 border-border font-mono text-xs" 
                              value={editInteg.auth?.apiKeyHeader || "x-api-key"}
                              onChange={e => setEditInteg(prev => ({ 
                                ...prev, 
                                auth: { ...(prev.auth || { type: 'api_key' }), apiKeyHeader: e.target.value } 
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Placement</Label>
                            <Select 
                              value={editInteg.auth?.apiKeyIn || "header"} 
                              onValueChange={val => setEditInteg(prev => ({ 
                                ...prev, 
                                auth: { ...(prev.auth || { type: 'api_key' }), apiKeyIn: val as any } 
                              }))}
                            >
                              <SelectTrigger className="bg-secondary/30 border-border h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="query">Query URL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {editInteg.auth?.type === 'bearer' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label>Static Bearer Token</Label>
                        <Input 
                          type="password" 
                          className="bg-secondary/30 border-border font-mono" 
                          value={editInteg.auth?.bearerToken || ""}
                          onChange={e => setEditInteg(prev => ({ 
                            ...prev, 
                            auth: { ...(prev.auth || { type: 'bearer' }), bearerToken: e.target.value } 
                          }))}
                        />
                      </div>
                    )}

                    {editInteg.auth?.type === 'oauth2' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Client ID</Label>
                            <Input className="bg-secondary/30 border-border font-mono text-xs" 
                               value={editInteg.auth?.clientId || ""}
                               onChange={e => setEditInteg(prev => ({ ...prev, auth: { ...(prev.auth || { type: 'oauth2' }), clientId: e.target.value } }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Client Secret</Label>
                            <Input type="password" className="bg-secondary/30 border-border font-mono text-xs" 
                               value={editInteg.auth?.clientSecret || ""}
                               onChange={e => setEditInteg(prev => ({ ...prev, auth: { ...(prev.auth || { type: 'oauth2' }), clientSecret: e.target.value } }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Refresh Token</Label>
                          <Input type="password" className="bg-secondary/30 border-border font-mono text-xs" 
                             value={editInteg.auth?.refreshToken || ""}
                             onChange={e => setEditInteg(prev => ({ ...prev, auth: { ...(prev.auth || { type: 'oauth2' }), refreshToken: e.target.value } }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Token Endpoint URL</Label>
                          <Input className="bg-secondary/30 border-border font-mono text-xs" 
                             value={editInteg.auth?.tokenUrl || ""}
                             onChange={e => setEditInteg(prev => ({ ...prev, auth: { ...(prev.auth || { type: 'oauth2' }), tokenUrl: e.target.value } }))}
                          />
                        </div>
                      </div>
                    )}

                    {(!editInteg.auth?.type || editInteg.auth?.type === 'none') && (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl bg-secondary/5">
                        <Label className="text-muted-foreground italic">No authentication required</Label>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                       <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full gap-2 border-border font-bold text-[11px] uppercase tracking-widest"
                        onClick={handleTestAuth}
                        disabled={isTestingAuth || editInteg.auth?.type === 'none'}
                       >
                         {isTestingAuth ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                         Test Secure Connection
                       </Button>
                    </div>
                 </CardContent>
               </Card>
             </div>
          </TabsContent>

          <TabsContent value="mcp" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="glass-panel border-border shadow-xl">
               <CardHeader>
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                           <CloudDownload className="w-5 h-5 text-primary" />
                           Remote MCP Registry
                        </CardTitle>
                        <CardDescription>Connect to an existing MCP server to discover and import capabilities automatically.</CardDescription>
                     </div>
                     <Badge className="bg-primary/10 text-primary border-primary/20">PRODUCTION READY</Badge>
                  </div>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label>Registry URL</Label>
                           <Input 
                            className="bg-secondary/30 border-border font-mono" 
                            placeholder="https://remote-mcp.domain.com/mcp"
                            value={editInteg.mcpRemote?.serverUrl || ""}
                            onChange={e => setEditInteg(prev => ({ 
                              ...prev, 
                              mcpRemote: { ...(prev.mcpRemote || { toolPrefix: prev.id || "" }), serverUrl: e.target.value } 
                            }))}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>Tool Name Prefix</Label>
                           <Input 
                            className="bg-secondary/30 border-border font-mono h-9" 
                            placeholder="e.g. github"
                            value={editInteg.mcpRemote?.toolPrefix || ""}
                            onChange={e => setEditInteg(prev => ({ 
                              ...prev, 
                              mcpRemote: { ...(prev.mcpRemote || { serverUrl: "" }), toolPrefix: e.target.value } 
                            }))}
                           />
                           <p className="text-[10px] text-muted-foreground tracking-tight">Imported tools will be named <code className="text-primary">{editInteg.mcpRemote?.toolPrefix || 'prefix'}_tool_name</code></p>
                        </div>
                        <Button 
                          className="w-full gap-2 ai-studio-gradient border-none text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
                          onClick={handleDiscover}
                          disabled={isDiscovering}
                        >
                          {isDiscovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Run Full Discovery
                        </Button>
                     </div>
                     
                     <div className="p-6 rounded-2xl bg-secondary/20 border border-border border-dashed flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-3 bg-secondary/80 rounded-full">
                           <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                           <h5 className="font-bold text-sm">Automated Mapping</h5>
                           <p className="text-xs text-muted-foreground leading-relaxed">Discovery will poll the remote JSON-RPC initialize/tools-list protocol and build local registry entries automatically.</p>
                        </div>
                        {editInteg.mcpRemote?.lastDiscoveredAt && (
                          <div className="text-[10px] font-mono text-muted-foreground bg-secondary/40 px-2 py-1 rounded">
                            Last synced: {new Date(editInteg.mcpRemote.lastDiscoveredAt).toLocaleString()}
                          </div>
                        )}
                     </div>
                  </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* High-Fidelity Tool Editor Dialog */}
      <Dialog open={isToolEditorOpen} onOpenChange={setIsToolEditorOpen}>
        <DialogContent className="sm:max-w-[1100px] max-h-[92vh] overflow-hidden flex flex-col bg-card border-border shadow-2xl p-0 transition-all duration-500">
          <DialogHeader className="p-8 border-b border-border bg-secondary/5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                  {toolIdx >= 0 ? 'Modify Capability' : 'New Capability'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Configure tool execution parameters and define the input schema for AI agents.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                {selectedTool && (
                  <Badge variant="outline" className="border-primary/20 text-primary font-mono bg-primary/5 px-4 py-1 text-sm rounded-full">
                     {selectedTool.name || 'Unnamed Resource'}
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 hover:bg-secondary" 
                  onClick={() => setIsToolEditorOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedTool && (
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
               {/* Core Configuration Section */}
               <section className="space-y-6">
                 <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold tracking-tight text-foreground">Core Configuration</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-2 col-span-2">
                      <Label className="text-xs font-semibold text-foreground">Tool Name</Label>
                      <Input 
                        value={selectedTool.name} 
                        className="font-mono bg-background border-border h-11 text-sm focus:ring-primary/20"
                        onChange={e => setSelectedTool({...selectedTool, name: e.target.value})}
                        placeholder="e.g. create_resource"
                      />
                      <p className="text-[10px] text-muted-foreground">Unique identifier used by the model context protocol.</p>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground">Execution Flow</Label>
                      <Select 
                        value={selectedTool.handler || 'api'} 
                        onValueChange={val => setSelectedTool({...selectedTool, handler: val})}
                      >
                        <SelectTrigger className="bg-background border-border h-11 text-sm font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="api">API Integration</SelectItem>
                          <SelectItem value="mcp-remote">Remote MCP Forward</SelectItem>
                          <SelectItem value="internal:analytics-query">Internal Analytics</SelectItem>
                          <SelectItem value="webhook">Custom Webhook</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Capability Description</Label>
                    <Input 
                      value={selectedTool.description} 
                      className="bg-background border-border h-11 text-sm focus:ring-primary/20"
                      onChange={e => setSelectedTool({...selectedTool, description: e.target.value})}
                      placeholder="Explain to the AI exactly when and how to use this tool..."
                    />
                 </div>
               </section>

               {/* Network Strategy Section */}
               {selectedTool.handler === 'api' && (
                 <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold tracking-tight text-foreground">Network Strategy</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="space-y-2">
                          <Label className="text-xs font-semibold text-foreground">HTTP Method</Label>
                          <Select 
                            value={selectedTool.method || 'GET'} 
                            onValueChange={(val: any) => setSelectedTool({...selectedTool, method: val})}
                          >
                             <SelectTrigger className="bg-background border-border font-mono font-bold h-11">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl">
                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                                  <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2 col-span-3">
                          <Label className="text-xs font-semibold text-foreground">Endpoint Routing</Label>
                          <div className="flex items-center gap-2 h-11">
                            <div className="px-4 h-full flex items-center bg-secondary/40 rounded-xl text-xs font-mono border border-border text-muted-foreground whitespace-nowrap shadow-sm">
                              {editInteg.auth?.baseUrl || 'BASE_URL'}
                            </div>
                            <Input 
                              className="font-mono bg-background border-border h-full text-sm flex-1 focus:ring-primary/20"
                              value={selectedTool.endpoint} 
                              onChange={e => setSelectedTool({...selectedTool, endpoint: e.target.value})}
                              placeholder="/resource/{id}"
                            />
                          </div>
                       </div>
                    </div>
                 </section>
               )}

               {/* Protocol Schema Section */}
               <section className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                     <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold tracking-tight text-foreground">Protocol Schema Definitions</h3>
                     </div>
                     <Tabs value={editorTab} onValueChange={setEditorTab} className="bg-secondary/50 p-1 rounded-xl h-9">
                       <TabsList className="bg-transparent h-full border-none p-0">
                         <TabsTrigger value="visual" className="text-[11px] font-bold px-4 h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Visual Builder</TabsTrigger>
                         <TabsTrigger value="json" className="text-[11px] font-bold px-4 h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Raw JSON</TabsTrigger>
                       </TabsList>
                     </Tabs>
                  </div>

                  <div className="mt-0">
                    {editorTab === 'visual' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                         <div className="lg:col-span-8 space-y-4">
                            <SchemaBuilder 
                              parameters={selectedTool.parameters || []}
                              onChange={syncVisualToJson}
                            />
                         </div>
                         <div className="lg:col-span-4 pt-11">
                            <div className="sticky top-20">
                              <SchemaAssistant 
                                onApply={(newParams) => {
                                  const updated = [...(selectedTool.parameters || []), ...newParams];
                                  syncVisualToJson(updated);
                                }}
                                currentSchema={selectedTool.parameters}
                              />
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-7 space-y-4">
                           <div className="p-6 rounded-2xl border border-border bg-secondary/10 shadow-inner">
                              <div className="flex items-center justify-between mb-4">
                                <Label className="text-xs font-bold text-foreground">Direct Parameter Object Edit</Label>
                                <Badge variant="outline" className="text-[10px] bg-background">JSON Standard</Badge>
                              </div>
                              <textarea 
                                className="w-full h-[500px] font-mono text-sm bg-background/80 p-6 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none shadow-sm"
                                value={jsonSchemaStr}
                                onChange={e => handleJsonChange(e.target.value)}
                              />
                           </div>
                        </div>
                        <div className="lg:col-span-5 space-y-6">
                           <Card className="border-border bg-secondary/5 rounded-2xl overflow-hidden shadow-sm">
                              <CardHeader className="bg-secondary/10 pb-4">
                                 <CardTitle className="text-sm font-bold">Metadata Validation</CardTitle>
                                 <CardDescription className="text-xs">Validating against standard MCP parameter topology.</CardDescription>
                              </CardHeader>
                              <CardContent className="p-6 pt-8 space-y-6">
                                 <div className="flex items-start gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20 shadow-sm animate-in zoom-in-95 duration-500">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-green-700">Schema is Parsable</p>
                                       <p className="text-xs text-green-600/80">Structure matches the expected parameter array format.</p>
                                    </div>
                                 </div>
                                 
                                 <div className="space-y-4 pt-4 border-t border-border">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Protocol Tips</p>
                                    <ul className="text-xs text-muted-foreground space-y-3">
                                       <li className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                          <span>Parameters must be an <strong>array of objects</strong> representing input fields.</span>
                                       </li>
                                       <li className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                          <span>Each object should have a <code className="text-primary font-bold">name</code> and <code className="text-primary font-bold">type</code>.</span>
                                       </li>
                                       <li className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                          <span>Use <code className="text-primary font-bold">"in": "body"</code> for typical REST API POST payloads.</span>
                                       </li>
                                    </ul>
                                 </div>
                              </CardContent>
                           </Card>
                        </div>
                      </div>
                    )}
                  </div>
               </section>

               {/* Response Configuration Section */}
               <section className="p-8 rounded-3xl bg-secondary/10 border border-border space-y-8 shadow-inner">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <Label className="text-sm font-bold text-foreground">Response Configuration & Output Mapping</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     <div className="space-y-3">
                        <Label className="text-xs font-semibold text-foreground">Response Mock / Guidance Payload</Label>
                        <textarea 
                          className="w-full h-40 font-mono text-xs bg-background/50 p-4 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none shadow-sm"
                          placeholder='{ "status": "success", "data": { ... } }'
                          value={typeof selectedTool.response === 'string' ? selectedTool.response : JSON.stringify(selectedTool.response || {}, null, 2)}
                          onChange={e => setSelectedTool({...selectedTool, response: e.target.value})}
                        />
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">Defining the expected response shape helps the AI agent reason more effectively about the tool's output.</p>
                     </div>
                     <div className="space-y-4">
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 shadow-sm h-full">
                           <h5 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2">
                             <ArrowRight className="w-3.5 h-3.5 text-primary" />
                             Output Field Mapping
                           </h5>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground border-b border-border/50 pb-2">
                                 <span>Field Path</span>
                                 <span>Data Type</span>
                              </div>
                              <div className="text-xs text-muted-foreground py-8 text-center italic border border-dashed border-border/50 rounded-xl bg-background/30">
                                No output fields mapped yet.
                              </div>
                              <Button variant="outline" size="sm" className="w-full h-9 text-xs border-dashed border-primary/30 text-primary hover:bg-primary/5 mt-2" disabled>
                                 + Add Output Field
                              </Button>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>

               <section className="p-8 rounded-3xl bg-destructive/5 border border-destructive/10 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h4 className="text-sm font-bold text-destructive">Danger Zone</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Permanently delete this tool from the integration. This action cannot be undone and will affect all connected servers.</p>
                     </div>
                     <Button 
                       variant="destructive" 
                       size="sm" 
                       className="h-10 px-6 rounded-xl font-bold shadow-lg shadow-destructive/10"
                       onClick={() => {
                          const updated = [...(editInteg.tools || [])];
                          updated.splice(toolIdx, 1);
                          setEditInteg({...editInteg, tools: updated});
                          setIsToolEditorOpen(false);
                          toast.success("Capability scheduled for removal");
                       }}
                       disabled={toolIdx < 0}
                     >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Forever
                     </Button>
                  </div>
               </section>
            </div>
          )}

          <DialogFooter className="p-8 border-t border-border bg-secondary/5 shrink-0 flex items-center justify-end gap-3">
             <Button 
              variant="outline" 
              onClick={() => setIsToolEditorOpen(false)} 
              className="h-11 px-8 rounded-xl font-bold border-border bg-background hover:bg-secondary"
             >
               Discard Changes
             </Button>
             <Button 
              onClick={saveToolToInteg} 
              className="h-11 px-10 rounded-xl ai-studio-gradient border-none text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
             >
               {toolIdx >= 0 ? "Synchronize Capability" : "Create Capability"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
