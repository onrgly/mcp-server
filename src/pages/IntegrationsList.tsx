import { 
  Search, 
  Plus, 
  MoreVertical, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Play,
  Filter,
  Shield,
  Activity,
  History,
  Cloud,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Code2
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
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
import { useMCP } from "@/context/MCPContext";
import { toast } from "sonner";
import { MCPIntegration, AuthType } from "@/types";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function IntegrationsList() {
  const { integrations, saveIntegration, deleteIntegration, loading, refreshData } = useMCP();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [newIntegration, setNewIntegration] = useState<Partial<MCPIntegration>>({
    name: '',
    id: '',
    description: '',
    enabled: true,
    auth: { type: 'none' }
  });

  const filteredIntegrations = integrations.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.tools || []).some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateIntegration = async () => {
    if (!newIntegration.name || !newIntegration.id) {
      toast.error("Name and ID are required");
      return;
    }
    await saveIntegration(newIntegration);
    setIsAddDialogOpen(false);
    setNewIntegration({ name: '', id: '', description: '', enabled: true, auth: { type: 'none' } });
  };

  const syncAll = async () => {
    toast.promise(refreshData(), {
      loading: 'Syncing with registry...',
      success: 'Data refreshed',
      error: 'Sync failed'
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Integrations</h1>
          <p className="text-muted-foreground">Registry of all tool providers and external connectors.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-border hover:bg-secondary" onClick={syncAll}>
            <Activity className="w-4 h-4" />
            Refresh Registry
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 ai-studio-gradient border-none text-white shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Integration</DialogTitle>
                <DialogDescription>
                  Define a new source for Model Context Protocol tools.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. GitHub" 
                      value={newIntegration.name}
                      onChange={e => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                      onBlur={() => {
                        if (!newIntegration.id && newIntegration.name) {
                          setNewIntegration(prev => ({ ...prev, id: (prev.name || '').toLowerCase().replace(/\s+/g, '-') }));
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id">Unique ID</Label>
                    <Input 
                      id="id" 
                      placeholder="e.g. github" 
                      value={newIntegration.id}
                      onChange={e => setNewIntegration(prev => ({ ...prev, id: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input 
                    id="desc" 
                    placeholder="Short summary of this integration" 
                    value={newIntegration.description}
                    onChange={e => setNewIntegration(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base Authentication</Label>
                  <Select 
                    value={newIntegration.auth?.type} 
                    onValueChange={(val: any) => setNewIntegration(prev => ({ ...prev, auth: { type: val } }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="oauth2">OAuth2 (Refresh Token)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateIntegration}>Create Integration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search integrations..." 
            className="pl-9 bg-secondary/30 border-border"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border px-3 py-1 font-mono text-[11px] bg-secondary/30 uppercase tracking-wider text-muted-foreground">
            {filteredIntegrations.length} Active Connectors
          </Badge>
        </div>
      </div>

      <Card className="glass-panel border-border shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50 bg-secondary/5 h-12">
                <TableHead className="w-[300px] font-bold text-xs text-foreground pl-8">Provider</TableHead>
                <TableHead className="font-bold text-xs text-foreground text-center">Status</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Authentication</TableHead>
                <TableHead className="font-bold text-xs text-foreground text-center">Tools</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Last Activity</TableHead>
                <TableHead className="text-right font-bold text-xs text-foreground pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && integrations.length === 0 ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i} className="animate-pulse border-border/40">
                    <TableCell colSpan={6} className="h-20 bg-secondary/10" />
                  </TableRow>
                ))
              ) : filteredIntegrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic bg-secondary/5">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Code2 className="w-8 h-8 opacity-20" />
                      <p>No integrations found matching your search.</p>
                      <p className="text-[10px] non-italic">Try adjusting your filters or add a new provider.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredIntegrations.map((integration) => (
                  <TableRow key={integration.id} className="group hover:bg-secondary/20 transition-all duration-300 border-border/40">
                    <TableCell className="py-6 pl-8">
                      <Link to={`/integrations/${integration.id}`} className="block">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-secondary border border-border flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-all duration-300">
                            {integration.icon || "🔌"}
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                              {integration.name}
                            </div>
                            <div className="flex items-center gap-2">
                               <code className="text-[10px] text-muted-foreground font-mono bg-secondary/40 px-1.5 py-0.5 rounded">
                                 {integration.id}
                               </code>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 border shadow-sm",
                          integration.enabled !== false 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-muted text-muted-foreground border-border/50"
                        )}
                      >
                        {integration.enabled !== false ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Shield className="w-3.5 h-3.5 text-primary/60" />
                        {(integration.auth?.type || 'none').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="text-sm font-mono font-bold text-foreground bg-secondary/30 rounded-lg py-1 w-12 mx-auto border border-border/50">
                          {(integration.tools || []).length}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <History className="w-3.5 h-3.5 text-primary/60" />
                        {integration.updatedAt ? new Date(integration.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl">
                          <DropdownMenuItem asChild>
                            <Link to={`/integrations/${integration.id}`} className="flex items-center gap-2">
                              <Settings className="w-3.5 h-3.5" />
                              Configure Tools
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => saveIntegration({ ...integration, enabled: integration.enabled === false })}>
                            <Play className="w-3.5 h-3.5" />
                            {integration.enabled !== false ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate Integration
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive" onClick={() => deleteIntegration(integration.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Provider
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="glass-panel border-border bg-primary/5">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-primary">
                <Cloud className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">Cloud Sync</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              New integrations added here are automatically indexed across all assigned MCP servers. Use the "Repair Index" action in settings if you notice configuration drift.
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-border">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">Security isolation</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              API credentials are never exposed to the client agent directly. The Admin Plane acts as a secure middleware for all outgoing tool requests.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">System Health</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[11px] font-semibold">Registry Connection: Optimal</span>
             </div>
             <p className="text-[10px] text-muted-foreground mt-2">Latency: 45ms &nbsp; Uptime: 99.98%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

