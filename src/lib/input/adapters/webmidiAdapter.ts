import { InputHub } from "../ial";

/**
 * WebMIDI Adapter
 * Enables MIDI controllers as accessibility/trading macro devices
 * Great for users who have MIDI equipment or custom button boxes
 */

export class WebMIDIAdapter {
  private hub: InputHub;
  private access: MIDIAccess | null = null;
  private connected = false;
  
  constructor(hub: InputHub) {
    this.hub = hub;
  }
  
  isSupported(): boolean {
    return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
  }
  
  isConnected(): boolean {
    return this.connected && this.access !== null;
  }
  
  async start(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("WebMIDI is not supported in this browser");
    }
    
    try {
      this.access = await navigator.requestMIDIAccess();
      this.connected = true;
      
      // Set up handlers for all inputs
      for (const input of this.access.inputs.values()) {
        this.attachInputHandler(input);
      }
      
      // Listen for new devices
      this.access.onstatechange = (event) => {
        const port = event.port;
        if (port.type === "input") {
          if (port.state === "connected") {
            this.attachInputHandler(port as MIDIInput);
          }
        }
      };
      
      if (import.meta.env.DEV) console.log(`WebMIDI connected with ${this.access.inputs.size} input(s)`);
    } catch (error) {
      console.error("Failed to start WebMIDI:", error);
      throw error;
    }
  }
  
  private attachInputHandler(input: MIDIInput) {
    input.onmidimessage = (msg) => {
      const data = Array.from(msg.data ?? []);
      
      // Parse MIDI message
      const status = data[0] ?? 0;
      const channel = status & 0x0F;
      const type = status >> 4;
      
      let code = `MIDI:${data.join(",")}`;
      
      // Provide more semantic codes for common message types
      if (type === 0x09) { // Note On
        const note = data[1];
        const velocity = data[2];
        if (velocity > 0) {
          code = `MIDI:NOTE_ON:${note}:${velocity}`;
        } else {
          code = `MIDI:NOTE_OFF:${note}`;
        }
      } else if (type === 0x08) { // Note Off
        code = `MIDI:NOTE_OFF:${data[1]}`;
      } else if (type === 0x0B) { // Control Change
        code = `MIDI:CC:${data[1]}:${data[2]}`;
      } else if (type === 0x0E) { // Pitch Bend
        code = `MIDI:PITCH:${data[1] | (data[2] << 7)}`;
      }
      
      this.hub.emit({
        source: "webmidi",
        code,
        value: data[2] ?? data[1] ?? 0,
        timestamp: Date.now()
      });
    };
  }
  
  stop(): void {
    if (!this.access) return;
    
    for (const input of this.access.inputs.values()) {
      input.onmidimessage = null;
    }
    
    this.access.onstatechange = null;
    this.access = null;
    this.connected = false;
  }
  
  getDevices() {
    if (!this.access) return { inputs: [], outputs: [] };
    
    const inputs = Array.from(this.access.inputs.values()).map(input => ({
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
      state: input.state
    }));
    
    const outputs = Array.from(this.access.outputs.values()).map(output => ({
      id: output.id,
      name: output.name,
      manufacturer: output.manufacturer,
      state: output.state
    }));
    
    return { inputs, outputs };
  }
}

// MIDI note to command mapping helper
export function createMidiNoteProfile(mappings: Record<number, string>): Record<string, any> {
  const profile: Record<string, any> = {};
  for (const [note, intentCode] of Object.entries(mappings)) {
    profile[`MIDI:NOTE_ON:${note}`] = intentCode;
  }
  return profile;
}
