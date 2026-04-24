import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Shield, 
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
  Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMCP } from "@/context/MCPContext";
import { cn } from "@/lib/utils";
import SchemaAssistant from "@/components/SchemaAssistant";
import { MCPTool } from "@/types";
import { toast } from "sonner";

export default function IntegrationDetail() {
  const { id } = useParams();
  const { integrations, updateIntegration } = useMCP();
  const integration = integrations.find(i => i.id === id);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [isToolEditorOpen, setIsToolEditorOpen] = useState(false);

  if (!integration) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Integration not found</h2>
        <Button asChild variant="outline">
          <Link to="/integrations">Back to Integrations</Link>
        </Button>
      </div>
    );
  }

  const handleAddTool = () => {
    const newTool: MCPTool = {
      id: `tool_${Math.random().toString(36).substr(2, 5)}`,
      name: "New Tool",
      description: "Describe what this tool does",
      method: "POST",
      endpoint: "/api/v1/resource",
      parameters: [],
      inputSchema: JSON.stringify({ type: "object", properties: {} }, null, 2),
      enabled: true
    };
    setSelectedTool(newTool);
    setIsToolEditorOpen(true);
  };

  const handleEditTool = (tool: MCPTool) => {
    setSelectedTool({ ...tool });
    setIsToolEditorOpen(true);
  };

  const handleSaveTool = () => {
    if (!selectedTool || !integration) return;
    
    const toolExists = integration.tools.find(t => t.id === selectedTool.id);
    const updatedTools = toolExists 
      ? integration.tools.map(t => t.id === selectedTool.id ? selectedTool : t)
      : [...integration.tools, selectedTool];
    
    updateIntegration(integration.id, { 
      tools: updatedTools, 
      toolCount: updatedTools.length 
    });
    
    setIsToolEditorOpen(false);
    toast.success("Tool configuration saved");
  };

  const handleDeleteTool = (toolId: string) => {
    if (!integration) return;
    const updatedTools = integration.tools.filter(t => t.id !== toolId);
    updateIntegration(integration.id, { 
      tools: updatedTools, 
      toolCount: updatedTools.length 
    });
    toast.success("Tool deleted");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Detail Header */}
      <div className="bg-card border-b px-8 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/integrations" className="hover:text-foreground transition-colors">Integrations</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{integration.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center border border-white/5">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{integration.name}</h1>
                <p className="text-sm text-muted-foreground font-mono">{integration.id}</p>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5 text-[10px] font-bold">
                ENABLED
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5 text-xs">
                <Play className="w-3.5 h-3.5" />
                Test
              </Button>
              <Button size="sm" className="gap-2 text-xs shadow-lg shadow-primary/20">
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Content */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary/30 p-1 border border-white/5">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Eye className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Code2 className="w-4 h-4" />
              Tools
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-white/5 text-muted-foreground">{integration.toolCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="auth" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Shield className="w-4 h-4" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Settings2 className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 glass-panel">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>General details and description of the integration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Integration Name</Label>
                    <Input defaultValue={integration.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <textarea 
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={integration.description}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle>Status & Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Integration Enabled</Label>
                      <p className="text-[10px] text-muted-foreground">Toggle server availability</p>
                    </div>
                    <Switch defaultChecked={integration.status === 'enabled'} />
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Synced</span>
                      <span className="font-mono">2m ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="text-green-600 font-medium">99.9%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latency</span>
                      <span className="font-mono">124ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Configured Tools</h3>
                    <p className="text-sm text-muted-foreground">Manage the specific MCP tools exposed by this integration.</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleAddTool}>
                    <Plus className="w-4 h-4" />
                    Add Tool
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {integration.tools.map((tool) => (
                    <Card 
                      key={tool.id} 
                      className="glass-panel hover:border-primary/50 transition-colors cursor-pointer group"
                      onClick={() => handleEditTool(tool)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.name}</div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-mono text-[10px]">{tool.method}</Badge>
                          <div className="h-4 w-px bg-border" />
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {integration.tools.length === 0 && (
                    <div className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 bg-secondary/20">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Code2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">No tools configured</p>
                        <p className="text-xs text-muted-foreground">This integration doesn't have any tools defined yet.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleAddTool}>Add your first tool</Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <SchemaAssistant />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Authentication Configuration</CardTitle>
                <CardDescription>Configure how the MCP server authenticates with the external API.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Auth Strategy</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {['None', 'API Key', 'OAuth2', 'Bearer Token'].map((type) => (
                      <div 
                        key={type}
                        className={cn(
                          "border rounded-lg p-3 text-center cursor-pointer hover:border-primary transition-colors",
                          integration.authType.replace('-', ' ').toLowerCase() === type.toLowerCase() 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "bg-secondary/30"
                        )}
                      >
                        <p className="text-xs font-medium">{type}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input defaultValue={integration.config.clientId || ""} placeholder="Enter client ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input type="password" value="••••••••••••••••" readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tool Editor Dialog */}
      <Dialog open={isToolEditorOpen} onOpenChange={setIsToolEditorOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTool?.id.startsWith('tool_') && selectedTool.name === 'New Tool' ? 'Add New Tool' : 'Edit Tool Configuration'}</DialogTitle>
            <DialogDescription>
              Configure the technical parameters and schema for this MCP tool.
            </DialogDescription>
          </DialogHeader>

          {selectedTool && (
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tool Name</Label>
                  <Input 
                    value={selectedTool.name} 
                    onChange={e => setSelectedTool({...selectedTool, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedTool.method}
                    onChange={e => setSelectedTool({...selectedTool, method: e.target.value as any})}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endpoint Path</Label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-secondary rounded-md text-xs font-mono text-muted-foreground">
                    {integration.serverUrl}
                  </div>
                  <Input 
                    className="font-mono"
                    value={selectedTool.endpoint} 
                    onChange={e => setSelectedTool({...selectedTool, endpoint: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={selectedTool.description} 
                  onChange={e => setSelectedTool({...selectedTool, description: e.target.value})}
                />
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="schema">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      Input Schema (JSON Schema)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-xs text-muted-foreground">
                        Define the expected input structure for this tool using standard JSON Schema.
                      </p>
                      <textarea 
                        className="w-full min-h-[200px] font-mono text-xs p-4 bg-black text-green-400 rounded-lg border-none focus:ring-0"
                        value={selectedTool.inputSchema}
                        onChange={e => setSelectedTool({...selectedTool, inputSchema: e.target.value})}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="preview">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Response Preview Area
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-secondary/30 rounded-lg border border-dashed border-muted-foreground/20 text-center py-8">
                      <p className="text-xs text-muted-foreground italic">
                        No live preview available. Test the tool to see sample responses.
                      </p>
                      <Button variant="outline" size="sm" className="mt-4 gap-2">
                        <Play className="w-3.5 h-3.5" />
                        Run Test Request
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={selectedTool.enabled} 
                    onCheckedChange={checked => setSelectedTool({...selectedTool, enabled: checked})}
                  />
                  <Label>Tool Enabled</Label>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove Tool
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsToolEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTool}>Save Tool Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
