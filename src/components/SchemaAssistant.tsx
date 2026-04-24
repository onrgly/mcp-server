import React, { useState } from "react";
import { 
  Sparkles, 
  Wand2, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Brain,
  Code,
  Zap,
  RotateCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SchemaAssistantProps {
  onApply: (schema: any) => void;
  currentSchema?: any;
}

export default function SchemaAssistant({ onApply, currentSchema }: SchemaAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftSchema, setDraftSchema] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what the tool does");
      return;
    }

    setIsGenerating(true);
    try {
      // In a real app, this would call the /api/ai/schema endpoint
      // For this demo, we'll simulate a smart generation
      await new Promise(r => setTimeout(r, 1500));
      
      const simulatedSchema = [
        {
          name: "id",
          type: "string",
          description: "Unique identifier for the resource",
          required: true
        },
        {
          name: "data",
          type: "object",
          description: "Payload data for the operation",
          required: true
        }
      ];
      
      setDraftSchema(simulatedSchema);
      toast.success("AI Draft generated!");
    } catch (e) {
      toast.error("Failed to generate schema");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (draftSchema) {
      onApply(draftSchema);
      toast.success("Applied to Parameter Builder");
    }
  };

  return (
    <Card className={cn(
      "border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden transition-all duration-500",
      isGenerating && "animate-pulse"
    )}>
      {/* Visual Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12 blur-xl" />
      
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight">AI Schema Assistant</CardTitle>
              <CardDescription className="text-xs">Natural language capability designer</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold px-2 py-0.5">Alpha</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
             <Label className="text-xs font-semibold text-foreground">Describe Capability</Label>
             <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full italic border border-border">English Only</span>
          </div>
          <Textarea 
            placeholder="e.g. A tool that fetches historical weather data for a given city and date range..."
            className="bg-background/80 border-primary/20 min-h-[100px] text-xs resize-none focus:ring-primary/20 p-4 rounded-xl shadow-inner placeholder:text-muted-foreground/50"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <Button 
          className="w-full h-11 gap-2 ai-studio-gradient border-none text-white font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-opacity"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <RotateCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {isGenerating ? "Analyzing Requirements..." : "Generate Schema Draft"}
        </Button>

        {draftSchema && (
          <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 duration-500">
             <div className="p-4 bg-background/50 backdrop-blur rounded-2xl border border-primary/20 shadow-inner space-y-4">
                <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                   <span className="text-xs font-bold text-primary flex items-center gap-2">
                      <Code className="w-3.5 h-3.5" /> 
                      Generated Draft Preview
                   </span>
                   <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none">
                      {draftSchema.length} Parameters
                   </Badge>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
                   {draftSchema.map((p: any, i: number) => (
                      <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-secondary/20 border border-border/50 group hover:border-primary/30 transition-colors">
                         <div className="flex items-center justify-between">
                            <code className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</code>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border bg-white capitalize">{p.type}</Badge>
                         </div>
                         {p.description && (
                           <p className="text-[10px] text-muted-foreground line-clamp-2 italic">{p.description}</p>
                         )}
                      </div>
                   ))}
                </div>
             </div>
             <Button 
               variant="outline" 
               className="w-full h-10 gap-2 border-primary/30 text-primary hover:bg-primary/5 group rounded-xl font-bold"
               onClick={handleApply}
             >
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                Apply to Schema Builder
             </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative z-10 pt-0 text-center">
         <div className="w-full p-2 bg-secondary/20 rounded-lg flex items-center justify-center gap-2">
            <Brain className="w-3 h-3 text-primary/50" />
            <span className="text-[9px] font-medium text-muted-foreground">AI outputs may require manual verification.</span>
         </div>
      </CardFooter>
    </Card>
  );
}
