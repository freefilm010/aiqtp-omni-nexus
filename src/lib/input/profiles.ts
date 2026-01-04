import { MappingProfile } from "./ial";

// Standard trader keyboard profile - vim-style navigation
export const PROFILE_TRADER_KEYBOARD: MappingProfile = {
  // Navigation (vim-style)
  "KeyJ": { type: "NAV", action: "NEXT" },
  "KeyK": { type: "NAV", action: "PREV" },
  "Enter": { type: "NAV", action: "ACTIVATE" },
  "Escape": { type: "NAV", action: "BACK" },
  "KeyH": { type: "NAV", action: "HOME" },
  
  // Focus jumps (number keys)
  "Digit1": { type: "FOCUS", target: "TICKET" },
  "Digit2": { type: "FOCUS", target: "POSITIONS" },
  "Digit3": { type: "FOCUS", target: "BLOTTER" },
  "Digit4": { type: "FOCUS", target: "CHART" },
  "Digit5": { type: "FOCUS", target: "MARKETPLACE" },
  "Digit0": { type: "FOCUS", target: "SETTINGS" },
  
  // Order actions
  "KeyO": { type: "ORDER", action: "OPEN_TICKET" },
  "KeyS": { type: "ORDER", action: "SUBMIT" },
  "KeyX": { type: "ORDER", action: "CANCEL_ALL" },
  "KeyF": { type: "ORDER", action: "FLATTEN" },
  "KeyC": { type: "ORDER", action: "CLOSE_POSITION" },
  
  // Alerts
  "KeyA": { type: "ALERT", action: "ACK" },
  "KeyM": { type: "ALERT", action: "MUTE" },
  
  // Accessibility
  "Alt+KeyA": { type: "ACCESSIBILITY", action: "TOGGLE_PANEL" },
  "Alt+KeyR": { type: "ACCESSIBILITY", action: "READ_PAGE" },
  "Alt+Period": { type: "ACCESSIBILITY", action: "STOP_READING" },
  "Alt+Equal": { type: "ACCESSIBILITY", action: "INCREASE_FONT" },
  "Alt+Minus": { type: "ACCESSIBILITY", action: "DECREASE_FONT" },
};

// Screen reader safe profile - avoids common SR hotkeys
export const PROFILE_SCREENREADER_SAFE: MappingProfile = {
  // Minimal and explicit - avoids JAWS/NVDA/VoiceOver conflicts
  "Enter": { type: "NAV", action: "ACTIVATE" },
  "Escape": { type: "NAV", action: "BACK" },
  
  // Alt+Shift combos are generally safe
  "Alt+Shift+Digit1": { type: "FOCUS", target: "TICKET" },
  "Alt+Shift+Digit2": { type: "FOCUS", target: "POSITIONS" },
  "Alt+Shift+Digit3": { type: "FOCUS", target: "BLOTTER" },
  "Alt+Shift+Digit4": { type: "FOCUS", target: "CHART" },
  "Alt+Shift+Digit5": { type: "FOCUS", target: "MARKETPLACE" },
  
  // Order actions with Ctrl+Shift
  "Ctrl+Shift+KeyO": { type: "ORDER", action: "OPEN_TICKET" },
  "Ctrl+Shift+KeyS": { type: "ORDER", action: "SUBMIT" },
  "Ctrl+Shift+KeyX": { type: "ORDER", action: "CANCEL_ALL" },
  
  // Accessibility
  "Alt+Shift+KeyA": { type: "ACCESSIBILITY", action: "TOGGLE_PANEL" },
  "Alt+Shift+KeyR": { type: "ACCESSIBILITY", action: "READ_PAGE" },
};

// Gamepad/controller profile (Xbox/PlayStation layout)
export const PROFILE_CONTROLLER_DEFAULT: MappingProfile = {
  // Face buttons
  "GP:BTN_A": { type: "NAV", action: "ACTIVATE" },
  "GP:BTN_B": { type: "NAV", action: "BACK" },
  "GP:BTN_X": { type: "ORDER", action: "CANCEL_ALL" },
  "GP:BTN_Y": { type: "ORDER", action: "OPEN_TICKET" },
  
  // D-pad navigation
  "GP:DPAD_UP": { type: "NAV", action: "PREV" },
  "GP:DPAD_DOWN": { type: "NAV", action: "NEXT" },
  "GP:DPAD_LEFT": { type: "NAV", action: "BACK" },
  "GP:DPAD_RIGHT": { type: "NAV", action: "ACTIVATE" },
  
  // Shoulder buttons
  "GP:LB": { type: "FOCUS", target: "POSITIONS" },
  "GP:RB": { type: "FOCUS", target: "CHART" },
  "GP:LT": { type: "ALERT", action: "MUTE" },
  "GP:RT": { type: "ORDER", action: "SUBMIT" },
  
  // Special buttons
  "GP:START": { type: "ORDER", action: "FLATTEN" },
  "GP:SELECT": { type: "ACCESSIBILITY", action: "TOGGLE_PANEL" },
  "GP:HOME": { type: "NAV", action: "HOME" },
};

// Switch scanning profile - for users with limited mobility
export const PROFILE_SWITCH_SCANNING: MappingProfile = {
  "SWITCH:NEXT": { type: "NAV", action: "NEXT" },
  "SWITCH:SELECT": { type: "NAV", action: "ACTIVATE" },
  "SWITCH:BACK": { type: "NAV", action: "BACK" },
  "SWITCH:HOME": { type: "NAV", action: "HOME" },
};

// Sip-and-puff profile
export const PROFILE_SIP_PUFF: MappingProfile = {
  "SIP:SOFT": { type: "NAV", action: "NEXT" },
  "SIP:HARD": { type: "NAV", action: "ACTIVATE" },
  "PUFF:SOFT": { type: "NAV", action: "PREV" },
  "PUFF:HARD": { type: "NAV", action: "BACK" },
};

// Eye tracker profile
export const PROFILE_EYE_TRACKER: MappingProfile = {
  "EYE:DWELL": { type: "NAV", action: "ACTIVATE" },
  "EYE:BLINK": { type: "NAV", action: "NEXT" },
  "EYE:DOUBLE_BLINK": { type: "NAV", action: "BACK" },
  "EYE:LONG_BLINK": { type: "ACCESSIBILITY", action: "TOGGLE_PANEL" },
};

export type ProfileName = 
  | "trader" 
  | "screenreader" 
  | "controller" 
  | "switch" 
  | "sip-puff" 
  | "eye-tracker";

export function getProfile(name: ProfileName): MappingProfile {
  switch (name) {
    case "trader": return PROFILE_TRADER_KEYBOARD;
    case "screenreader": return PROFILE_SCREENREADER_SAFE;
    case "controller": return PROFILE_CONTROLLER_DEFAULT;
    case "switch": return PROFILE_SWITCH_SCANNING;
    case "sip-puff": return PROFILE_SIP_PUFF;
    case "eye-tracker": return PROFILE_EYE_TRACKER;
    default: return PROFILE_TRADER_KEYBOARD;
  }
}
