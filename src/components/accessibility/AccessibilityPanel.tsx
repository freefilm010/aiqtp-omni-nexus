import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import InputDevicesPanel from './InputDevicesPanel';
import {
  Volume2,
  Mic,
  Eye,
  Ear,
  Keyboard,
  Palette,
  Type,
  Zap,
  Hand,
  MonitorSpeaker,
  Languages,
  Accessibility,
  Moon,
  Sun,
  Gamepad2
} from 'lucide-react';

const AccessibilityPanel: React.FC = () => {
  const {
    settings,
    updateSettings,
    speak,
    stopSpeaking,
    isSpeaking,
    availableVoices
  } = useAccessibility();

  const testVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak("This is a test of the text to speech system. You can adjust the speed, pitch, and volume using the controls.");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-6 w-6" />
          Accessibility Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="voice" className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="hearing" className="flex items-center gap-1">
              <Ear className="h-4 w-4" />
              <span className="hidden sm:inline">Hearing</span>
            </TabsTrigger>
            <TabsTrigger value="keyboard" className="flex items-center gap-1">
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">Keyboard</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-1">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="braille" className="flex items-center gap-1">
              <Hand className="h-4 w-4" />
              <span className="hidden sm:inline">Braille</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="voice" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MonitorSpeaker className="h-5 w-5" />
                  Text-to-Speech
                </h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-enabled">Enable Text-to-Speech</Label>
                  <Switch
                    id="voice-enabled"
                    checked={settings.voiceEnabled}
                    onCheckedChange={(checked) => updateSettings({ voiceEnabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Voice Selection</Label>
                  <Select
                    value={settings.selectedVoice}
                    onValueChange={(value) => updateSettings({ selectedVoice: value })}
                    disabled={!settings.voiceEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Speech Speed: {settings.voiceSpeed.toFixed(1)}x</Label>
                  <Slider
                    value={[settings.voiceSpeed]}
                    onValueChange={([value]) => updateSettings({ voiceSpeed: value })}
                    min={0.5}
                    max={2}
                    step={0.1}
                    disabled={!settings.voiceEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pitch: {settings.voicePitch.toFixed(1)}</Label>
                  <Slider
                    value={[settings.voicePitch]}
                    onValueChange={([value]) => updateSettings({ voicePitch: value })}
                    min={0.5}
                    max={2}
                    step={0.1}
                    disabled={!settings.voiceEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Volume: {Math.round(settings.voiceVolume * 100)}%</Label>
                  <Slider
                    value={[settings.voiceVolume]}
                    onValueChange={([value]) => updateSettings({ voiceVolume: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={!settings.voiceEnabled}
                  />
                </div>

                <Button onClick={testVoice} disabled={!settings.voiceEnabled}>
                  {isSpeaking ? 'Stop' : 'Test Voice'}
                </Button>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice Commands
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the voice control button (microphone icon) in the toolbar to give voice commands.
                  Supported commands include navigation, reading content, and executing actions.
                </p>
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <strong>Example commands:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>"Read this page"</li>
                    <li>"Go to trading"</li>
                    <li>"Show portfolio"</li>
                    <li>"Open settings"</li>
                    <li>"What is my balance"</li>
                    <li>"Stop reading"</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="visual" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color & Contrast
                </h3>

                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <Switch
                    id="high-contrast"
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color Blind Mode</Label>
                  <Select
                    value={settings.colorBlindMode}
                    onValueChange={(value: any) => updateSettings({ colorBlindMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                      <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                      <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                      <SelectItem value="achromatopsia">Achromatopsia (Monochrome)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Text Size
                </h3>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select
                    value={settings.fontSize}
                    onValueChange={(value: any) => updateSettings({ fontSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (100%)</SelectItem>
                      <SelectItem value="large">Large (125%)</SelectItem>
                      <SelectItem value="extra-large">Extra Large (150%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Motion & Animation
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reduced-motion">Reduce Motion</Label>
                    <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    id="reduced-motion"
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Focus Indicators
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enhanced-focus">Enhanced Focus Indicators</Label>
                    <p className="text-sm text-muted-foreground">Larger, more visible focus outlines</p>
                  </div>
                  <Switch
                    id="enhanced-focus"
                    checked={settings.focusIndicatorEnhanced}
                    onCheckedChange={(checked) => updateSettings({ focusIndicatorEnhanced: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hearing" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Visual Alerts
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="visual-alerts">Visual Alerts for Audio</Label>
                    <p className="text-sm text-muted-foreground">Flash screen or show notifications for sounds</p>
                  </div>
                  <Switch
                    id="visual-alerts"
                    checked={settings.visualAlerts}
                    onCheckedChange={(checked) => updateSettings({ visualAlerts: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Captions & Transcripts
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="captions">Show Captions</Label>
                    <p className="text-sm text-muted-foreground">Display text captions for audio content</p>
                  </div>
                  <Switch
                    id="captions"
                    checked={settings.captionsEnabled}
                    onCheckedChange={(checked) => updateSettings({ captionsEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sign-language">Sign Language Mode</Label>
                    <p className="text-sm text-muted-foreground">Show sign language interpreter when available</p>
                  </div>
                  <Switch
                    id="sign-language"
                    checked={settings.signLanguageMode}
                    onCheckedChange={(checked) => updateSettings({ signLanguageMode: checked })}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Communication Preferences</h4>
                <p className="text-sm text-muted-foreground">
                  All notifications and alerts will be displayed visually. 
                  Real-time transcription is available for voice content.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="keyboard" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Keyboard Navigation
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="keyboard-nav">Keyboard Navigation Mode</Label>
                    <p className="text-sm text-muted-foreground">Optimize interface for keyboard-only navigation</p>
                  </div>
                  <Switch
                    id="keyboard-nav"
                    checked={settings.keyboardNavigationMode}
                    onCheckedChange={(checked) => updateSettings({ keyboardNavigationMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="screen-reader">Screen Reader Optimized</Label>
                    <p className="text-sm text-muted-foreground">Enhanced compatibility with screen readers</p>
                  </div>
                  <Switch
                    id="screen-reader"
                    checked={settings.screenReaderOptimized}
                    onCheckedChange={(checked) => updateSettings({ screenReaderOptimized: checked })}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><kbd className="px-2 py-1 bg-background rounded">Tab</kbd> Navigate forward</div>
                  <div><kbd className="px-2 py-1 bg-background rounded">Shift+Tab</kbd> Navigate back</div>
                  <div><kbd className="px-2 py-1 bg-background rounded">Enter</kbd> Activate element</div>
                  <div><kbd className="px-2 py-1 bg-background rounded">Escape</kbd> Close/Cancel</div>
                  <div><kbd className="px-2 py-1 bg-background rounded">Space</kbd> Toggle/Select</div>
                  <div><kbd className="px-2 py-1 bg-background rounded">Arrow Keys</kbd> Navigate lists</div>
                  <div><kbd className="px-2 py-1 bg-background rounded">Alt+A</kbd> Accessibility panel</div>
                  <div><kbd className="px-2 py-1 bg-background rounded">Alt+R</kbd> Read page</div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Compatible Assistive Devices</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• JAWS Screen Reader</li>
                  <li>• NVDA Screen Reader</li>
                  <li>• VoiceOver (macOS/iOS)</li>
                  <li>• TalkBack (Android)</li>
                  <li>• Dragon NaturallySpeaking</li>
                  <li>• Switch Access devices</li>
                  <li>• Sip-and-puff devices</li>
                  <li>• Eye tracking systems</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-6">
              <InputDevicesPanel />
            </TabsContent>

            <TabsContent value="braille" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Hand className="h-5 w-5" />
                  Braille Display Support
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="braille-mode">Braille Display Mode</Label>
                    <p className="text-sm text-muted-foreground">Optimize output for refreshable braille displays</p>
                  </div>
                  <Switch
                    id="braille-mode"
                    checked={settings.brailleDisplayMode}
                    onCheckedChange={(checked) => updateSettings({ brailleDisplayMode: checked })}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Supported Braille Displays</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Humanware Brailliant Series</li>
                  <li>• Freedom Scientific Focus Series</li>
                  <li>• HIMS Braille Displays</li>
                  <li>• Orbit Reader</li>
                  <li>• APH Refreshabraille</li>
                  <li>• Baum VarioUltra</li>
                </ul>
                <p className="mt-2 text-sm">
                  Connect your braille display via USB or Bluetooth and use with your preferred screen reader.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Braille Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Contracted and uncontracted braille support</li>
                  <li>• Real-time price updates in braille</li>
                  <li>• Tactile navigation through tables and charts</li>
                  <li>• Audio descriptions of visual data</li>
                </ul>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AccessibilityPanel;
