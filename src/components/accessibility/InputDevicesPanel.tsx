import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Keyboard, 
  Gamepad2, 
  Usb, 
  Music, 
  MousePointer2,
  Scan,
  Eye,
  Settings,
  Check,
  X
} from 'lucide-react';
import { useInputSystem } from '@/hooks/useInputSystem';
import { ProfileName } from '@/lib/input/inputBootstrap';
import { getConnectedGamepads } from '@/lib/input/adapters/gamepadAdapter';

const InputDevicesPanel: React.FC = () => {
  const {
    system,
    setProfile,
    startSwitchScanning,
    stopSwitchScanning,
    connectHID,
    startMIDI,
    isHIDSupported,
    isMIDISupported
  } = useInputSystem();
  
  const [activeProfile, setActiveProfile] = useState<ProfileName>('trader');
  const [switchScanningEnabled, setSwitchScanningEnabled] = useState(false);
  const [scanInterval, setScanInterval] = useState(1500);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  
  const handleProfileChange = (profile: ProfileName) => {
    setActiveProfile(profile);
    setProfile(profile);
  };
  
  const handleSwitchScanningToggle = (enabled: boolean) => {
    setSwitchScanningEnabled(enabled);
    if (enabled) {
      startSwitchScanning();
    } else {
      stopSwitchScanning();
    }
  };
  
  const handleConnectHID = async () => {
    const device = await connectHID();
    if (device) {
      setConnectedDevices(prev => [...prev, device.productName ?? 'HID Device']);
    }
  };
  
  const handleStartMIDI = async () => {
    await startMIDI();
    const devices = system?.midi.getDevices();
    if (devices?.inputs.length) {
      setConnectedDevices(prev => [...prev, ...devices.inputs.map(d => d.name ?? 'MIDI Device')]);
    }
  };
  
  const gamepads = getConnectedGamepads();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Input Devices & Profiles
        </CardTitle>
        <CardDescription>
          Configure accessibility input devices and keyboard profiles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="scanning">Switch Scan</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profiles" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Input Profile</Label>
              <Select value={activeProfile} onValueChange={(v) => handleProfileChange(v as ProfileName)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trader">
                    <div className="flex items-center gap-2">
                      <Keyboard className="h-4 w-4" />
                      Trader (Vim-style)
                    </div>
                  </SelectItem>
                  <SelectItem value="screenreader">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Screen Reader Safe
                    </div>
                  </SelectItem>
                  <SelectItem value="controller">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      Gamepad/Controller
                    </div>
                  </SelectItem>
                  <SelectItem value="switch">
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4" />
                      Switch Scanning
                    </div>
                  </SelectItem>
                  <SelectItem value="sip-puff">
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="h-4 w-4" />
                      Sip & Puff
                    </div>
                  </SelectItem>
                  <SelectItem value="eye-tracker">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Eye Tracker
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Current Profile Shortcuts:</p>
                {activeProfile === 'trader' && (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>J/K - Navigate next/previous</li>
                    <li>Enter - Activate</li>
                    <li>1-5 - Focus areas</li>
                    <li>O - Open order ticket</li>
                    <li>Alt+A - Accessibility panel</li>
                  </ul>
                )}
                {activeProfile === 'screenreader' && (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>Enter - Activate</li>
                    <li>Escape - Go back</li>
                    <li>Alt+Shift+1-5 - Focus areas</li>
                    <li>Ctrl+Shift+O - Order ticket</li>
                  </ul>
                )}
                {activeProfile === 'controller' && (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>A - Activate</li>
                    <li>B - Back</li>
                    <li>D-pad - Navigate</li>
                    <li>Y - Open order</li>
                    <li>Start - Flatten positions</li>
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="devices" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Gamepads */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Gamepad/Controller</p>
                    <p className="text-sm text-muted-foreground">
                      {gamepads.length > 0 ? `${gamepads.length} connected` : 'Connect a gamepad'}
                    </p>
                  </div>
                </div>
                <Badge variant={gamepads.length > 0 ? "default" : "secondary"}>
                  {gamepads.length > 0 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </Badge>
              </div>
              
              {/* WebHID */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Usb className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Specialized USB Device</p>
                    <p className="text-sm text-muted-foreground">
                      Braille displays, switch interfaces
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleConnectHID}
                  disabled={!isHIDSupported}
                >
                  {isHIDSupported ? 'Connect' : 'Not Supported'}
                </Button>
              </div>
              
              {/* WebMIDI */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5" />
                  <div>
                    <p className="font-medium">MIDI Controller</p>
                    <p className="text-sm text-muted-foreground">
                      Use MIDI devices for macros
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleStartMIDI}
                  disabled={!isMIDISupported}
                >
                  {isMIDISupported ? 'Enable' : 'Not Supported'}
                </Button>
              </div>
              
              {/* Connected devices list */}
              {connectedDevices.length > 0 && (
                <div className="mt-4">
                  <Label className="mb-2 block">Connected Devices</Label>
                  <div className="space-y-2">
                    {connectedDevices.map((device, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{device}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="scanning" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Switch Scanning</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-scan through interactive elements
                  </p>
                </div>
                <Switch
                  checked={switchScanningEnabled}
                  onCheckedChange={handleSwitchScanningToggle}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Scan Interval: {scanInterval}ms</Label>
                <Slider
                  value={[scanInterval]}
                  onValueChange={([v]) => {
                    setScanInterval(v);
                    system?.switchScanning.setScanInterval(v);
                  }}
                  min={500}
                  max={5000}
                  step={100}
                />
                <p className="text-xs text-muted-foreground">
                  Time between automatic focus changes
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Scan Mode</Label>
                <Select 
                  defaultValue="auto"
                  onValueChange={(v) => system?.switchScanning.setMode(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto Scan</SelectItem>
                    <SelectItem value="manual">Manual Advance</SelectItem>
                    <SelectItem value="step">Step Scan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Switch Controls:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Space - Next element / Select (auto mode)</li>
                  <li>Enter - Select/Activate</li>
                  <li>Escape - Exit scanning mode</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Audio Feedback</Label>
                  <p className="text-sm text-muted-foreground">
                    Play tones during navigation
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Visual Highlight</Label>
                  <p className="text-sm text-muted-foreground">
                    Show focus indicator during scanning
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Wrap Navigation</Label>
                  <p className="text-sm text-muted-foreground">
                    Loop back to start after last element
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                <p className="font-medium text-yellow-600 mb-1">Browser Support</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>WebHID: {isHIDSupported ? '✓ Supported' : '✗ Chrome/Edge only'}</li>
                  <li>WebMIDI: {isMIDISupported ? '✓ Supported' : '✗ Chrome/Edge only'}</li>
                  <li>Gamepad API: ✓ All modern browsers</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InputDevicesPanel;
