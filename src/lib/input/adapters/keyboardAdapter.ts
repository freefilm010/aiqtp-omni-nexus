import { InputHub } from "../ial";

function buildCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push("Meta");
  
  // Use e.code for layout stability across keyboard layouts
  const key = e.code === "Space" ? "Space" : e.code;
  parts.push(key);
  
  return parts.join("+");
}

export interface KeyboardAdapterOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  allowedInInputs?: boolean;
}

export function attachKeyboardAdapter(
  hub: InputHub, 
  opts: KeyboardAdapterOptions = {}
): () => void {
  const { enabled = true, preventDefault = false, allowedInInputs = false } = opts;
  
  if (!enabled) return () => {};
  
  const onKeyDown = (e: KeyboardEvent) => {
    // Skip if focus is in an input field (unless explicitly allowed)
    if (!allowedInInputs) {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
        return;
      }
    }
    
    const code = buildCombo(e);
    const profile = hub.getProfile();
    
    // Only prevent default if this key combo is mapped
    if (profile[code] && preventDefault) {
      e.preventDefault();
    }
    
    hub.emit({ 
      source: "keyboard", 
      code, 
      timestamp: Date.now() 
    });
  };
  
  window.addEventListener("keydown", onKeyDown);
  
  return () => {
    window.removeEventListener("keydown", onKeyDown);
  };
}
