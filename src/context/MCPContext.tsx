import React, { createContext, useContext, useState, useEffect } from 'react';
import { MCPIntegration } from '@/types';
import { MOCK_INTEGRATIONS } from '@/constants';

interface MCPContextType {
  integrations: MCPIntegration[];
  addIntegration: (integration: MCPIntegration) => void;
  updateIntegration: (id: string, updates: Partial<MCPIntegration>) => void;
  deleteIntegration: (id: string) => void;
  setIntegrations: React.Dispatch<React.SetStateAction<MCPIntegration[]>>;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

export const MCPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [integrations, setIntegrationsState] = useState<MCPIntegration[]>(() => {
    try {
      const saved = localStorage.getItem('mcp_integrations');
      return saved ? JSON.parse(saved) : MOCK_INTEGRATIONS;
    } catch (error) {
      console.error("Failed to parse integrations from localStorage:", error);
      return MOCK_INTEGRATIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('mcp_integrations', JSON.stringify(integrations));
  }, [integrations]);

  const addIntegration = (integration: MCPIntegration) => {
    setIntegrationsState(prev => [...prev, integration]);
  };

  const updateIntegration = (id: string, updates: Partial<MCPIntegration>) => {
    setIntegrationsState(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteIntegration = (id: string) => {
    setIntegrationsState(prev => prev.filter(i => i.id !== id));
  };

  return (
    <MCPContext.Provider value={{ 
      integrations, 
      addIntegration, 
      updateIntegration, 
      deleteIntegration,
      setIntegrations: setIntegrationsState
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
