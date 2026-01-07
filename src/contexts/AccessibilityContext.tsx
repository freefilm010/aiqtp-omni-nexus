import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AccessibilitySettings {
  // Voice settings
  voiceEnabled: boolean;
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
  selectedVoice: string;
  
  // Visual settings
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  fontSize: 'normal' | 'large' | 'extra-large';
  reducedMotion: boolean;
  
  // Hearing settings
  visualAlerts: boolean;
  captionsEnabled: boolean;
  signLanguageMode: boolean;
  
  // Screen reader settings
  screenReaderOptimized: boolean;
  focusIndicatorEnhanced: boolean;
  keyboardNavigationMode: boolean;
  
  // Braille display support
  brailleDisplayMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  speak: (text: string, priority?: 'polite' | 'assertive') => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  availableVoices: SpeechSynthesisVoice[];
}

const defaultSettings: AccessibilitySettings = {
  voiceEnabled: false,
  voiceSpeed: 1,
  voicePitch: 1,
  voiceVolume: 1,
  selectedVoice: '',
  highContrast: false,
  colorBlindMode: 'none',
  fontSize: 'normal',
  reducedMotion: false,
  visualAlerts: false,
  captionsEnabled: false,
  signLanguageMode: false,
  screenReaderOptimized: false,
  focusIndicatorEnhanced: false,
  keyboardNavigationMode: false,
  brailleDisplayMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [recognition, setRecognition] = useState<any>(null);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply visual settings
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Color blind modes
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(settings.colorBlindMode);
    }
    
    // Font size
    root.classList.remove('text-large', 'text-extra-large');
    if (settings.fontSize === 'large') {
      root.classList.add('text-large');
    } else if (settings.fontSize === 'extra-large') {
      root.classList.add('text-extra-large');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Enhanced focus
    if (settings.focusIndicatorEnhanced) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // Keyboard navigation mode
    if (settings.keyboardNavigationMode) {
      root.classList.add('keyboard-nav');
    } else {
      root.classList.remove('keyboard-nav');
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const speak = useCallback((text: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.voiceSpeed;
    utterance.pitch = settings.voicePitch;
    utterance.volume = settings.voiceVolume;
    
    if (settings.selectedVoice) {
      const voice = availableVoices.find(v => v.name === settings.selectedVoice);
      if (voice) utterance.voice = voice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [settings, availableVoices]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create live region announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Also speak if voice is enabled
    if (settings.voiceEnabled) {
      speak(message, priority);
    }
    
    // Show visual alert if enabled
    if (settings.visualAlerts) {
      showVisualAlert(message);
    }
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [settings.voiceEnabled, settings.visualAlerts, speak]);

  const showVisualAlert = (message: string) => {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 z-[9999] bg-primary text-primary-foreground p-4 rounded-lg shadow-lg animate-pulse max-w-md';
    alert.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 5000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        speak,
        stopSpeaking,
        isSpeaking,
        startListening,
        stopListening,
        isListening,
        transcript,
        announce,
        availableVoices,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};
