import { 
  Activity, 
  Blocks, 
  Zap, 
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  Code2,
  Server,
  Cloud,
  ShieldCheck,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMCP } from "@/context/MCPContext";

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <Card className="glass-panel overflow-hidden group border-border shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <Icon className="w-5 h-5" />
        </div>
        <Badge variant="outline" className={cn(
          "text-[10px] font-mono border-none",
          trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {change}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{title}</p>
        <h3 className="text-3xl font-bold tracking-tighter text-foreground">{value}</h3>
      </div>
    </CardContent>
    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </Card>
);

export default function Dashboard() {
  const { integrations, servers } = useMCP();
  const totalTools = integrations.reduce((acc, curr) => acc + (curr.tools?.length || 0), 0);
  const activeIntegrations = integrations.filter(i => i.enabled !== false).length;
  const activeServers = servers.filter(s => s.enabled).length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground">Operational Overview</h1>
          <p className="text-sm text-muted-foreground font-medium">Real-time telemetry from your Model Context Protocol infrastructure.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-mono text-[10px]">VER: PARITY-1.0</Badge>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Global Status: Optimal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="MCP Endpoints" value={servers.length} change={`+${activeServers} Active`} icon={Server} trend="up" />
        <StatCard title="Tool Providers" value={integrations.length} change={`+${activeIntegrations} Online`} icon={Blocks} trend="up" />
        <StatCard title="Active Capabilities" value={totalTools} change="Synchronized" icon={Code2} trend="up" />
        <StatCard title="Service Health" value="100%" change="Normal" icon={ShieldCheck} trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass-panel border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div>
              <CardTitle className="text-foreground text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Live Execution Stream
              </CardTitle>
              <CardDescription className="text-xs">Incoming requests and tool executions processed in the last 24h.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest border-border" asChild>
              <Link to="/logs">Inspect All Logs</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="p-6 space-y-6">
                {[
                  { time: 'Just now', event: 'Internal: Analytics Search', status: 'success', details: 'Retrieved 85 user signals', color: 'text-blue-500' },
                  { time: '12m ago', event: 'GitHub Tool: list_issues', status: 'success', details: 'Successful bridge to api.github.com' },
                  { time: '45m ago', event: 'System: Remote Discovery', status: 'success', details: 'Found 4 new tools in remote-mcp-v1' },
                  { time: '2h ago', event: 'Auth: API Key Rotation', status: 'warn', details: 'Linear integration key updated' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className={cn(
                      "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                      item.status === 'success' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.event}</p>
                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap ml-2">{item.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.details}</p>
                    </div>
                  </div>
                ))}
             </div>
          </CardContent>
          <div className="p-4 bg-secondary/10 border-t border-border flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Avg Latency</span>
                   <span className="text-sm font-mono font-bold tracking-tight">142ms</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Throughput</span>
                   <span className="text-sm font-mono font-bold tracking-tight">4.2 req/s</span>
                </div>
             </div>
             <Badge className="bg-primary/5 text-primary border-primary/20 text-[9px] font-mono uppercase">REAL-TIME MONITORING</Badge>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel border-border shadow-xl">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">System Clusters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { name: 'US-EAST Core', status: 'Operational', latency: '24ms' },
                { name: 'EU-WEST Edge', status: 'Operational', latency: '88ms' },
                { name: 'ASIA Proxy', status: 'Operational', latency: '156ms' },
                { name: 'Schema Forge', status: 'Optimizing', latency: '—' },
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border group hover:border-primary/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{service.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{service.latency}</span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold border-none px-2 py-0.5",
                    service.status === 'Operational' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                    {service.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="ai-studio-gradient border-none shadow-2xl shadow-primary/30 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 rotate-12" />
            </div>
            <CardContent className="p-6 space-y-4 relative">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">AI Infrastructure Tip</span>
                </div>
                <p className="text-xs leading-relaxed font-medium text-white/90">
                   Your current tool distribution is highly efficient. Consider moving <span className="underline decoration-white/40">GitHub MCP</span> to an EU-WEST relay to reduce cross-region latency by ~40ms.
                </p>
                <Button size="sm" className="w-full bg-white text-primary hover:bg-white/90 font-bold text-[10px] uppercase tracking-widest h-8">
                  Optimize Infrastructure
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
