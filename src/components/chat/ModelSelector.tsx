import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Brain, Cpu } from "lucide-react";

export type AIModel = 
  | "google/gemini-2.5-flash" 
  | "google/gemini-2.5-pro" 
  | "openai/gpt-5" 
  | "openai/gpt-5-mini";

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
    id: "openai/gpt-5", 
    name: "GPT-5", 
    provider: "OpenAI",
    badge: "Premium",
    icon: Sparkles,
    description: "Most capable model"
  },
  { 
    id: "openai/gpt-5-mini", 
    name: "GPT-5 Mini", 
    provider: "OpenAI",
    badge: "Balanced",
    icon: Cpu,
    description: "Good balance of speed & quality"
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
