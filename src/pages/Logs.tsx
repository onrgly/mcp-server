import { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Search, 
  Trash2, 
  Download, 
  Pause, 
  Play,
  Filter,
  AlertCircle,
  Info,
  CheckCircle2,
  Sparkles,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { troubleshootIntegration } from "@/services/gemini";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: string;
  message: string;
  details?: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isTroubleshooting, setIsTroubleshooting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTroubleshoot = async () => {
    const errorLogs = logs.filter(l => l.level === 'error').map(l => l.message).join("\n");
    if (!errorLogs) {
      toast.info("No errors found in current log stream to troubleshoot.");
      return;
    }

    setIsTroubleshooting(true);
    try {
      const suggestion = await troubleshootIntegration(errorLogs);
      toast.info("AI Analysis Complete", {
        description: suggestion,
        duration: 10000,
      });
    } catch (error) {
      toast.error("AI Troubleshooting failed");
    } finally {
      setIsTroubleshooting(false);
    }
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'error' : 'warn') : 'info',
        source: Math.random() > 0.5 ? 'github-mcp' : 'slack-mcp',
        message: `Processed request for tool: ${Math.random() > 0.5 ? 'list_repos' : 'send_message'}`,
        details: Math.random() > 0.9 ? '{"status": 200, "latency": "145ms"}' : undefined
      };

      setLogs(prev => [...prev.slice(-100), newLog]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  return (
    <div className="p-8 h-full flex flex-col space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Live Logs</h1>
          <p className="text-muted-foreground">Real-time monitoring of MCP server activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-primary/20 text-primary hover:bg-primary/5 text-xs"
            onClick={handleTroubleshoot}
            disabled={isTroubleshooting}
          >
            {isTroubleshooting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Troubleshoot with AI
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5 text-xs" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5 text-xs" onClick={() => setLogs([])}>
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Card className="flex-1 glass-panel overflow-hidden flex flex-col border-white/5">
        <CardHeader className="border-b border-white/5 bg-secondary/20 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-yellow-500" : "bg-green-500 animate-pulse")} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {isPaused ? 'Stream Paused' : 'Live Stream'}
                </span>
              </div>
              <div className="h-4 w-px bg-white/5" />
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Filter logs..." className="h-8 pl-8 text-[10px] bg-background/50 border-white/5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-white/5 border-white/5">ALL LEVELS</Badge>
              <Badge variant="outline" className="text-[10px] bg-white/5 border-white/5">ALL SOURCES</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden relative bg-[#0a0a0a]">
          <div 
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto p-4 font-mono text-[11px] space-y-1"
          >
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 py-0.5 px-2 rounded hover:bg-white/5 transition-colors group">
                <span className="text-muted-foreground/60 w-20 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={cn(
                  "w-16 shrink-0 font-bold uppercase",
                  log.level === 'error' && "text-red-500",
                  log.level === 'warn' && "text-amber-500",
                  log.level === 'info' && "text-blue-400",
                  log.level === 'success' && "text-green-500"
                )}>
                  [{log.level}]
                </span>
                <span className="text-purple-400 w-24 shrink-0 truncate">
                  {log.source}
                </span>
                <span className="flex-1 text-gray-300">
                  {log.message}
                  {log.details && (
                    <span className="ml-2 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                      {log.details}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <Terminal className="w-8 h-8 opacity-20" />
                <p className="text-xs italic opacity-50">Waiting for incoming logs...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
