import { InputHub } from "../ial";

/**
 * WebHID Adapter for specialized accessibility devices
 * - Braille displays
 * - Specialized keyboards
 * - Switch interfaces
 * - Custom accessibility controllers
 * 
 * Note: WebHID requires HTTPS and user gesture for device request
 * Currently Chromium-only
 */

// Type definitions for WebHID API (not in standard TypeScript lib)
interface HIDDeviceInfo {
  vendorId: number;
  productId: number;
  productName: string;
  opened: boolean;
  collections: any[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: ArrayBuffer): Promise<void>;
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDInputReportEventData extends Event {
  device: HIDDeviceInfo;
  reportId: number;
  data: DataView;
}

declare global {
  interface Navigator {
    hid?: {
      requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDeviceInfo[]>;
      getDevices(): Promise<HIDDeviceInfo[]>;
    };
  }
}

export interface WebHIDAdapterOptions {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

export class WebHIDAdapter {
  private hub: InputHub;
  private device: HIDDeviceInfo | null = null;
  private connected = false;
  
  constructor(hub: InputHub) {
    this.hub = hub;
  }
  
  isSupported(): boolean {
    return typeof navigator !== "undefined" && "hid" in navigator;
  }
  
  isConnected(): boolean {
    return this.connected && this.device !== null;
  }
  
  async requestDevice(filters?: HIDDeviceFilter[]): Promise<HIDDeviceInfo | null> {
    if (!this.isSupported()) {
      throw new Error("WebHID is not supported in this browser");
    }
    
    try {
      const devices = await navigator.hid.requestDevice({ 
        filters: filters ?? [] 
      });
      
      if (!devices?.length) {
        console.log("No HID device selected");
        return null;
      }
      
      this.device = devices[0];
      await this.device.open();
      this.connected = true;
      
      // Set up input report handler
      this.device.addEventListener("inputreport", this.handleInputReport.bind(this));
      
      console.log(`Connected to HID device: ${this.device.productName}`);
      return this.device;
    } catch (error) {
      console.error("Failed to connect to HID device:", error);
      throw error;
    }
  }
  
  private handleInputReport(event: HIDInputReportEventData) {
    const { data, reportId } = event;
    const bytes: number[] = [];
    
    for (let i = 0; i < data.byteLength; i++) {
      bytes.push(data.getUint8(i));
    }
    
    // Build a unique code for this input
    const vendorId = this.device?.vendorId ?? 0;
    const productId = this.device?.productId ?? 0;
    const code = `HID:${vendorId}:${productId}:R${reportId}:${bytes.join(",")}`;
    
    this.hub.emit({
      source: "webhid",
      code,
      value: bytes[0],
      timestamp: Date.now()
    });
  }
  
  async sendOutput(reportId: number, data: Uint8Array): Promise<void> {
    if (!this.device?.opened) {
      throw new Error("Device not connected");
    }
    
    await this.device.sendReport(reportId, data.buffer as ArrayBuffer);
  }
  
  async close(): Promise<void> {
    if (this.device?.opened) {
      await this.device.close();
    }
    this.device = null;
    this.connected = false;
  }
  
  getDeviceInfo() {
    if (!this.device) return null;
    
    return {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      productName: this.device.productName,
      opened: this.device.opened,
      collections: this.device.collections
    };
  }
}

// Common HID device filters
export const HID_FILTERS = {
  brailleDisplay: [
    { usagePage: 0x41 }, // Braille display usage page
  ],
  keyboard: [
    { usagePage: 0x01, usage: 0x06 }, // Generic Desktop, Keyboard
  ],
  switchInterface: [
    { usagePage: 0x01, usage: 0x04 }, // Generic Desktop, Joystick (often used for switches)
  ],
};
