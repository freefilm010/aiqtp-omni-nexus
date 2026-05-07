import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import VoiceControl from './VoiceControl';
import AccessibilityPanel from './AccessibilityPanel';
import { 
  Accessibility, 
  ZoomIn, 
  ZoomOut, 
  Contrast, 
  Type, 
  X, 
  Minimize2, 
  Maximize2,
  Settings,
  Eye,
  EyeOff,
  Move,
  Pin,
  PinOff,
  RotateCcw
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useAccessibility();

  // Keyboard shortcut to toggle toolbar visibility (Alt+A)
  // (Hooks must run unconditionally to satisfy React's rules-of-hooks.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        updateSettings({ toolbarVisible: !settings.toolbarVisible });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.toolbarVisible, updateSettings]);

  // Hide on auth page to prevent visual overlap (after all hooks have been called)
  if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
    return null;
  }

  const toggleFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateSettings({ fontSize: sizes[nextIndex] });
  };

  const toggleHighContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
  };

  const resetSettings = () => {
    updateSettings({
      highContrast: false,
      fontSize: 'normal',
      reducedMotion: false,
      screenReaderOptimized: false,
      voiceEnabled: false,
    });
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  // If toolbar is hidden, show only a small floating button to restore it
  if (!settings.toolbarVisible) {
    return (
      <TooltipProvider>
        <div className={`fixed ${positionClasses[settings.toolbarPosition]} z-50`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateSettings({ toolbarVisible: true })}
                className="bg-background/95 backdrop-blur shadow-lg"
                aria-label="Show accessibility toolbar"
              >
                <Accessibility className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show Accessibility Toolbar (Alt+A)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // If minimized, show compact version
  if (settings.toolbarMinimized) {
    return (
      <TooltipProvider>
        <div 
          className={`fixed ${positionClasses[settings.toolbarPosition]} z-50`}
          role="toolbar"
          aria-label="Accessibility toolbar (minimized)"
        >
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur border rounded-lg p-1 shadow-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateSettings({ toolbarMinimized: false })}
                  aria-label="Expand accessibility toolbar"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Expand toolbar</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateSettings({ toolbarVisible: false })}
                  aria-label="Hide accessibility toolbar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hide toolbar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div 
        className={`fixed ${positionClasses[settings.toolbarPosition]} z-50 flex flex-col gap-2 items-end`}
        role="toolbar"
        aria-label="Accessibility toolbar"
      >
        {/* Main Toolbar */}
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg">
          {/* Voice Control */}
          <VoiceControl onOpenAccessibilityPanel={() => setIsOpen(true)} />
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* High Contrast Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settings.highContrast ? "default" : "ghost"}
                size="sm"
                onClick={toggleHighContrast}
                aria-label={settings.highContrast ? 'Disable high contrast' : 'Enable high contrast'}
                aria-pressed={settings.highContrast}
                className="gap-1"
              >
                <Contrast className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Contrast</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{settings.highContrast ? 'Disable' : 'Enable'} high contrast</p>
            </TooltipContent>
          </Tooltip>

          {/* Font Size Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFontSize}
                aria-label={`Font size: ${settings.fontSize}`}
                className="gap-1"
              >
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline text-xs capitalize">{settings.fontSize}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle font size (current: {settings.fontSize})</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Position & Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Toolbar settings"
                className="gap-1"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toolbar Position</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => updateSettings({ toolbarPosition: 'bottom-right' })}
                className={settings.toolbarPosition === 'bottom-right' ? 'bg-primary/10' : ''}
              >
                <Move className="h-4 w-4 mr-2" />
                Bottom Right
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateSettings({ toolbarPosition: 'bottom-left' })}
                className={settings.toolbarPosition === 'bottom-left' ? 'bg-primary/10' : ''}
              >
                <Move className="h-4 w-4 mr-2" />
                Bottom Left
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateSettings({ toolbarPosition: 'top-right' })}
                className={settings.toolbarPosition === 'top-right' ? 'bg-primary/10' : ''}
              >
                <Move className="h-4 w-4 mr-2" />
                Top Right
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateSettings({ toolbarPosition: 'top-left' })}
                className={settings.toolbarPosition === 'top-left' ? 'bg-primary/10' : ''}
              >
                <Move className="h-4 w-4 mr-2" />
                Top Left
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Display Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => updateSettings({ toolbarMinimized: true })}>
                <Minimize2 className="h-4 w-4 mr-2" />
                Minimize Toolbar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSettings({ toolbarVisible: false })}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Toolbar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetSettings}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Minimize Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateSettings({ toolbarMinimized: true })}
                aria-label="Minimize accessibility toolbar"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Minimize</p>
            </TooltipContent>
          </Tooltip>

          {/* Hide Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateSettings({ toolbarVisible: false })}
                aria-label="Hide accessibility toolbar"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hide (Alt+A to show)</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Full Settings Panel */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Open full accessibility settings"
                className="gap-1"
              >
                <Accessibility className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Accessibility Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <AccessibilityPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Status indicators */}
        {(settings.voiceEnabled || settings.screenReaderOptimized || settings.brailleDisplayMode) && (
          <div className="flex gap-1 text-xs">
            {settings.voiceEnabled && (
              <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Voice
              </span>
            )}
            {settings.screenReaderOptimized && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Screen Reader
              </span>
            )}
            {settings.brailleDisplayMode && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                Braille
              </span>
            )}
          </div>
        )}

        {/* Quick Toggle Panel */}
        <div className="flex gap-1 bg-background/95 backdrop-blur border rounded-lg p-1 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settings.reducedMotion ? "default" : "ghost"}
                size="icon"
                onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                aria-label="Toggle reduced motion"
                aria-pressed={settings.reducedMotion}
                className="h-8 w-8"
              >
                <span className="text-xs">🎬</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reduced Motion: {settings.reducedMotion ? 'On' : 'Off'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settings.screenReaderOptimized ? "default" : "ghost"}
                size="icon"
                onClick={() => updateSettings({ screenReaderOptimized: !settings.screenReaderOptimized })}
                aria-label="Toggle screen reader mode"
                aria-pressed={settings.screenReaderOptimized}
                className="h-8 w-8"
              >
                <span className="text-xs">👁️</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Screen Reader: {settings.screenReaderOptimized ? 'On' : 'Off'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settings.voiceEnabled ? "default" : "ghost"}
                size="icon"
                onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                aria-label="Toggle voice control"
                aria-pressed={settings.voiceEnabled}
                className="h-8 w-8"
              >
                <span className="text-xs">🎤</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voice Control: {settings.voiceEnabled ? 'On' : 'Off'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AccessibilityToolbar;