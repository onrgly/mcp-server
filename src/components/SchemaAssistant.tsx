import { useState } from "react";
import { Sparkles, Loader2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateSchemaSuggestion } from "@/services/gemini";
import { toast } from "sonner";

export default function SchemaAssistant() {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ schema: any; explanation: string } | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please enter a tool description");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateSchemaSuggestion(description);
      setSuggestion(result);
      toast.success("Schema generated successfully");
    } catch (error) {
      toast.error("Failed to generate schema");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="glass-panel border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>AI Schema Assistant</CardTitle>
        </div>
        <CardDescription>
          Describe what your tool does, and I'll generate a valid JSON Schema for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="e.g. A tool to search for GitHub issues by label and state" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={isLoading}
          />
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
          </Button>
        </div>

        {suggestion && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-3 bg-background rounded-md border text-xs text-muted-foreground italic">
              "{suggestion.explanation}"
            </div>
            <div className="relative group">
              <pre className="p-4 bg-black/90 text-green-400 rounded-lg text-[10px] font-mono overflow-x-auto max-h-[300px]">
                {JSON.stringify(suggestion.schema, null, 2)}
              </pre>
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => copyToClipboard(JSON.stringify(suggestion.schema, null, 2))}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
