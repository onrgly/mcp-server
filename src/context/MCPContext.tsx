import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MCPIntegration, MCPServer } from '@/types';
import { toast } from 'sonner';

interface MCPContextType {
  integrations: MCPIntegration[];
  servers: MCPServer[];
  loading: boolean;
  refreshData: () => Promise<void>;
  saveIntegration: (integration: Partial<MCPIntegration>) => Promise<void>;
  deleteIntegration: (id: string) => Promise<void>;
  saveServer: (server: Partial<MCPServer>) => Promise<void>;
  deleteServer: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

export const MCPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'dark';
  });

  const [integrations, setIntegrations] = useState<MCPIntegration[]>([]);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('mcp_admin_key'));

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [integRes, serverRes] = await Promise.all([
        fetch('/api/admin?action=integrations'),
        fetch('/api/admin?action=servers')
      ]);
      
      const integData = await integRes.json();
      const serverData = await serverRes.json();
      
      if (integData.integrations) setIntegrations(integData.integrations);
      if (serverData.servers) setServers(serverData.servers);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to sync with backend");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const login = async (key: string) => {
    // Simple verification by trying to fetch integrations
    try {
      const res = await fetch('/api/admin?action=integrations');
      if (res.ok) {
        localStorage.setItem('mcp_admin_key', key);
        setIsAuthenticated(true);
        return true;
      }
    } catch (e) {}
    toast.error("Invalid admin token");
    return false;
  };

  const logout = () => {
    localStorage.removeItem('mcp_admin_key');
    setIsAuthenticated(false);
    setIntegrations([]);
    setServers([]);
  };

  const saveIntegration = async (integ: Partial<MCPIntegration>) => {
    try {
      const res = await fetch('/api/admin?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integ)
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Integration saved");
        await refreshData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save integration");
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) return;
    try {
      const res = await fetch('/api/admin?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Integration deleted");
        await refreshData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete integration");
    }
  };

  const saveServer = async (server: Partial<MCPServer>) => {
    try {
      const res = await fetch('/api/admin?action=save-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server)
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Server configuration saved");
        await refreshData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save server");
    }
  };

  const deleteServer = async (id: string) => {
    if (!confirm("Delete this server? Connections using its URL will fail.")) return;
    try {
      const res = await fetch('/api/admin?action=delete-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Server deleted");
        await refreshData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete server");
    }
  };

  return (
    <MCPContext.Provider value={{ 
      integrations, 
      servers,
      loading,
      refreshData,
      saveIntegration,
      deleteIntegration,
      saveServer,
      deleteServer,
      theme,
      toggleTheme,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </MCPContext.Provider>
  );
};

export const useMCP = () => {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error('useMCP must be used within a MCPProvider');
  }
  return context;
};
