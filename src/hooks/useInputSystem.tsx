import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createInputSystem, 
  InputSystem, 
  InputSystemOptions,
  CommandIntent,
  ProfileName 
} from '@/lib/input/inputBootstrap';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export function useInputSystem(options: InputSystemOptions = {}) {
  const [system, setSystem] = useState<InputSystem | null>(null);
  const [lastIntent, setLastIntent] = useState<CommandIntent | null>(null);
  const navigate = useNavigate();
  const { speak, announce } = useAccessibility();
  const unsubRef = useRef<(() => void) | null>(null);
  
  // Initialize system
  useEffect(() => {
    const inputSystem = createInputSystem(options);
    setSystem(inputSystem);
    
    // Set up intent handler
    unsubRef.current = inputSystem.hub.onIntent((intent) => {
      setLastIntent(intent);
      handleIntent(intent);
    });
    
    return () => {
      unsubRef.current?.();
      inputSystem.destroy();
    };
  }, []);
  
  // Handle intents
  const handleIntent = useCallback((intent: CommandIntent) => {
    switch (intent.type) {
      case "NAV":
        handleNavIntent(intent.action);
        break;
      case "FOCUS":
        handleFocusIntent(intent.target);
        break;
      case "ACCESSIBILITY":
        handleAccessibilityIntent(intent.action);
        break;
      case "VOICE":
        // Handle voice text
        if (import.meta.env.DEV) console.log("Voice input:", intent.text);
        break;
    }
  }, [navigate, speak, announce]);
  
  const handleNavIntent = (action: string) => {
    switch (action) {
      case "NEXT":
        moveFocus(1);
        break;
      case "PREV":
        moveFocus(-1);
        break;
      case "ACTIVATE":
        (document.activeElement as HTMLElement)?.click();
        break;
      case "BACK":
        navigate(-1);
        break;
      case "HOME":
        navigate('/');
        break;
    }
  };
  
  const handleFocusIntent = (target: string) => {
    const selectors: Record<string, string> = {
      TICKET: '[data-focus-area="ticket"], [aria-label*="order"]',
      POSITIONS: '[data-focus-area="positions"], [aria-label*="position"]',
      BLOTTER: '[data-focus-area="blotter"], [aria-label*="trade"]',
      CHART: '[data-focus-area="chart"], [aria-label*="chart"]',
      MARKETPLACE: '[data-focus-area="marketplace"], [aria-label*="market"]',
      SETTINGS: '[data-focus-area="settings"], [aria-label*="setting"]'
    };
    
    const selector = selectors[target];
    if (selector) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
        announce(`Focused on ${target.toLowerCase()}`);
      }
    }
  };
  
  const handleAccessibilityIntent = (action: string) => {
    switch (action) {
      case "TOGGLE_PANEL":
        // Dispatch a custom event that AccessibilityPanel can listen to
        window.dispatchEvent(new CustomEvent('toggle-accessibility-panel'));
        break;
      case "READ_PAGE":
        const content = document.querySelector('main')?.textContent;
        if (content) speak(content.slice(0, 2000));
        break;
      case "STOP_READING":
        window.speechSynthesis.cancel();
        break;
      case "INCREASE_FONT":
        document.documentElement.style.fontSize = 
          `${parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.1}px`;
        break;
      case "DECREASE_FONT":
        document.documentElement.style.fontSize = 
          `${parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.9}px`;
        break;
    }
  };
  
  const moveFocus = (direction: number) => {
    const focusable = Array.from(document.querySelectorAll(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];
    
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
    focusable[nextIndex]?.focus();
  };
  
  const setProfile = useCallback((name: ProfileName) => {
    system?.setProfile(name);
    announce(`Switched to ${name} input profile`);
  }, [system, announce]);
  
  const startSwitchScanning = useCallback(() => {
    system?.switchScanning.start();
    announce("Switch scanning enabled");
  }, [system, announce]);
  
  const stopSwitchScanning = useCallback(() => {
    system?.switchScanning.stop();
    announce("Switch scanning disabled");
  }, [system, announce]);
  
  const connectHID = useCallback(async () => {
    if (!system?.hid.isSupported()) {
      announce("WebHID is not supported in this browser");
      return null;
    }
    
    try {
      const device = await system.hid.requestDevice();
      if (device) {
        announce(`Connected to ${device.productName}`);
      }
      return device;
    } catch (error) {
      announce("Failed to connect HID device");
      return null;
    }
  }, [system, announce]);
  
  const startMIDI = useCallback(async () => {
    if (!system?.midi.isSupported()) {
      announce("WebMIDI is not supported in this browser");
      return;
    }
    
    try {
      await system.midi.start();
      announce("MIDI devices connected");
    } catch (error) {
      announce("Failed to start MIDI");
    }
  }, [system, announce]);
  
  return {
    system,
    lastIntent,
    setProfile,
    startSwitchScanning,
    stopSwitchScanning,
    connectHID,
    startMIDI,
    isHIDSupported: system?.hid.isSupported() ?? false,
    isMIDISupported: system?.midi.isSupported() ?? false
  };
}
