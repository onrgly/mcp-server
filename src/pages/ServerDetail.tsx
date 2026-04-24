import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Server, 
  ChevronLeft, 
  Settings, 
  Blocks, 
  Copy, 
  Save, 
  Trash2, 
  Activity,
  Play,
  Pause,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  X,
  Check,
  Plus,
  Shield
} from "lucide-react";
import { useMCP } from "@/context/MCPContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MCPServer, MCPIntegration } from "@/types";

export default function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { servers, integrations, saveServer, deleteServer, loading } = useMCP();
  const server = servers.find(s => s.id === id);
  
  const [activeTab, setActiveTab] = useState("integrations");
  const [isSaving, setIsSaving] = useState(false);
  const [integSearchQuery, setIntegSearchQuery] = useState("");
  const [assignedSearchQuery, setAssignedSearchQuery] = useState("");
  
  // Local state for edits
  const [editName, setEditName] = useState(server?.name || "");
  const [selectedIntegIds, setSelectedIntegIds] = useState<string[]>(server?.integrationIds || []);
  const [toolFilter, setToolFilter] = useState<Record<string, string[]>>(server?.toolFilter || {});

  // Update local state if server data refreshes
  React.useEffect(() => {
    if (server) {
      setEditName(server.name);
      setSelectedIntegIds(server.integrationIds || []);
      setToolFilter(server.toolFilter || {});
    }
  }, [server]);

  if (!server && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Server className="w-16 h-16 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-bold">Server not found</h2>
        <Button asChild variant="outline">
          <Link to="/servers">Back to Servers</Link>
        </Button>
      </div>
    );
  }

  const connectionUrl = `${window.location.origin}/mcp/${server?.id}?key=${server?.key}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(connectionUrl);
    toast.success("Connection URL copied");
  };

  const handleSave = async () => {
    if (!server) return;
    setIsSaving(true);
    await saveServer({
      id: server.id,
      name: editName,
      integrationIds: selectedIntegIds,
      toolFilter: Object.keys(toolFilter).length > 0 ? toolFilter : undefined
    });
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!server) return;
    await deleteServer(server.id);
    navigate("/servers");
  };

  const toggleIntegration = (integId: string) => {
    setSelectedIntegIds(prev => 
      prev.includes(integId) 
        ? prev.filter(id => id !== integId) 
        : [...prev, integId]
    );
  };

  const toggleTool = (integId: string, toolId: string) => {
    setToolFilter(prev => {
      const current = prev[integId] || integrations.find(i => i.id === integId)?.tools.map(t => t.id) || [];
      const updated = current.includes(toolId) 
        ? current.filter(id => id !== toolId)
        : [...current, toolId];
      
      const newFilter = { ...prev, [integId]: updated };
      // If all tools are selected, remove the filter for this integration to keep it clean
      const allToolIds = integrations.find(i => i.id === integId)?.tools.map(t => t.id) || [];
      if (updated.length === allToolIds.length) {
        delete newFilter[integId];
      }
      return newFilter;
    });
  };

  const serverIntegs = integrations
    .filter(i => selectedIntegIds.includes(i.id))
    .filter(i => 
      i.name.toLowerCase().includes(assignedSearchQuery.toLowerCase()) || 
      i.id.toLowerCase().includes(assignedSearchQuery.toLowerCase()) ||
      (i.tools || []).some(t => t.name.toLowerCase().includes(assignedSearchQuery.toLowerCase()))
    );

  const availableIntegs = integrations.filter(i => 
    !selectedIntegIds.includes(i.id) && 
    (i.name.toLowerCase().includes(integSearchQuery.toLowerCase()) || i.id.toLowerCase().includes(integSearchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-8 py-4 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/servers"><ChevronLeft className="w-5 h-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{server?.name}</h1>
                <p className="text-xs text-muted-foreground font-mono">{server?.id}</p>
              </div>
              {server?.enabled !== false ? (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5 text-[10px] font-bold">
                  ● ACTIVE
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-bold">
                  ● PAUSED
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-border" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button variant="destructive" size="sm" className="gap-2" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete Server
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* URL Box */}
        <Card className="glass-panel border-border shadow-xl">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Connection URL
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <div className="p-3 bg-secondary/30 border border-border rounded-xl font-mono text-xs flex-1 truncate select-all">
              {connectionUrl}
            </div>
            <Button variant="secondary" size="sm" onClick={copyUrl} className="gap-2 shrink-0">
              <Copy className="w-3.5 h-3.5" />
              Copy URL
            </Button>
          </CardContent>
          <div className="px-6 pb-4">
            <p className="text-[10px] text-muted-foreground">
              Provide this URL to your AI Agent or proxy gateway to access the enabled tools.
            </p>
          </div>
        </Card>

        {/* Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-secondary/30 p-1 border border-border">
                <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Blocks className="w-4 h-4" />
                  Integration & Tools
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-secondary text-muted-foreground">
                    {selectedIntegIds.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Settings className="w-4 h-4" />
                  Server Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="integrations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between gap-4">
                   <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search assigned integrations or tools..." 
                        className="pl-10 bg-secondary/30 border-border"
                        value={assignedSearchQuery}
                        onChange={e => setAssignedSearchQuery(e.target.value)}
                      />
                   </div>
                   <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 border-border bg-secondary/20">
                        <Plus className="w-4 h-4" />
                        Assign Integration
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Assign Integrations</DialogTitle>
                        <DialogDescription>Select Model Context Protocol integrations to include in this endpoint.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Input 
                          placeholder="Filter available integrations..." 
                          value={integSearchQuery}
                          onChange={e => setIntegSearchQuery(e.target.value)}
                          className="bg-secondary/30 border-border"
                        />
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                          {availableIntegs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                              No more integrations available to assign.
                            </div>
                          ) : (
                            availableIntegs.map(integ => (
                              <div 
                                key={integ.id} 
                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                                onClick={() => toggleIntegration(integ.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{integ.icon || "🔌"}</span>
                                  <div>
                                    <p className="font-semibold text-sm">{integ.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{integ.id}</p>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                                  Assign
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </DialogContent>
                   </Dialog>
                </div>

                <div className="space-y-4">
                  {serverIntegs.length === 0 ? (
                    <Card className="glass-panel border-border border-dashed py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <Blocks className="w-12 h-12 text-muted-foreground opacity-30" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">No integrations assigned</p>
                        <p className="text-xs text-muted-foreground">Click "Assign Integration" to start building your endpoint.</p>
                      </div>
                    </Card>
                  ) : (
                    serverIntegs.map(integ => {
                      const isFiltered = !!toolFilter[integ.id];
                      const activeToolIds = toolFilter[integ.id] || integ.tools.map(t => t.id);
                      
                      return (
                        <Card key={integ.id} className="glass-panel border-border overflow-hidden">
                          <CardHeader className="bg-secondary/10 p-4 border-b border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{integ.icon || "🔌"}</span>
                                <div>
                                  <CardTitle className="text-base font-bold">{integ.name}</CardTitle>
                                  <CardDescription className="text-xs">{integ.id}</CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn(
                                  "text-[10px] font-bold border-border bg-secondary/30",
                                  isFiltered ? "text-primary border-primary/20" : "text-muted-foreground"
                                )}>
                                  {activeToolIds.length}/{integ.tools.length} TOOLS
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => toggleIntegration(integ.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Enabled Capabilities</Label>
                                <span className="text-[10px] text-muted-foreground">Select tools to expose through this endpoint</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {integ.tools.map(tool => {
                                  const isActive = activeToolIds.includes(tool.id);
                                  return (
                                    <div 
                                      key={tool.id} 
                                      className={cn(
                                        "group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                                        isActive 
                                          ? "bg-primary/5 border-primary/30 shadow-sm" 
                                          : "bg-secondary/10 border-transparent opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:border-border"
                                      )}
                                      onClick={() => toggleTool(integ.id, tool.id)}
                                    >
                                      <div className="flex flex-col h-full gap-2 relative z-10">
                                        <div className="flex items-center justify-between">
                                          <code className={cn(
                                            "text-xs font-bold font-mono tracking-tight transition-colors",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                          )}>
                                            {tool.name}
                                          </code>
                                          {isActive ? (
                                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white">
                                              <Check className="w-2.5 h-2.5" />
                                            </div>
                                          ) : (
                                            <div className="w-4 h-4 rounded-full border border-border" />
                                          )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                                          {tool.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                           <Badge variant="outline" className="text-[8px] px-1 py-0 border-border bg-background/50 uppercase font-mono">
                                              {tool.method || "GET"}
                                           </Badge>
                                        </div>
                                      </div>
                                      {isActive && (
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-primary/10 rounded-bl-3xl -mr-1 -mt-1" />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="glass-panel border-border overflow-hidden">
                  <CardHeader>
                    <CardTitle>Basic Configuration</CardTitle>
                    <CardDescription>Modify server metadata and primary control states.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="server-name">Server Display Name</Label>
                      <Input 
                        id="server-name" 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="bg-secondary/30 border-border"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-bold text-sm text-orange-500">
                          <Activity className="w-4 h-4" />
                          Endpoint Status
                        </div>
                        <p className="text-xs text-muted-foreground">Disabling the endpoint will reject all incoming tool calls.</p>
                      </div>
                      <Switch 
                        checked={server?.enabled !== false} 
                        onCheckedChange={(checked) => saveServer({ id: server?.id, enabled: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-destructive/20 bg-destructive/5 glass-panel">
                  <CardHeader>
                    <CardTitle className="text-destructive text-base">Danger Zone</CardTitle>
                    <CardDescription>Permanently remove this endpoint and deactivate its URL.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleDelete} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Server Permanently
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="glass-panel border-border shadow-xl">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Endpoint Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase leading-none">Status</p>
                    <p className={cn("text-xs font-bold uppercase", server?.enabled !== false ? "text-green-500" : "text-muted-foreground")}>
                      {server?.enabled !== false ? "Online" : "Offline"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase leading-none">Created</p>
                    <p className="text-xs font-bold">{new Date(server?.createdAt || "").toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase leading-none">Integrations</p>
                    <p className="text-xs font-bold">{selectedIntegIds.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase leading-none">Active Tools</p>
                    <p className="text-xs font-bold">
                      {serverIntegs.reduce((acc, integ) => acc + (toolFilter[integ.id] || integ.tools).length, 0)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-border space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Shield className="w-3.5 h-3.5" />
                      Security Note
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      All integrations share the same server key. For high-security environments, use separate endpoints for sensitive tools.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border overflow-hidden">
               <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  System Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-center space-y-2">
                 <p className="text-xs text-muted-foreground italic">No metrics recorded for this server yet.</p>
                 <Button variant="ghost" size="sm" className="text-[10px] h-7" disabled>View Dashboard Stats</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
