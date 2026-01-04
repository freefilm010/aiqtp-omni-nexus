// Input Abstraction Layer - Unified input system for accessibility

export type CommandIntent =
  | { type: "NAV"; action: "NEXT" | "PREV" | "ACTIVATE" | "BACK" | "HOME" }
  | { type: "FOCUS"; target: "POSITIONS" | "BLOTTER" | "TICKET" | "CHART" | "MARKETPLACE" | "SETTINGS" }
  | { type: "ORDER"; action: "OPEN_TICKET" | "SUBMIT" | "CANCEL_ALL" | "FLATTEN" | "CLOSE_POSITION" }
  | { type: "ALERT"; action: "ACK" | "MUTE" }
  | { type: "VOICE"; text: string }
  | { type: "ACCESSIBILITY"; action: "TOGGLE_PANEL" | "READ_PAGE" | "STOP_READING" | "INCREASE_FONT" | "DECREASE_FONT" };

export type InputSource = "keyboard" | "gamepad" | "webhid" | "webmidi" | "switch" | "voice" | "eyetracker";

export type DeviceEvent = {
  source: InputSource;
  code: string;
  value?: number;
  timestamp: number;
};

export type MappingProfile = Record<string, CommandIntent>;

export class InputHub {
  private profile: MappingProfile;
  private listeners: Array<(intent: CommandIntent) => void> = [];
  private eventLog: DeviceEvent[] = [];
  private maxLogSize = 100;

  constructor(profile: MappingProfile) {
    this.profile = profile;
  }

  setProfile(profile: MappingProfile) {
    this.profile = profile;
  }

  getProfile(): MappingProfile {
    return this.profile;
  }

  onIntent(fn: (intent: CommandIntent) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((x) => x !== fn);
    };
  }

  emit(e: DeviceEvent) {
    // Log event
    this.eventLog.push(e);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    const intent = this.profile[e.code];
    if (!intent) return;
    
    for (const fn of this.listeners) {
      try {
        fn(intent);
      } catch (err) {
        console.error('Intent handler error:', err);
      }
    }
  }

  getEventLog(): DeviceEvent[] {
    return [...this.eventLog];
  }

  clearEventLog() {
    this.eventLog = [];
  }
}

// Singleton instance
let hubInstance: InputHub | null = null;

export function getInputHub(profile?: MappingProfile): InputHub {
  if (!hubInstance) {
    hubInstance = new InputHub(profile || {});
  } else if (profile) {
    hubInstance.setProfile(profile);
  }
  return hubInstance;
}
