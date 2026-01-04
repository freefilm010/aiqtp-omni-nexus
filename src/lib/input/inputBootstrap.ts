import { InputHub, getInputHub } from "./ial";
import { ProfileName, getProfile } from "./profiles";
import { attachKeyboardAdapter } from "./adapters/keyboardAdapter";
import { attachGamepadAdapter } from "./adapters/gamepadAdapter";
import { WebHIDAdapter } from "./adapters/webhidAdapter";
import { WebMIDIAdapter } from "./adapters/webmidiAdapter";
import { SwitchScanningAdapter, SwitchScanningOptions } from "./adapters/switchScanningAdapter";

export interface InputSystemOptions {
  profile?: ProfileName;
  enableKeyboard?: boolean;
  enableGamepad?: boolean;
  enableSwitchScanning?: boolean;
  switchScanningOptions?: SwitchScanningOptions;
}

export interface InputSystem {
  hub: InputHub;
  detachKeyboard: () => void;
  detachGamepad: () => void;
  hid: WebHIDAdapter;
  midi: WebMIDIAdapter;
  switchScanning: SwitchScanningAdapter;
  setProfile: (name: ProfileName) => void;
  destroy: () => void;
}

/**
 * Bootstrap the complete input system with all adapters
 */
export function createInputSystem(options: InputSystemOptions = {}): InputSystem {
  const {
    profile = "trader",
    enableKeyboard = true,
    enableGamepad = true,
    enableSwitchScanning = false,
    switchScanningOptions = {}
  } = options;
  
  // Get or create the hub with the specified profile
  const hub = getInputHub(getProfile(profile));
  
  // Attach keyboard adapter
  const detachKeyboard = attachKeyboardAdapter(hub, { 
    enabled: enableKeyboard,
    preventDefault: false 
  });
  
  // Attach gamepad adapter
  const detachGamepad = attachGamepadAdapter(hub, { 
    enabled: enableGamepad,
    pollMs: 33 
  });
  
  // Create WebHID adapter (user must explicitly request device)
  const hid = new WebHIDAdapter(hub);
  
  // Create WebMIDI adapter (user must explicitly start)
  const midi = new WebMIDIAdapter(hub);
  
  // Create switch scanning adapter
  const switchScanning = new SwitchScanningAdapter(hub, switchScanningOptions);
  if (enableSwitchScanning) {
    switchScanning.start();
  }
  
  // Profile switcher
  const setProfile = (name: ProfileName) => {
    hub.setProfile(getProfile(name));
  };
  
  // Cleanup function
  const destroy = () => {
    detachKeyboard();
    detachGamepad();
    hid.close();
    midi.stop();
    switchScanning.destroy();
  };
  
  return {
    hub,
    detachKeyboard,
    detachGamepad,
    hid,
    midi,
    switchScanning,
    setProfile,
    destroy
  };
}

// Hook for React components
export { getInputHub } from "./ial";
export type { CommandIntent, InputSource, DeviceEvent } from "./ial";
export type { ProfileName } from "./profiles";
