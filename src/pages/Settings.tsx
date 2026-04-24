import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  Database, 
  Key, 
  Save, 
  Activity, 
  Brain, 
  Bot, 
  Cpu, 
  Eye, 
  EyeOff,
  Zap,
  Layout
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Local state for AI Settings
  const [aiSettings, setAiSettings] = useState({
    provider: "google",
    model: "gemini-1.5-pro",
    apiKey: "••••••••••••••••••••••••••••",
    enableReview: true,
    enableSummaries: true,
    maxTokens: 2048,
    temperature: 0.7
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Settings</h1>
          <p className="text-muted-foreground">Configure system-wide parameters and experimental AI features.</p>
        </div>
        <Button className="gap-2 ai-studio-gradient border-none text-white shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* AI Configuration Section */}
          <Card className="glass-panel border-border shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-primary" />
                     <CardTitle>AI Intelligence Configuration</CardTitle>
                  </div>
                  <CardDescription>Define credentials for AI-powered system review and dashboard analysis.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px]">GROUNDWORK BETA</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select 
                    value={aiSettings.provider} 
                    onValueChange={val => setAiSettings(prev => ({ ...prev, provider: val }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="local">Local Model (LlamaEdge)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model Version</Label>
                  <Input 
                    value={aiSettings.model} 
                    onChange={e => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="bg-secondary/30 border-border font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key / Secret</Label>
                <div className="relative">
                  <Input 
                    type={showApiKey ? "text" : "password"}
                    value={aiSettings.apiKey} 
                    onChange={e => setAiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-secondary/30 border-border font-mono text-sm pr-10"
                    placeholder="sk-..."
                  />
                  <button 
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                   <Key className="w-2.5 h-2.5" /> Secrets are masked for security. Rotating keys will disconnect existing active sessions.
                </p>
              </div>

              <div className="pt-6 border-t border-border space-y-4">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Enabled Capabilities</Label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/10 group">
                       <div className="space-y-0.5">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors">Daily System Health Review</p>
                          <p className="text-[10px] text-muted-foreground">AI analyzes error logs and metrics for anomaly detection.</p>
                       </div>
                       <Switch 
                         checked={aiSettings.enableReview} 
                         onCheckedChange={val => setAiSettings(prev => ({ ...prev, enableReview: val }))} 
                       />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/10 group">
                       <div className="space-y-0.5">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors">Smart Incident Summaries</p>
                          <p className="text-[10px] text-muted-foreground">Automatically generate post-mortem drafts for significant failures.</p>
                       </div>
                       <Switch 
                         checked={aiSettings.enableSummaries} 
                         onCheckedChange={val => setAiSettings(prev => ({ ...prev, enableSummaries: val }))} 
                       />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* System Config Section */}
          <Card className="glass-panel border-border shadow-xl">
             <CardHeader>
                <CardTitle>Display & UI Customization</CardTitle>
                <CardDescription>Adjust the visual personality and dashboard behavior.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>Dashboard Refresh Interval</Label>
                      <Select defaultValue="30">
                        <SelectTrigger className="bg-secondary/30 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">Real-time (10s)</SelectItem>
                          <SelectItem value="30">Standard (30s)</SelectItem>
                          <SelectItem value="60">Balanced (60s)</SelectItem>
                          <SelectItem value="300">Eco-mode (5m)</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>Default View</Label>
                      <Select defaultValue="table">
                        <SelectTrigger className="bg-secondary/30 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="table">Tabular (Recommended)</SelectItem>
                          <SelectItem value="grid">Visual Grid</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card className="glass-panel border-border bg-orange-500/5">
              <CardHeader className="pb-3 border-b border-orange-500/10">
                <div className="flex items-center gap-2 text-orange-500">
                   <Zap className="w-4 h-4" />
                   <CardTitle className="text-xs uppercase tracking-widest font-bold">Future-Proofing</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The AI configuration here prepares the Admin Plane for future self-healing capabilities. Once configured, the system will start building an internal knowledge base of your MCP topology.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Model Specs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <Brain className="w-3.5 h-3.5" /> Reasoning Level
                    </div>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">High</Badge>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <Cpu className="w-3.5 h-3.5" /> Token Limit
                    </div>
                    <span className="font-mono">{aiSettings.maxTokens}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <Bot className="w-3.5 h-3.5" /> System Identity
                    </div>
                    <span className="font-medium text-primary">MCP Analyst</span>
                 </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl border border-border bg-secondary/20 flex flex-col items-center justify-center text-center space-y-3">
               <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center bg-background shadow-inner">
                  <Layout className="w-5 h-5 text-muted-foreground" />
               </div>
               <div>
                  <p className="text-xs font-bold">Custom Dashboard</p>
                  <p className="text-[10px] text-muted-foreground">Layout engine is currently tied to standard presets.</p>
               </div>
               <Button variant="outline" size="sm" className="w-full text-[10px] h-8 border-border" disabled>Edit Layout Engine</Button>
            </div>
        </div>
      </div>
    </div>
  );
}
