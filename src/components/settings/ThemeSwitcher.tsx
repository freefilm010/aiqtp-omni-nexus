import { useTheme, ThemeType } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  Terminal, 
  Cpu, 
  Zap, 
  Monitor, 
  Moon, 
  Sparkles,
  Check
} from "lucide-react";

interface ThemeOption {
  id: ThemeType;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: {
    bg: string;
    accent: string;
    text: string;
  };
}

const THEMES: ThemeOption[] = [
  {
    id: "default",
    name: "Professional",
    description: "Clean, premium financial marketplace look",
    icon: <Monitor className="h-5 w-5" />,
    preview: { bg: "#f8fafc", accent: "#1e3a8a", text: "#1e293b" }
  },
  {
    id: "hacker",
    name: "Hacker",
    description: "Dark terminal aesthetic with green accents",
    icon: <Terminal className="h-5 w-5" />,
    preview: { bg: "#0a0a0a", accent: "#00ff00", text: "#00ff00" }
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Digital rain inspired cybernetic theme",
    icon: <Cpu className="h-5 w-5" />,
    preview: { bg: "#000000", accent: "#00ff41", text: "#00ff41" }
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon-soaked futuristic trading interface",
    icon: <Zap className="h-5 w-5" />,
    preview: { bg: "#0f0f23", accent: "#ff00ff", text: "#00ffff" }
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Classic command-line interface style",
    icon: <Terminal className="h-5 w-5" />,
    preview: { bg: "#1a1a1a", accent: "#ffa500", text: "#ffffff" }
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    description: "Professional trading terminal aesthetic",
    icon: <Monitor className="h-5 w-5" />,
    preview: { bg: "#1a1a2e", accent: "#ff6b35", text: "#e0e0e0" }
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep blue theme for night trading",
    icon: <Moon className="h-5 w-5" />,
    preview: { bg: "#0d1b2a", accent: "#00b4d8", text: "#caf0f8" }
  },
  {
    id: "neon",
    name: "Neon",
    description: "Vibrant synthwave inspired colors",
    icon: <Sparkles className="h-5 w-5" />,
    preview: { bg: "#150030", accent: "#ff2d95", text: "#00fff5" }
  }
];

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Trading Themes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                theme === t.id 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border hover:border-primary/50"
              }`}
              style={{ backgroundColor: t.preview.bg }}
            >
              {theme === t.id && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </Badge>
              )}
              <div 
                className="flex items-center justify-center mb-3"
                style={{ color: t.preview.accent }}
              >
                {t.icon}
              </div>
              <div 
                className="text-sm font-semibold text-center"
                style={{ color: t.preview.text }}
              >
                {t.name}
              </div>
              <div 
                className="text-xs text-center opacity-70 mt-1"
                style={{ color: t.preview.text }}
              >
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSwitcher;
