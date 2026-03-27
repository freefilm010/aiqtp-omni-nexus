import React, { createContext, useContext, useState, useEffect } from "react";
import { readStorage, writeStorage } from "@/lib/browserStorage";

export type ThemeType = 
  | "default" 
  | "hacker" 
  | "matrix" 
  | "cyberpunk" 
  | "terminal" 
  | "bloomberg" 
  | "midnight"
  | "neon";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const themeClasses: Record<ThemeType, string> = {
  default: "",
  hacker: "theme-hacker",
  matrix: "theme-matrix",
  cyberpunk: "theme-cyberpunk",
  terminal: "theme-terminal",
  bloomberg: "theme-bloomberg",
  midnight: "theme-midnight",
  neon: "theme-neon"
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = readStorage("localStorage", "trading-theme");
    return (saved as ThemeType) || "default";
  });

  useEffect(() => {
    // Remove all theme classes first
    Object.values(themeClasses).forEach(cls => {
      if (cls) document.documentElement.classList.remove(cls);
    });
    
    // Add new theme class
    const themeClass = themeClasses[theme];
    if (themeClass) {
      document.documentElement.classList.add(themeClass);
    }
    
    writeStorage("localStorage", "trading-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
