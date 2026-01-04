import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import VoiceControl from './VoiceControl';
import AccessibilityPanel from './AccessibilityPanel';
import { Accessibility, ZoomIn, ZoomOut, Contrast, Type } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useAccessibility();

  const toggleFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateSettings({ fontSize: sizes[nextIndex] });
  };

  const toggleHighContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
  };

  return (
    <TooltipProvider>
      <div 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end"
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

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open accessibility settings"
                  >
                    <Accessibility className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Accessibility settings (Alt+A)</p>
                </TooltipContent>
              </Tooltip>
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
