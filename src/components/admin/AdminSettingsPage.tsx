import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings, RefreshCw, Save, Globe, Shield, Bell, Palette, Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProjectExport from "./ProjectExport";

interface SettingItem {
  id: string;
  key: string;
  value: any;
  category: string;
  updated_at: string;
}

const defaultSettings = [
  { key: "platform_name", category: "general", defaultValue: "AIQTP", label: "Platform Name" },
  { key: "primary_domain", category: "general", defaultValue: "www.aiqtp.com", label: "Primary Domain" },
  { key: "support_email", category: "general", defaultValue: "aiqtpinfo@gmail.com", label: "Support Email" },
  { key: "maintenance_mode", category: "general", defaultValue: false, label: "Maintenance Mode" },
  { key: "max_api_rate", category: "security", defaultValue: 100, label: "Max API Rate (req/min)" },
  { key: "require_2fa_admin", category: "security", defaultValue: true, label: "Require 2FA for Admins" },
  { key: "session_timeout_min", category: "security", defaultValue: 60, label: "Session Timeout (min)" },
  { key: "enable_email_notifications", category: "notifications", defaultValue: true, label: "Email Notifications" },
  { key: "enable_push_notifications", category: "notifications", defaultValue: false, label: "Push Notifications" },
  { key: "alert_on_security_events", category: "notifications", defaultValue: true, label: "Security Event Alerts" },
  { key: "default_theme", category: "appearance", defaultValue: "dark", label: "Default Theme" },
  { key: "show_beta_features", category: "appearance", defaultValue: true, label: "Show Beta Features" },
];

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*");

      if (error) throw error;

      const map: Record<string, any> = {};
      defaultSettings.forEach((s) => {
        map[s.key] = s.defaultValue;
      });
      (data || []).forEach((s: SettingItem) => {
        map[s.key] = s.value;
      });
      setSettings(map);
    } catch (err) {
      console.error(err);
      // Use defaults
      const map: Record<string, any> = {};
      defaultSettings.forEach((s) => {
        map[s.key] = s.defaultValue;
      });
      setSettings(map);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const def = defaultSettings.find((d) => d.key === key);
        if (!def) continue;
        await supabase.from("admin_settings").upsert(
          { key, value: JSON.stringify(value), category: def.category, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      }
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const renderSetting = (s: typeof defaultSettings[0]) => {
    const value = settings[s.key] ?? s.defaultValue;
    const isBoolean = typeof s.defaultValue === "boolean";
    const isNumber = typeof s.defaultValue === "number";

    return (
      <div key={s.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div>
          <p className="font-medium text-sm">{s.label}</p>
          <p className="text-xs text-muted-foreground font-mono">{s.key}</p>
        </div>
        {isBoolean ? (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(v) => updateSetting(s.key, v)}
          />
        ) : isNumber ? (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateSetting(s.key, Number(e.target.value))}
            className="w-24 text-right"
          />
        ) : (
          <Input
            value={String(value)}
            onChange={(e) => updateSetting(s.key, e.target.value)}
            className="w-64"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = [
    { id: "general", label: "General", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            Platform Settings
          </h1>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="general">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 pt-2">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="px-6 py-4">
                {defaultSettings
                  .filter((s) => s.category === cat.id)
                  .map(renderSetting)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4" /> System Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Domain</p>
              <p className="font-medium">www.aiqtp.com</p>
            </div>
            <div>
              <p className="text-muted-foreground">Platform</p>
              <p className="font-medium">Lovable Cloud</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stack</p>
              <p className="font-medium">React + TypeScript</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant="outline" className="text-green-500 border-green-500">Operational</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectExport />
    </div>
  );
};

export default AdminSettingsPage;
