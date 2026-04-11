import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Blocks, 
  Terminal, 
  Settings, 
  Activity,
  ShieldCheck,
  ChevronRight,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

const SidebarItem = ({ to, icon: Icon, label, badge }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
        isActive 
          ? "bg-primary/10 text-primary shadow-sm" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
        {label}
      </div>
      {badge && (
        <Badge variant={isActive ? "secondary" : "outline"} className="px-1.5 py-0 text-[10px] border-white/5">
          {badge}
        </Badge>
      )}
    </Link>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-card flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 ai-studio-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Blocks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white leading-none">MCP Control</h1>
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mt-1">Admin Plane</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 mt-4">
            Main
          </div>
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/integrations" icon={Blocks} label="Integrations" badge="3" />
          <SidebarItem to="/logs" icon={Terminal} label="Live Logs" />
          
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mt-8 mb-2">
            System
          </div>
          <SidebarItem to="/auth" icon={ShieldCheck} label="Authentication" />
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-white/5">
            <div className="w-8 h-8 rounded-full ai-studio-gradient flex items-center justify-center text-white font-bold text-xs">
              OG
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white">Admin Operator</p>
              <p className="text-[10px] text-muted-foreground truncate">onurgulay@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-background/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 font-medium px-2 py-0.5 text-[10px] uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Production
            </Badge>
            <div className="h-4 w-px bg-white/5" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>System Status: <span className="text-green-500 font-medium">Optimal</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Last Sync:</span>
              <span className="font-mono text-foreground">14:30:05 UTC</span>
            </div>
            <button className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-secondary/50 hover:bg-secondary transition-all active:scale-95">
              Sync State
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto technical-grid">
          {children}
        </div>
      </main>
    </div>
  );
}
