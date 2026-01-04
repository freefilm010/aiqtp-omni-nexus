import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
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

interface VoiceControlProps {
  onOpenAccessibilityPanel?: () => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ onOpenAccessibilityPanel }) => {
  const navigate = useNavigate();
  const {
    settings,
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    transcript,
    announce
  } = useAccessibility();

  // Process voice commands
  const processCommand = useCallback((command: string) => {
    const cmd = command.toLowerCase().trim();
    
    // Navigation commands
    if (cmd.includes('go to') || cmd.includes('navigate to') || cmd.includes('open')) {
      if (cmd.includes('trading') || cmd.includes('trade')) {
        navigate('/trading');
        announce('Navigating to trading dashboard');
      } else if (cmd.includes('portfolio')) {
        navigate('/trading');
        announce('Navigating to portfolio');
      } else if (cmd.includes('analytics')) {
        navigate('/analytics');
        announce('Navigating to analytics');
      } else if (cmd.includes('strategy') || cmd.includes('strategies')) {
        navigate('/strategy-lab');
        announce('Navigating to strategy lab');
      } else if (cmd.includes('nft')) {
        navigate('/nft-studio');
        announce('Navigating to NFT studio');
      } else if (cmd.includes('token')) {
        navigate('/token-launchpad');
        announce('Navigating to token launchpad');
      } else if (cmd.includes('settings') || cmd.includes('accessibility')) {
        onOpenAccessibilityPanel?.();
        announce('Opening accessibility settings');
      } else if (cmd.includes('home')) {
        navigate('/');
        announce('Navigating to home');
      }
    }
    
    // Reading commands
    else if (cmd.includes('read') || cmd.includes('tell me')) {
      if (cmd.includes('page') || cmd.includes('content')) {
        const mainContent = document.querySelector('main')?.textContent || 
                           document.querySelector('[role="main"]')?.textContent ||
                           document.body.textContent;
        if (mainContent) {
          speak(mainContent.slice(0, 2000)); // Limit to first 2000 chars
        }
      } else if (cmd.includes('balance') || cmd.includes('portfolio')) {
        announce('Reading your portfolio balance');
        // This would integrate with actual portfolio data
        speak('Your current portfolio value is displayed on screen.');
      }
    }
    
    // Control commands
    else if (cmd.includes('stop') || cmd.includes('quiet') || cmd.includes('silence')) {
      stopSpeaking();
      announce('Stopped reading');
    }
    
    // Help commands
    else if (cmd.includes('help') || cmd.includes('commands')) {
      speak('Available commands include: Go to trading, Go to portfolio, Go to analytics, Read this page, Stop reading, Open settings, and Help.');
    }
  }, [navigate, speak, stopSpeaking, announce, onOpenAccessibilityPanel]);

  // Listen for transcript changes
  useEffect(() => {
    if (transcript) {
      processCommand(transcript);
    }
  }, [transcript, processCommand]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A for accessibility panel
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        onOpenAccessibilityPanel?.();
      }
      // Alt + R to read page
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        const mainContent = document.querySelector('main')?.textContent;
        if (mainContent && settings.voiceEnabled) {
          speak(mainContent.slice(0, 2000));
        }
      }
      // Escape to stop speaking
      if (e.key === 'Escape' && isSpeaking) {
        stopSpeaking();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.voiceEnabled, speak, stopSpeaking, isSpeaking, onOpenAccessibilityPanel]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1" role="toolbar" aria-label="Voice controls">
        {/* Microphone button for voice input */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isListening ? "default" : "ghost"}
              size="icon"
              onClick={isListening ? stopListening : startListening}
              className={isListening ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}
              aria-label={isListening ? 'Stop listening' : 'Start voice command'}
              aria-pressed={isListening}
            >
              {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? 'Stop listening (click or say "stop")' : 'Start voice command'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Speaker button for text-to-speech */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isSpeaking ? "default" : "ghost"}
              size="icon"
              onClick={isSpeaking ? stopSpeaking : () => {
                const content = document.querySelector('main')?.textContent;
                if (content && settings.voiceEnabled) {
                  speak(content.slice(0, 2000));
                }
              }}
              disabled={!settings.voiceEnabled}
              aria-label={isSpeaking ? 'Stop reading' : 'Read page aloud'}
              aria-pressed={isSpeaking}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSpeaking ? 'Stop reading' : 'Read page aloud (Alt+R)'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Settings button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenAccessibilityPanel}
              aria-label="Accessibility settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Accessibility settings (Alt+A)</p>
          </TooltipContent>
        </Tooltip>

        {/* Live transcript display */}
        {isListening && transcript && (
          <div 
            className="ml-2 px-2 py-1 bg-muted rounded text-sm max-w-xs truncate"
            role="status"
            aria-live="polite"
          >
            {transcript}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default VoiceControl;
