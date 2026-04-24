import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Blocks, 
  Terminal, 
  Settings, 
  Activity,
  ShieldCheck,
  ChevronRight,
  User,
  Sun,
  Moon,
  Server,
  Lock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMCP } from "@/context/MCPContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
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
      {badge !== undefined && (
        <Badge variant={isActive ? "secondary" : "outline"} className="px-1.5 py-0 text-[10px] border-border">
          {badge}
        </Badge>
      )}
    </Link>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, isAuthenticated, login, logout, loading, integrations, servers } = useMCP();
  const [tokenInput, setTokenInput] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    await login(tokenInput);
    setIsLoggingIn(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 technical-grid">
        <Card className="w-full max-w-md glass-panel border-border shadow-2xl backdrop-blur-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 ai-studio-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">MCP Admin Access</CardTitle>
              <CardDescription>Enter your administration token to continue</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="RETRIEVE_AUTH_TOKEN" 
                  className="bg-secondary/30 border-border h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full ai-studio-gradient hover:opacity-90 h-11 text-white font-semibold transition-all active:scale-[0.98]"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest mt-6">
                Smile Center Turkey® Admin Plane
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "relative border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out z-30",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "absolute -right-3 top-20 w-6 h-6 rounded-full bg-border border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-40 transform hover:scale-110",
            isSidebarCollapsed ? "rotate-0" : "rotate-180"
          )}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className={cn("p-6 flex items-center gap-3 overflow-hidden", isSidebarCollapsed && "justify-center px-0")}>
          <div className="shrink-0 w-10 h-10 ai-studio-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Blocks className="w-6 h-6 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="font-bold text-lg tracking-tight text-foreground leading-none">MCP Control</h1>
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mt-1">Admin Plane</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 mt-4 animate-in fade-in duration-300">
              Main
            </div>
          )}
          <div className={cn("space-y-1", isSidebarCollapsed && "flex flex-col items-center")}>
            <SidebarItem to="/" icon={LayoutDashboard} label={isSidebarCollapsed ? "" : "Dashboard"} />
            <SidebarItem to="/servers" icon={Server} label={isSidebarCollapsed ? "" : "MCP Servers"} badge={isSidebarCollapsed ? undefined : servers.length} />
            <SidebarItem to="/integrations" icon={Blocks} label={isSidebarCollapsed ? "" : "Integrations"} badge={isSidebarCollapsed ? undefined : integrations.length} />
            <SidebarItem to="/logs" icon={Terminal} label={isSidebarCollapsed ? "" : "Live Logs"} />
          </div>
          
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mt-8 mb-2 animate-in fade-in duration-300">
              System
            </div>
          )}
          <div className={cn("space-y-1", isSidebarCollapsed && "flex flex-col items-center")}>
            <SidebarItem to="/users" icon={ShieldCheck} label={isSidebarCollapsed ? "" : "Users & Security"} />
            <SidebarItem to="/settings" icon={Settings} label={isSidebarCollapsed ? "" : "Settings"} />
          </div>
        </nav>

        <div className={cn("p-4 border-t border-border", isSidebarCollapsed && "flex justify-center flex-col items-center gap-2")}>
          <div 
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border group cursor-pointer hover:bg-secondary/50 transition-colors overflow-hidden",
              isSidebarCollapsed ? "w-12 h-12 p-0 justify-center rounded-full" : "w-full"
            )} 
            onClick={logout}
            title={isSidebarCollapsed ? "Sign Out" : ""}
          >
            <div className="shrink-0 w-8 h-8 rounded-full ai-studio-gradient flex items-center justify-center text-white font-bold text-xs ring-2 ring-background">
              OG
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                <p className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors">Sign Out</p>
                <p className="text-[10px] text-muted-foreground truncate">onurgulay@gmail.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-background/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 font-medium px-2 py-0.5 text-[10px] uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Production
            </Badge>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>System Status: <span className={cn("font-medium", loading ? "text-yellow-500" : "text-green-500")}>
                {loading ? "Syncing..." : "Optimal"}
              </span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Last Sync:</span>
              <span className="font-mono text-foreground">{new Date().toLocaleTimeString([], { hour12: false })} UTC</span>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-all active:scale-95 text-muted-foreground hover:text-foreground"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <Button variant="outline" size="sm" className="text-[11px] font-medium px-3 h-8 border-border bg-secondary/50 hover:bg-secondary transition-all active:scale-95" onClick={() => window.location.reload()}>
              Sync State
            </Button>
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
