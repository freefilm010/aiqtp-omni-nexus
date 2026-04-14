import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Save, Trophy, Flame, Link2, Twitter, Github, Globe, Upload } from "lucide-react";

interface Profile {
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  social_links: { twitter?: string; github?: string; website?: string };
  display_badge: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    username: "", full_name: "", avatar_url: "", bio: "",
    social_links: {}, display_badge: "",
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ claims: 0, streak: 0, strategies: 0, achievements: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single() as any;
      if (data) {
        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
          social_links: (typeof data.social_links === 'object' && data.social_links) || {},
          display_badge: data.display_badge || "",
        });
      }

      const [claimsRes, strategiesRes, achievementsRes] = await Promise.all([
        supabase.from("faucet_claims").select("id", { count: "exact", head: true }).eq("user_id", user.id) as any,
        supabase.from("ai_strategies").select("id", { count: "exact", head: true }).eq("user_id", user.id) as any,
        supabase.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", user.id) as any,
      ]);

      const claims = claimsRes.count || 0;
      const { data: claimDates } = await supabase.from("faucet_claims").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(365) as any;
      const days = new Set((claimDates || []).map((c: any) => new Date(c.created_at).toDateString()));
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        if (days.has(d.toDateString())) streak++; else break;
      }

      setStats({
        claims,
        streak,
        strategies: strategiesRes.count || 0,
        achievements: achievementsRes.count || 0,
      });
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: profile.username || null,
      full_name: profile.full_name || null,
      avatar_url: profile.avatar_url || null,
      bio: profile.bio || "",
      social_links: profile.social_links,
      display_badge: profile.display_badge || "",
    } as any).eq("id", user.id) as any;

    if (error) toast.error("Save failed: " + error.message);
    else toast.success("Profile saved!");
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { toast.error("Avatar must be under 2MB"); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    toast.success("Avatar uploaded!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <h1 className="text-xl sm:text-3xl font-bold mb-6">My Profile</h1>

        <div className="space-y-6">
          {/* Avatar & Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg">{(profile.username || profile.full_name || "?")[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="h-5 w-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label>Username (public)</Label>
                    <Input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} placeholder="TokenMac1" />
                  </div>
                </div>
              </div>
              <div>
                <Label>Full Name</Label>
                <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the community about yourself..." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Link2 className="h-5 w-5 text-primary" /> Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <Input value={profile.social_links.twitter || ""} onChange={e => setProfile(p => ({ ...p, social_links: { ...p.social_links, twitter: e.target.value } }))} placeholder="@handle" />
              </div>
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <Input value={profile.social_links.github || ""} onChange={e => setProfile(p => ({ ...p, social_links: { ...p.social_links, github: e.target.value } }))} placeholder="github.com/username" />
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input value={profile.social_links.website || ""} onChange={e => setProfile(p => ({ ...p, social_links: { ...p.social_links, website: e.target.value } }))} placeholder="https://yoursite.com" />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Trophy className="h-5 w-5 text-amber-500" /> Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Claims", value: stats.claims, icon: "🎯" },
                  { label: "Day Streak", value: stats.streak, icon: "🔥" },
                  { label: "Strategies", value: stats.strategies, icon: "📊" },
                  { label: "Achievements", value: stats.achievements, icon: "🏆" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className="font-bold text-lg">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
