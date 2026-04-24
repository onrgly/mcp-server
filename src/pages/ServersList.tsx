import React, { useState } from "react";
import { 
  Server, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Copy, 
  Play, 
  Pause, 
  Trash2,
  ExternalLink,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Settings,
  History,
  Blocks
} from "lucide-react";
import { useMCP } from "@/context/MCPContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MCPServer } from "@/types";
import { Link } from "react-router-dom";

export default function ServersList() {
  const { servers, saveServer, deleteServer, loading, integrations } = useMCP();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", id: "" });

  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateServer = async () => {
    if (!newServer.name) {
      toast.error("Server name is required");
      return;
    }
    await saveServer(newServer);
    setIsAddDialogOpen(false);
    setNewServer({ name: "", id: "" });
  };

  const copyConnectionUrl = (server: MCPServer) => {
    const url = `${window.location.origin}/mcp/${server.id}?key=${server.key}`;
    navigator.clipboard.writeText(url);
    toast.success("Connection URL copied to clipboard");
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">MCP Servers</h1>
          <p className="text-muted-foreground">Manage your Model Context Protocol server endpoints.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 ai-studio-gradient border-none text-white shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              New Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Server</DialogTitle>
              <DialogDescription>
                Endpoints group multiple integrations into a single connection URL.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Server Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. My Custom Server" 
                  value={newServer.name}
                  onChange={e => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id">Unique ID (Optional)</Label>
                <Input 
                  id="id" 
                  placeholder="Leave empty to auto-generate" 
                  value={newServer.id}
                  onChange={e => setNewServer(prev => ({ ...prev, id: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateServer}>Create Server</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search servers..." 
            className="pl-10 bg-secondary/30 border-border"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border px-3 py-1 font-mono text-[11px] bg-secondary/30 uppercase tracking-wider text-muted-foreground">
            {filteredServers.length} Active Endpoints
          </Badge>
        </div>
      </div>

      <Card className="glass-panel border-border shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50 bg-secondary/5 h-12">
                <TableHead className="w-[300px] font-bold text-xs text-foreground pl-8">Server / Endpoint</TableHead>
                <TableHead className="font-bold text-xs text-foreground text-center">Status</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Integrations</TableHead>
                <TableHead className="font-bold text-xs text-foreground text-center">Total Tools</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Last Activity</TableHead>
                <TableHead className="text-right font-bold text-xs text-foreground pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && servers.length === 0 ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i} className="animate-pulse border-border/40">
                    <TableCell colSpan={6} className="h-20 bg-secondary/10" />
                  </TableRow>
                ))
              ) : filteredServers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic bg-secondary/5">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Server className="w-8 h-8 opacity-20" />
                      <p>No servers found matching your search.</p>
                      <p className="text-[10px] non-italic">Try adjusting your filters or create a new endpoint.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredServers.map((server) => {
                  const serverIntegs = (server.integrationIds || [])
                    .map(id => integrations.find(i => i.id === id))
                    .filter(Boolean);
                  
                  const totalTools = serverIntegs.reduce((acc, integ) => {
                    const filteredTools = server.toolFilter?.[integ?.id || ""] || integ?.tools;
                    return acc + (filteredTools?.length || 0);
                  }, 0);

                  return (
                    <TableRow key={server.id} className="group hover:bg-secondary/20 transition-all duration-300 border-border/40">
                      <TableCell className="py-6 pl-8">
                        <Link to={`/servers/${server.id}`} className="block">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-all duration-300 shadow-sm">
                              <Server className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                {server.name}
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="text-[10px] text-muted-foreground font-mono bg-secondary/40 px-1.5 py-0.5 rounded">
                                  {server.id}
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
                            server.enabled !== false ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-muted text-muted-foreground border-border/50"
                          )}
                        >
                          {server.enabled !== false ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {serverIntegs.length > 0 ? (
                            serverIntegs.slice(0, 2).map(i => (
                              <Badge key={i?.id} variant="outline" className="text-[10px] font-semibold py-0.5 bg-background border-border shadow-sm">
                                {i?.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">None Assigned</span>
                          )}
                          {serverIntegs.length > 2 && (
                            <Badge variant="outline" className="text-[10px] font-semibold py-0.5 bg-background border-border shadow-sm">
                              +{serverIntegs.length - 2} More
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm font-mono font-bold text-foreground bg-secondary/30 rounded-lg py-1 w-12 mx-auto border border-border/50">
                          {totalTools}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <History className="w-3.5 h-3.5 text-primary/60" />
                          {server.createdAt ? new Date(server.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
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
                            <DropdownMenuItem className="gap-2" onClick={() => copyConnectionUrl(server)}>
                              <Copy className="w-3.5 h-3.5" /> Copy Connection URL
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" asChild>
                              <Link to={`/servers/${server.id}`}>
                                <Settings className="w-3.5 h-3.5" /> Configure Endpoint
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => saveServer({ id: server.id, enabled: server.enabled === false })}>
                              {server.enabled !== false ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              {server.enabled !== false ? "Disable Endpoint" : "Enable Endpoint"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => deleteServer(server.id)}>
                              <Trash2 className="w-3.5 h-3.5" /> Delete Server
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="glass-panel border-border bg-primary/5">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-primary">
                <Blocks className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">Tool Aggregation</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Servers group multiple integration sources into a unified protocol bridge. This allows an AI agent to see tools from different providers (e.g. GitHub and Slack) via a single connection.
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-border">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">Access Security</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each server endpoint uses a unique security key in the URL. Access is restricted to clients providing the correct key. Keys are rotated whenever the server metadata is significantly updated.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">Bridge Latency</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[11px] font-semibold">Status: Optimal</span>
             </div>
             <p className="text-[10px] text-muted-foreground mt-2">Aggregated response time averages 142ms across all active endpoints.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
