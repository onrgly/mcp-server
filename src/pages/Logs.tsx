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
  Loader2,
  Activity, 
  History, 
  FileText,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (isPaused) return;

    try {
      const res = await fetch("/api/admin?action=logs&limit=50");
      const data = await res.json();
      
      if (data && Array.isArray(data)) {
        // Only update if we have new logs
        setLogs(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const newLogs = data.filter((l: LogEntry) => !existingIds.has(l.id));
          if (newLogs.length === 0) return prev;
          
          const combined = [...prev, ...newLogs];
          return combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).slice(-200);
        });
        setLastSync(new Date());
      }
    } catch (e) {
      console.error("Failed to poll logs", e);
    }
  };

  const handleTroubleshoot = async () => {
    const errorLogs = logs
      .filter(l => l.level === 'error')
      .slice(-10) // Take last 10 errors
      .map(l => `[${l.level}] ${l.source}: ${l.message}`)
      .join("\n");

    if (!errorLogs) {
      toast.info("No errors found in current log stream to troubleshoot.");
      return;
    }

    setIsTroubleshooting(true);
    try {
      const res = await fetch("/api/ai/troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorLog: errorLogs })
      });
      const data = await res.json();
      
      if (data.suggestion) {
        toast.info("AI Analysis Complete", {
          description: data.suggestion,
          duration: 15000,
        });
      }
    } catch (error) {
      toast.error("AI Troubleshooting failed");
    } finally {
      setIsTroubleshooting(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchLogs, 5000);
    fetchLogs(); // Initial fetch
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  return (
    <div className="p-8 h-full flex flex-col space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground">Infrastructure Monitoring</h1>
          <p className="text-sm text-muted-foreground font-medium">Real-time execution stream and protocol debugging.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2 ai-studio-gradient border-none text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={handleTroubleshoot}
            disabled={isTroubleshooting}
          >
            {isTroubleshooting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Troubleshoot
          </Button>
          <div className="h-8 w-px bg-border mx-2" />
          <Button variant="outline" size="sm" className="gap-2 border-border font-bold text-[10px] uppercase tracking-widest h-8" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-border font-bold text-[10px] uppercase tracking-widest h-8" onClick={() => setLogs([])}>
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
        </div>
      </div>

      <Card className="flex-1 glass-panel overflow-hidden flex flex-col border-border shadow-2xl relative group">
        <CardHeader className="border-b border-border bg-secondary/20 py-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", isPaused ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]")} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {isPaused ? 'Stream Suspended' : 'Live Bridge Active'}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                 <History className="w-3 h-3" />
                 Last Sync: {lastSync.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input placeholder="Grep events..." className="h-7 pl-8 text-[10px] bg-background border-border font-mono" />
               </div>
               <Badge variant="outline" className="text-[9px] font-bold border-border bg-background uppercase tracking-tighter">Latency: 48ms</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden relative bg-[#09090b]">
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#09090b] to-transparent z-10 pointer-events-none opacity-50" />
          <div 
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-primary/20"
          >
            {logs.map((log) => (
              <div key={log.id} className="flex gap-6 py-1 px-3 rounded hover:bg-white/[0.03] transition-colors border-l-2 border-transparent hover:border-primary/30 group">
                <span className="text-muted-foreground/40 w-20 shrink-0 font-bold tracking-tighter">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}
                </span>
                <span className={cn(
                  "w-16 shrink-0 font-black uppercase text-[10px] tracking-tight",
                  log.level === 'error' && "text-red-500",
                  log.level === 'warn' && "text-amber-500",
                  log.level === 'info' && "text-blue-400",
                  log.level === 'success' && "text-green-500"
                )}>
                  {log.level}
                </span>
                <span className="text-indigo-400/80 w-28 shrink-0 truncate font-bold">
                  {log.source.toUpperCase()}
                </span>
                <span className="flex-1 text-zinc-300 font-medium">
                  {log.message}
                  {log.details && (
                    <span className="ml-3 text-zinc-500 opacity-40 group-hover:opacity-100 transition-opacity">
                      {log.details}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <Activity className="w-12 h-12 opacity-10 animate-pulse text-primary" />
                <div className="space-y-1 text-center">
                   <p className="text-xs font-bold uppercase tracking-widest opacity-30">Synchronizing Protocol Stream</p>
                   <p className="text-[10px] italic opacity-20">Awaiting handshake with Netlify function bridge...</p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#09090b] to-transparent z-10 pointer-events-none opacity-50" />
        </CardContent>
        <div className="absolute bottom-4 right-8 z-20">
           <Button variant="secondary" size="sm" className="h-8 w-8 rounded-full p-0 shadow-2xl border border-white/10" onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
           }}>
              <ChevronDown className="w-4 h-4" />
           </Button>
        </div>
      </Card>
    </div>
  );
}
