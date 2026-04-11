import { 
  Activity, 
  Blocks, 
  Zap, 
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  Code2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_INTEGRATIONS } from "@/constants";
import { cn } from "@/lib/utils";

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <Card className="glass-panel overflow-hidden group border-white/5">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
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
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
    </CardContent>
    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </Card>
);

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-muted-foreground">System overview and real-time performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1">API v2.4</Badge>
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1">Stable</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Integrations" value={MOCK_INTEGRATIONS.length} change="+2" icon={Blocks} trend="up" />
        <StatCard title="Active Tools" value="48" change="+5" icon={Code2} trend="up" />
        <StatCard title="Request Volume" value="1.2M" change="+12%" icon={Activity} trend="up" />
        <StatCard title="Error Rate" value="0.04%" change="-0.01%" icon={AlertCircle} trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription>Latest events across all MCP integrations.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary hover:bg-primary/10">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { time: '2m ago', event: 'GitHub API Sync', status: 'success', details: 'Updated 12 tools successfully' },
                { time: '15m ago', event: 'Slack Webhook Test', status: 'success', details: 'Connection verified' },
                { time: '1h ago', event: 'Stripe Config Update', status: 'warn', details: 'API key rotating in 3 days' },
                { time: '3h ago', event: 'New Integration Added', status: 'success', details: 'Linear MCP v1.0' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className={cn(
                    "mt-1 w-2 h-2 rounded-full shrink-0",
                    item.status === 'success' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                  )} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{item.event}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
            <CardDescription>Current status of core services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: 'API Gateway', status: 'Operational', color: 'text-green-500' },
              { name: 'Tool Executor', status: 'Operational', color: 'text-green-500' },
              { name: 'Auth Service', status: 'Operational', color: 'text-green-500' },
              { name: 'Log Streamer', status: 'Optimal', color: 'text-blue-400' },
            ].map((service, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{service.name}</span>
                <Badge variant="outline" className={cn("text-[10px] font-mono border-none bg-white/5", service.color)}>
                  {service.status}
                </Badge>
              </div>
            ))}
            
            <div className="pt-6 border-t border-white/5">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Insights</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System performance is <span className="text-white font-medium">12% higher</span> than last week. No critical errors detected in the last 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
