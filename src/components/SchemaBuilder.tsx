import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Settings2,
  Type,
  Hash,
  ToggleLeft,
  Braces,
  List,
  FileCode,
  Info,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MCPParameter } from "@/types";

interface SchemaBuilderProps {
  parameters: MCPParameter[];
  onChange: (parameters: MCPParameter[]) => void;
}

const PARAM_LOCATIONS = [
  { value: 'query', label: 'Query' },
  { value: 'body', label: 'Body' },
  { value: 'path', label: 'Path' },
  { value: 'header', label: 'Header' },
  { value: 'formData', label: 'Form' },
];

const PARAM_TYPES = [
  { value: 'string', label: 'String', icon: Type },
  { value: 'integer', label: 'Integer', icon: Hash },
  { value: 'number', label: 'Decimal', icon: Hash },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { value: 'array', label: 'Array', icon: List },
  { value: 'object', label: 'Object', icon: Braces },
  { value: 'file', label: 'File', icon: FileCode },
];

export default function SchemaBuilder({ parameters, onChange }: SchemaBuilderProps) {
  const addParameter = () => {
    const newParam: MCPParameter = {
      name: "",
      in: "body",
      type: "string",
      description: "",
      required: false,
    };
    onChange([...parameters, newParam]);
  };

  const removeParameter = (index: number) => {
    const updated = [...parameters];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateParameter = (index: number, updates: Partial<MCPParameter>) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-2">
        <h4 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Parameter Definitions
        </h4>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addParameter} 
          className="h-10 text-xs font-bold gap-2 border-primary/20 text-primary hover:bg-primary/5 px-4 rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" /> 
          Add Parameter
        </Button>
      </div>

      <div className="space-y-6">
        {parameters.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-[32px] bg-secondary/5">
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Info className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground font-medium italic">No parameters defined. Start by adding one above.</p>
          </div>
        ) : (
          parameters.map((param, idx) => (
            <ParameterRow 
              key={idx} 
              parameter={param} 
              onChange={(updates) => updateParameter(idx, updates)}
              onDelete={() => removeParameter(idx)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ParameterRowProps {
  parameter: MCPParameter;
  onChange: (updates: Partial<MCPParameter>) => void;
  onDelete: () => void;
  depth?: number;
  isLast?: boolean;
}

const NEON_COLORS = [
  "#00D2FF", // Level 1: Electric Blue
  "#9D50BB", // Level 2: Neon Purple
  "#39FF14", // Level 3: Neon Green
  "#FF007F", // Level 4: Neon Pink
  "#00FFFF", // Level 5: Cyan/Aqua
];

const ParameterRow: React.FC<ParameterRowProps> = ({ parameter, onChange, onDelete, depth = 0, isLast = true }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [useEnum, setUseEnum] = useState(!!parameter.enumValues?.length);
  const [enumInputValue, setEnumInputValue] = useState("");

  // Get color for current depth (cycling if deeper than defined colors)
  const getLineColor = (d: number) => NEON_COLORS[(d - 1) % NEON_COLORS.length];

  const addEnumValue = () => {
    if (!enumInputValue.trim()) return;
    const currentOnes = parameter.enumValues || [];
    if (!currentOnes.includes(enumInputValue.trim())) {
      onChange({ enumValues: [...currentOnes, enumInputValue.trim()] });
    }
    setEnumInputValue("");
  };

  const removeEnumValue = (val: string) => {
    onChange({ enumValues: (parameter.enumValues || []).filter(v => v !== val) });
  };

  return (
    <div className={cn(
      "group relative transition-all duration-300",
      depth > 0 && "ml-10"
    )}>
      {/* Visual Guide System */}
      {depth > 0 && (
        <>
          {/* Cumulative Vertical Parent Lines */}
          {Array.from({ length: depth }).map((_, i) => {
            const level = i + 1;
            const color = getLineColor(level);
            // Calibrated offset to align lines perfectly across depths
            const offset = (depth - level) * 40 + 20; 
            
            return (
              <div 
                key={level}
                className="absolute -top-4 -bottom-4 w-[2.5px] transition-all duration-500"
                style={{ 
                  left: `-${offset}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}33, 0 0 3px ${color}`,
                  opacity: level === depth ? 1 : 0.15
                }}
              />
            );
          })}
          
          {/* Connecting "Elbow" for the current level */}
          <div 
            className="absolute -left-5 top-0 w-5 h-12 border-b-[2.5px] border-l-[2.5px] rounded-bl-2xl transition-all duration-500"
            style={{ 
              borderColor: getLineColor(depth),
              boxShadow: `inset 2px -2px 10px ${getLineColor(depth)}11`,
            }}
          />
        </>
      )}

      <div className={cn(
        "relative rounded-[24px] border-2 border-border bg-card/50 backdrop-blur-md shadow-lg overflow-hidden group-hover:border-primary/40 transition-all duration-500",
        !isExpanded && "opacity-70 grayscale-[0.2]"
      )}>
        <div className="flex items-center gap-6 p-6 bg-secondary/5">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="flex flex-col gap-2 flex-1 max-w-[280px]">
              <Label className="text-[11px] font-bold text-muted-foreground px-1">Parameter Name</Label>
              <Input 
                value={parameter.name}
                placeholder="param_name"
                className="h-11 font-mono text-sm bg-background border-border focus:ring-primary/20 rounded-xl"
                onChange={e => onChange({ name: e.target.value })}
              />
            </div>
            
            <div className="flex flex-col gap-2 w-32">
              <Label className="text-[11px] font-bold text-muted-foreground px-1">Transfer Type</Label>
              <Select 
                value={parameter.in} 
                onValueChange={(val: any) => onChange({ in: val })}
              >
                <SelectTrigger className="h-11 text-xs font-bold bg-background border-border rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PARAM_LOCATIONS.map(loc => (
                    <SelectItem key={loc.value} value={loc.value} className="text-xs font-medium">{loc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 w-36">
              <Label className="text-[11px] font-bold text-muted-foreground px-1">Data Type</Label>
              <Select 
                value={parameter.type} 
                onValueChange={(val: any) => onChange({ type: val })}
              >
                <SelectTrigger className="h-11 text-xs font-bold bg-background border-border rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PARAM_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value} className="text-xs font-bold">
                        <div className="flex items-center gap-2">
                           <Icon className="w-4 h-4 text-primary/70" /> {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6 px-4 pt-6">
              <div className="flex flex-col items-center gap-2">
                <Switch 
                  checked={parameter.required} 
                  onCheckedChange={req => onChange({ required: req })} 
                  className="scale-90"
                />
                <span className="text-[10px] font-bold text-muted-foreground">Required</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Switch 
                  checked={parameter.nullable} 
                  onCheckedChange={nul => onChange({ nullable: nul })} 
                  className="scale-90"
                />
                <span className="text-[10px] font-bold text-muted-foreground">Nullable</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-border pl-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-muted-foreground hover:bg-secondary rounded-xl transition-all" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5 text-primary" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all" 
              onClick={onDelete}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-8 border-t-2 border-border/10 bg-secondary/5 space-y-8 animate-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-2">
                <Label className="text-xs font-bold text-foreground">Description</Label>
                <Input 
                  value={parameter.description}
                  placeholder="Detailed explanation of this input..."
                  className="h-11 text-sm bg-background border-border rounded-xl shadow-inner px-4 overflow-hidden"
                  onChange={e => onChange({ description: e.target.value })}
                />
              </div>
              
              {parameter.type === 'array' && (
                <div className="md:col-span-4 space-y-2">
                  <Label className="text-xs font-bold text-foreground">Items Type</Label>
                  <Select 
                    value={parameter.itemsType || 'string'} 
                    onValueChange={val => onChange({ itemsType: val })}
                  >
                    <SelectTrigger className="h-11 text-sm font-semibold bg-background border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="integer">Integer</SelectItem>
                      <SelectItem value="number">Decimal</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {['string', 'number', 'integer'].includes(parameter.type) && (
                <div className="md:col-span-12">
                   <div className="bg-background/40 border border-border p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <List className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">Enum Values</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground mr-1">Use Enum</span>
                            <Switch checked={useEnum} onCheckedChange={(val) => {
                               setUseEnum(val);
                               if (!val) onChange({ enumValues: undefined });
                            }} />
                         </div>
                      </div>

                      {useEnum && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                           <div className="flex gap-2">
                              <Input 
                                value={enumInputValue}
                                placeholder="Add choice..."
                                className="h-10 text-xs font-mono bg-background border-border"
                                onChange={e => setEnumInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addEnumValue()}
                              />
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-10 px-4 font-bold rounded-lg"
                                onClick={addEnumValue}
                              >
                                Add
                              </Button>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {(parameter.enumValues || []).map(val => (
                                <Badge 
                                  key={val} 
                                  className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 px-3 py-1.5 rounded-lg gap-2 cursor-default"
                                >
                                  <span className="font-mono text-[11px] font-bold">{val}</span>
                                  <X 
                                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                                    onClick={() => removeEnumValue(val)}
                                  />
                                </Badge>
                              ))}
                              {(!parameter.enumValues || parameter.enumValues.length === 0) && (
                                <span className="text-[11px] text-muted-foreground italic">No values defined yet.</span>
                              )}
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>

            {/* Recursive Object Properties */}
            {parameter.type === 'object' && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h5 className="text-sm font-bold text-primary flex items-center gap-2">
                    <Braces className="w-4 h-4" />
                    Object Schema Properties
                  </h5>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs font-bold text-primary hover:bg-primary/10 gap-2 px-4 rounded-xl shadow-sm"
                    onClick={() => {
                      const props = parameter.properties || [];
                      onChange({ properties: [...props, { name: "", in: parameter.in, type: "string", required: false }] });
                    }}
                  >
                    <Plus className="w-4 h-4" /> 
                    Add Property
                  </Button>
                </div>
                <div className="space-y-6">
                  {(parameter.properties || []).map((prop, pidx) => (
                    <ParameterRow 
                      key={pidx} 
                      parameter={prop} 
                      depth={depth + 1}
                      isLast={pidx === (parameter.properties?.length || 0) - 1}
                      onChange={(upd) => {
                        const next = [...(parameter.properties || [])];
                        next[pidx] = { ...next[pidx], ...upd };
                        onChange({ properties: next });
                      }}
                      onDelete={() => {
                        const next = [...(parameter.properties || [])];
                        next.splice(pidx, 1);
                        onChange({ properties: next });
                      }}
                    />
                  ))}
                  {(!parameter.properties || parameter.properties.length === 0) && (
                    <div className="p-16 text-center border-2 border-dashed border-border rounded-3xl bg-background/50">
                       <p className="text-sm text-muted-foreground font-medium italic">No object properties defined.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recursive Array Object Properties */}
            {parameter.type === 'array' && parameter.itemsType === 'object' && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h5 className="text-sm font-bold text-primary flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Item Schema Properties
                  </h5>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs font-bold text-primary hover:bg-primary/10 gap-2 px-4 rounded-xl"
                    onClick={() => {
                      const items = parameter.items || { properties: [] };
                      const props = items.properties || [];
                      onChange({ items: { ...items, properties: [...props, { name: "", in: parameter.in, type: "string", required: false }] } });
                    }}
                  >
                    <Plus className="w-4 h-4" /> 
                    Add Item Property
                  </Button>
                </div>
                <div className="space-y-6">
                  {(parameter.items?.properties || []).map((prop: any, pidx: number) => (
                    <ParameterRow 
                      key={pidx} 
                      parameter={prop} 
                      depth={depth + 1}
                      isLast={pidx === (parameter.items?.properties?.length || 0) - 1}
                      onChange={(upd) => {
                        const items = parameter.items || { properties: [] };
                        const next = [...(items.properties || [])];
                        next[pidx] = { ...next[pidx], ...upd };
                        onChange({ items: { ...items, properties: next } });
                      }}
                      onDelete={() => {
                        const items = parameter.items || { properties: [] };
                        const next = [...(items.properties || [])];
                        next.splice(pidx, 1);
                        onChange({ items: { ...items, properties: next } });
                      }}
                    />
                  ))}
                  {(!parameter.items?.properties || parameter.items.properties.length === 0) && (
                    <div className="p-16 text-center border-2 border-dashed border-border rounded-3xl bg-background/50">
                       <p className="text-sm text-muted-foreground font-medium italic">No item properties defined.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

