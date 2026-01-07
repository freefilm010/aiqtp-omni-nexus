import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_LANGUAGES, Language, t, getBrowserLanguage } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
  languages: Language[];
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    // Try to get saved language or detect from browser
    const saved = localStorage.getItem('preferred-language');
    const detected = saved || getBrowserLanguage();
    setLanguageState(detected);
    
    // Set document direction for RTL languages
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === detected);
    if (langConfig?.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, []);

  const setLanguage = (code: string) => {
    setLanguageState(code);
    localStorage.setItem('preferred-language', code);
    
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (langConfig?.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  const translate = (key: string) => t(key, language);
  
  const isRTL = SUPPORTED_LANGUAGES.find(l => l.code === language)?.rtl || false;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: translate, 
      languages: SUPPORTED_LANGUAGES,
      isRTL 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
