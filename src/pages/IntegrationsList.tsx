import { 
  Search, 
  Plus, 
  MoreVertical, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Play,
  Filter,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle
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
import { MOCK_INTEGRATIONS } from "@/constants";
import { toast } from "sonner";
import { MCPIntegration } from "@/types";

export default function IntegrationsList() {
  const [integrations, setIntegrations] = useState<MCPIntegration[]>(MOCK_INTEGRATIONS);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [migratedData, setMigratedData] = useState<any>(null);

  const applyMigration = () => {
    if (!migratedData) return;

    // Mapping logic (assuming the remote data might need some normalization)
    const newIntegrations: MCPIntegration[] = migratedData.integrations.map((remote: any) => ({
      id: remote.id || `migrated_${Math.random().toString(36).substr(2, 5)}`,
      name: remote.name || "Unnamed Integration",
      description: remote.description || "Migrated from Netlify",
      status: remote.enabled ? 'enabled' : 'disabled',
      authType: remote.authType || 'none',
      toolCount: remote.tools?.length || 0,
      updatedAt: new Date().toISOString(),
      serverUrl: remote.url || "",
      config: remote.config || {},
      tools: remote.tools || []
    }));

    setIntegrations(prev => [...prev, ...newIntegrations]);
    setMigrationStep('idle');
    setMigratedData(null);
    toast.success(`Successfully migrated ${newIntegrations.length} integrations!`);
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationStep('fetching');
    
    try {
      // Fetch integrations
      const intResponse = await fetch("/api/migrate?action=integrations");
      if (!intResponse.ok) throw new Error("Failed to fetch integrations");
      const integrations = await intResponse.json();

      // Fetch tools
      const toolsResponse = await fetch("/api/migrate?action=tools");
      if (!toolsResponse.ok) throw new Error("Failed to fetch tools");
      const tools = await toolsResponse.json();

      setMigratedData({ integrations, tools });
      setMigrationStep('success');
      toast.success("Migration data fetched successfully!");
    } catch (error) {
      console.error(error);
      setMigrationStep('error');
      toast.error("Migration failed. Check your token and base URL.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Integrations</h1>
          <p className="text-muted-foreground">Manage your Model Context Protocol server connections.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5 text-xs">
                <Download className="w-4 h-4" />
                Migrate from Netlify
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Migrate MCP Configuration</DialogTitle>
                <DialogDescription>
                  This will fetch your current integrations and tools from your Netlify-hosted MCP instance.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-6 space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Source URL</span>
                    <span className="font-mono">mcp.smilecenterturkey.com</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Auth Method</span>
                    <span className="font-mono">Bearer Token</span>
                  </div>
                </div>

                {migrationStep === 'fetching' && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Fetching remote configuration...</p>
                  </div>
                )}

                {migrationStep === 'success' && migratedData && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-200 rounded-lg text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <div className="text-sm font-medium">
                        Found {migratedData.integrations?.length || 0} integrations and {migratedData.tools?.length || 0} tools.
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click "Apply Migration" to merge this data into your local environment.
                    </div>
                  </div>
                )}

                {migrationStep === 'error' && (
                  <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    <div className="text-sm font-medium">
                      Connection failed. Please verify your <code className="bg-destructive/10 px-1 rounded">NETLIFY_ADMIN_TOKEN</code> in the Secrets panel.
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => {
                  setMigrationStep('idle');
                  setMigratedData(null);
                }}>Cancel</Button>
                {migrationStep === 'success' ? (
                  <Button onClick={applyMigration}>Apply Migration</Button>
                ) : (
                  <Button onClick={handleMigration} disabled={isMigrating}>
                    {isMigrating ? "Connecting..." : "Start Migration"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Integration
          </Button>
        </div>
      </div>

      <Card className="glass-panel border-white/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search integrations..." className="pl-9 bg-secondary/30 border-white/5" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px] font-bold text-[10px] uppercase tracking-wider">Integration</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider">Auth Type</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider">Tools</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider">Last Updated</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => (
                <TableRow key={integration.id} className="group cursor-pointer">
                  <TableCell className="py-4">
                    <Link to={`/integrations/${integration.id}`} className="block space-y-1">
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {integration.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {integration.id}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] font-medium",
                        integration.status === 'enabled' 
                          ? "bg-green-500/10 text-green-600 border-green-200" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {integration.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-muted-foreground">
                      {integration.authType.replace('-', ' ').toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono font-medium">{integration.toolCount}</div>
                      <span className="text-[10px] text-muted-foreground">tools</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {new Date(integration.updatedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link to={`/integrations/${integration.id}`} className="flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Play className="w-3.5 h-3.5" />
                          Test Connection
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
