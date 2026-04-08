import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Brain, Cpu, Shield } from "lucide-react";

export type AIModel = 
  | "google/gemini-2.5-flash" 
  | "google/gemini-2.5-pro" 
  | "google/gemini-3-flash-preview"
  | "openai/gpt-5" 
  | "openai/gpt-5-mini"
  | "openai/gpt-5.2"
  | "claude-sonnet-4-5"
  | "claude-haiku-4";

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
  disabled?: boolean;
}

const AI_MODELS: { 
  id: AIModel; 
  name: string; 
  provider: string; 
  badge: string; 
  icon: typeof Sparkles;
  description: string;
}[] = [
  { 
    id: "google/gemini-2.5-flash", 
    name: "Gemini 2.5 Flash", 
    provider: "Google",
    badge: "Fast",
    icon: Zap,
    description: "Fast & efficient for most tasks"
  },
  { 
    id: "google/gemini-2.5-pro", 
    name: "Gemini 2.5 Pro", 
    provider: "Google",
    badge: "Advanced",
    icon: Brain,
    description: "Best for complex reasoning"
  },
  { 
    id: "google/gemini-3-flash-preview", 
    name: "Gemini 3 Flash", 
    provider: "Google",
    badge: "Latest",
    icon: Zap,
    description: "Next-gen speed & capability"
  },
  { 
    id: "openai/gpt-5", 
    name: "GPT-5", 
    provider: "OpenAI",
    badge: "Premium",
    icon: Sparkles,
    description: "Most capable GPT model"
  },
  { 
    id: "openai/gpt-5-mini", 
    name: "GPT-5 Mini", 
    provider: "OpenAI",
    badge: "Balanced",
    icon: Cpu,
    description: "Good balance of speed & quality"
  },
  { 
    id: "openai/gpt-5.2", 
    name: "GPT-5.2", 
    provider: "OpenAI",
    badge: "Reasoning",
    icon: Brain,
    description: "Enhanced reasoning capabilities"
  },
  { 
    id: "claude-sonnet-4-5", 
    name: "Claude Sonnet 4.5", 
    provider: "Anthropic",
    badge: "Reasoning",
    icon: Shield,
    description: "Deep analysis & code generation"
  },
  { 
    id: "claude-haiku-4", 
    name: "Claude Haiku 4", 
    provider: "Anthropic",
    badge: "Speed",
    icon: Zap,
    description: "Fast Claude for quick tasks"
  },
];

export const ModelSelector = ({ value, onChange, disabled }: ModelSelectorProps) => {
  const selectedModel = AI_MODELS.find(m => m.id === value);
  
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AIModel)} disabled={disabled}>
      <SelectTrigger className="w-[180px] h-8 text-xs">
        <SelectValue>
          <div className="flex items-center gap-2">
            {selectedModel && <selectedModel.icon className="h-3 w-3" />}
            <span className="truncate">{selectedModel?.name || "Select Model"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AI_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id} className="py-2">
            <div className="flex items-center gap-2">
              <model.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {model.badge}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{model.description}</p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
