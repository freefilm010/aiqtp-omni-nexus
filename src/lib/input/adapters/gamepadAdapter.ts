import { InputHub } from "../ial";

type ButtonState = Record<string, boolean>;

const BUTTON_MAP: Record<number, string> = {
  0: "GP:BTN_A",
  1: "GP:BTN_B", 
  2: "GP:BTN_X",
  3: "GP:BTN_Y",
  4: "GP:LB",
  5: "GP:RB",
  6: "GP:LT",
  7: "GP:RT",
  8: "GP:SELECT",
  9: "GP:START",
  10: "GP:L3",
  11: "GP:R3",
  12: "GP:DPAD_UP",
  13: "GP:DPAD_DOWN",
  14: "GP:DPAD_LEFT",
  15: "GP:DPAD_RIGHT",
  16: "GP:HOME",
};

function readGamepad(index: number): Gamepad | null {
  const gamepads = navigator.getGamepads?.() ?? [];
  return gamepads[index] ?? null;
}

function mapButtons(gp: Gamepad): ButtonState {
  const state: ButtonState = {};
  gp.buttons.forEach((button, index) => {
    const code = BUTTON_MAP[index];
    if (code) {
      state[code] = button.pressed;
    }
  });
  return state;
}

export interface GamepadAdapterOptions {
  enabled?: boolean;
  pollMs?: number;
  gamepadIndex?: number;
  deadzone?: number;
}

export function attachGamepadAdapter(
  hub: InputHub, 
  opts: GamepadAdapterOptions = {}
): () => void {
  const { 
    enabled = true, 
    pollMs = 33, 
    gamepadIndex = 0,
    deadzone = 0.15 
  } = opts;
  
  if (!enabled) return () => {};
  
  let previousState: ButtonState = {};
  let alive = true;
  
  const tick = () => {
    if (!alive) return;
    
    const gp = readGamepad(gamepadIndex);
    if (gp) {
      const currentState = mapButtons(gp);
      
      // Detect button presses (transition from not pressed to pressed)
      for (const code of Object.keys(currentState)) {
        if (currentState[code] && !previousState[code]) {
          hub.emit({ 
            source: "gamepad", 
            code, 
            value: 1,
            timestamp: Date.now() 
          });
        }
      }
      
      // Handle analog stick as navigation (optional)
      const [leftX, leftY] = [gp.axes[0] ?? 0, gp.axes[1] ?? 0];
      if (Math.abs(leftY) > deadzone) {
        if (leftY < -deadzone && !(previousState["GP:ANALOG_UP"])) {
          hub.emit({ source: "gamepad", code: "GP:ANALOG_UP", value: Math.abs(leftY), timestamp: Date.now() });
          currentState["GP:ANALOG_UP"] = true;
        } else if (leftY > deadzone && !(previousState["GP:ANALOG_DOWN"])) {
          hub.emit({ source: "gamepad", code: "GP:ANALOG_DOWN", value: Math.abs(leftY), timestamp: Date.now() });
          currentState["GP:ANALOG_DOWN"] = true;
        }
      } else {
        currentState["GP:ANALOG_UP"] = false;
        currentState["GP:ANALOG_DOWN"] = false;
      }
      
      previousState = currentState;
    }
    
    setTimeout(tick, pollMs);
  };
  
  // Start polling
  tick();
  
  // Listen for gamepad connection
  const onConnect = (e: GamepadEvent) => {
    if (import.meta.env.DEV) console.log(`Gamepad connected: ${e.gamepad.id}`);
  };
  
  const onDisconnect = (e: GamepadEvent) => {
    if (import.meta.env.DEV) console.log(`Gamepad disconnected: ${e.gamepad.id}`);
    previousState = {};
  };
  
  window.addEventListener("gamepadconnected", onConnect);
  window.addEventListener("gamepaddisconnected", onDisconnect);
  
  return () => {
    alive = false;
    window.removeEventListener("gamepadconnected", onConnect);
    window.removeEventListener("gamepaddisconnected", onDisconnect);
  };
}

export function getConnectedGamepads(): Gamepad[] {
  const gamepads = navigator.getGamepads?.() ?? [];
  return Array.from(gamepads).filter((gp): gp is Gamepad => gp !== null);
}
