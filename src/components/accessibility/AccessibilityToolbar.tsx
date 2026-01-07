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
  EyeOff
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

const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useAccessibility();

  // Keyboard shortcut to toggle toolbar visibility (Alt+A)
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

  const toggleFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateSettings({ fontSize: sizes[nextIndex] });
  };

  const toggleHighContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
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
        {/* Quick action buttons */}
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur border rounded-lg p-1 shadow-lg">
          <VoiceControl onOpenAccessibilityPanel={() => setIsOpen(true)} />
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settings.highContrast ? "default" : "ghost"}
                size="icon"
                onClick={toggleHighContrast}
                aria-label={settings.highContrast ? 'Disable high contrast' : 'Enable high contrast'}
                aria-pressed={settings.highContrast}
              >
                <Contrast className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{settings.highContrast ? 'Disable' : 'Enable'} high contrast</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFontSize}
                aria-label={`Font size: ${settings.fontSize}`}
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle font size ({settings.fontSize})</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Toolbar position settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toolbar settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-background border" align="end">
              <div className="space-y-4">
                <div className="font-medium text-sm">Toolbar Settings</div>
                
                <div className="space-y-2">
                  <Label htmlFor="toolbar-position" className="text-xs">Position</Label>
                  <Select
                    value={settings.toolbarPosition}
                    onValueChange={(value: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => 
                      updateSettings({ toolbarPosition: value })
                    }
                  >
                    <SelectTrigger id="toolbar-position" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-[60]">
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="always-show" className="text-xs">Always visible</Label>
                  <Switch
                    id="always-show"
                    checked={settings.toolbarVisible}
                    onCheckedChange={(checked) => updateSettings({ toolbarVisible: checked })}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Minimize button */}
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
              <p>Minimize toolbar</p>
            </TooltipContent>
          </Tooltip>

          {/* Hide button */}
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
              <p>Hide toolbar (press Alt+A to show)</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open accessibility settings"
              >
                <Accessibility className="h-4 w-4" />
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
              <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded">Voice</span>
            )}
            {settings.screenReaderOptimized && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded">Screen Reader</span>
            )}
            {settings.brailleDisplayMode && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded">Braille</span>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AccessibilityToolbar;