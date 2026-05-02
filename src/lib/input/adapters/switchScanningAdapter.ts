import { InputHub } from "../ial";

/**
 * Switch Scanning Adapter
 * For users with limited mobility who use 1-2 switch devices
 * 
 * Modes:
 * - Auto-scan: Automatically cycles through elements
 * - Manual scan: User advances with switch
 * - Step scan: More precise control with multiple switches
 */

export type ScanMode = "auto" | "manual" | "step";

export interface SwitchScanningOptions {
  mode?: ScanMode;
  scanIntervalMs?: number;
  dwellTimeMs?: number;
  highlightColor?: string;
  soundFeedback?: boolean;
  wrapAround?: boolean;
}

export class SwitchScanningAdapter {
  private hub: InputHub;
  private options: Required<SwitchScanningOptions>;
  private currentIndex = 0;
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private focusableElements: HTMLElement[] = [];
  private enabled = false;
  private highlightElement: HTMLElement | null = null;
  private audioContext: AudioContext | null = null;
  
  constructor(hub: InputHub, options: SwitchScanningOptions = {}) {
    this.hub = hub;
    this.options = {
      mode: options.mode ?? "auto",
      scanIntervalMs: options.scanIntervalMs ?? 1500,
      dwellTimeMs: options.dwellTimeMs ?? 500,
      highlightColor: options.highlightColor ?? "rgba(255, 200, 0, 0.5)",
      soundFeedback: options.soundFeedback ?? true,
      wrapAround: options.wrapAround ?? true
    };
  }
  
  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="menuitem"]',
      '[role="tab"]'
    ].join(',');
    
    return Array.from(document.querySelectorAll(selector))
      .filter(el => {
        const htmlEl = el as HTMLElement;
        // Check if element is visible
        return htmlEl.offsetParent !== null && 
               !htmlEl.hidden && 
               getComputedStyle(htmlEl).visibility !== 'hidden';
      }) as HTMLElement[];
  }
  
  private createHighlight() {
    if (this.highlightElement) return;
    
    this.highlightElement = document.createElement('div');
    this.highlightElement.id = 'switch-scan-highlight';
    this.highlightElement.setAttribute('aria-hidden', 'true');
    this.highlightElement.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      border: 4px solid ${this.options.highlightColor};
      border-radius: 4px;
      box-shadow: 0 0 20px ${this.options.highlightColor};
      transition: all 0.15s ease-out;
      display: none;
    `;
    document.body.appendChild(this.highlightElement);
  }
  
  private updateHighlight(element: HTMLElement) {
    if (!this.highlightElement) return;
    
    const rect = element.getBoundingClientRect();
    this.highlightElement.style.display = 'block';
    this.highlightElement.style.left = `${rect.left - 4}px`;
    this.highlightElement.style.top = `${rect.top - 4}px`;
    this.highlightElement.style.width = `${rect.width + 8}px`;
    this.highlightElement.style.height = `${rect.height + 8}px`;
  }
  
  private hideHighlight() {
    if (this.highlightElement) {
      this.highlightElement.style.display = 'none';
    }
  }
  
  private playTone(frequency: number, duration: number = 50) {
    if (!this.options.soundFeedback) return;
    
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (e) {
      // Audio not available
    }
  }
  
  private moveToElement(index: number) {
    this.focusableElements = this.getFocusableElements();
    if (this.focusableElements.length === 0) return;
    
    // Handle wrap-around
    if (this.options.wrapAround) {
      this.currentIndex = ((index % this.focusableElements.length) + this.focusableElements.length) % this.focusableElements.length;
    } else {
      this.currentIndex = Math.max(0, Math.min(index, this.focusableElements.length - 1));
    }
    
    const element = this.focusableElements[this.currentIndex];
    if (element) {
      element.focus();
      this.updateHighlight(element);
      this.playTone(440 + this.currentIndex * 20, 50);
      
      // Announce for screen readers
      element.setAttribute('aria-current', 'true');
      this.focusableElements.forEach((el, i) => {
        if (i !== this.currentIndex) {
          el.removeAttribute('aria-current');
        }
      });
    }
  }
  
  next() {
    this.moveToElement(this.currentIndex + 1);
    this.hub.emit({ source: "switch", code: "SWITCH:NEXT", timestamp: Date.now() });
  }
  
  previous() {
    this.moveToElement(this.currentIndex - 1);
    this.hub.emit({ source: "switch", code: "SWITCH:PREV", timestamp: Date.now() });
  }
  
  select() {
    const element = this.focusableElements[this.currentIndex];
    if (element) {
      this.playTone(880, 100);
      element.click();
      this.hub.emit({ source: "switch", code: "SWITCH:SELECT", timestamp: Date.now() });
    }
  }
  
  start() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.createHighlight();
    this.focusableElements = this.getFocusableElements();
    
    if (this.focusableElements.length > 0) {
      this.moveToElement(0);
    }
    
    // Start auto-scan if in auto mode
    if (this.options.mode === 'auto') {
      this.scanTimer = setInterval(() => {
        this.next();
      }, this.options.scanIntervalMs);
    }
    
    // Listen for keyboard triggers (Space/Enter for switch simulation)
    this.setupKeyboardTriggers();
    
    if (import.meta.env.DEV) console.log(`Switch scanning started in ${this.options.mode} mode`);
  }
  
  private setupKeyboardTriggers() {
    const handler = (e: KeyboardEvent) => {
      if (!this.enabled) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.options.mode === 'manual') {
          this.next();
        } else {
          this.select();
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        this.select();
      } else if (e.code === 'Escape') {
        this.stop();
      }
    };
    
    window.addEventListener('keydown', handler);
    (this as any)._keyboardHandler = handler;
  }
  
  stop() {
    this.enabled = false;
    
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    
    this.hideHighlight();
    
    if ((this as any)._keyboardHandler) {
      window.removeEventListener('keydown', (this as any)._keyboardHandler);
    }
    
    if (import.meta.env.DEV) console.log('Switch scanning stopped');
  }
  
  setMode(mode: ScanMode) {
    const wasEnabled = this.enabled;
    if (wasEnabled) this.stop();
    
    this.options.mode = mode;
    
    if (wasEnabled) this.start();
  }
  
  setScanInterval(ms: number) {
    this.options.scanIntervalMs = ms;
    
    if (this.enabled && this.options.mode === 'auto') {
      if (this.scanTimer) {
        clearInterval(this.scanTimer);
      }
      this.scanTimer = setInterval(() => this.next(), ms);
    }
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  getCurrentElement(): HTMLElement | null {
    return this.focusableElements[this.currentIndex] ?? null;
  }
  
  destroy() {
    this.stop();
    if (this.highlightElement) {
      this.highlightElement.remove();
      this.highlightElement = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
