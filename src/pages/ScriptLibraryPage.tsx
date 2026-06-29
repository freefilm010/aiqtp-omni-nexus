import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Code2, Upload, Heart, Download, Search, Sparkles, Terminal, FileCode2, ExternalLink } from "lucide-react";

type Language = "pinescript" | "thinkscript" | "freqtrade" | "mql4" | "mql5" | "easylanguage" | "python" | "other";
type Category = "indicator" | "strategy" | "study" | "screener" | "scanner" | "library" | "utility";

interface SharedScript {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  language: Language;
  category: Category;
  code: string;
  tags: string[];
  asset_class: string | null;
  timeframe: string | null;
  source_url: string | null;
  license: string | null;
  version: string | null;
  downloads: number;
  likes: number;
  rating: number;
  is_featured: boolean;
  created_at: string;
}

const LANG_LABEL: Record<Language, string> = {
  pinescript: "PineScript v5",
  thinkscript: "ThinkScript (ToS)",
  freqtrade: "Freqtrade (Python)",
  mql4: "MQL4",
  mql5: "MQL5",
  easylanguage: "EasyLanguage",
  python: "Python",
  other: "Other",
};

const LANG_COLOR: Record<Language, string> = {
  pinescript: "text-[hsl(162_91%_45%)] border-[hsl(162_91%_32%)]",
  thinkscript: "text-[hsl(43_96%_56%)] border-[hsl(43_96%_45%)]",
  freqtrade: "text-[hsl(224_100%_70%)] border-[hsl(224_100%_58%)]",
  mql4: "text-[hsl(280_80%_70%)] border-[hsl(280_80%_55%)]",
  mql5: "text-[hsl(290_80%_70%)] border-[hsl(290_80%_55%)]",
  easylanguage: "text-[hsl(20_90%_65%)] border-[hsl(20_90%_50%)]",
  python: "text-[hsl(195_90%_60%)] border-[hsl(195_90%_45%)]",
  other: "text-muted-foreground border-border",
};

const ScriptLibraryPage = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<SharedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState<Language | "all">("all");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [viewScript, setViewScript] = useState<SharedScript | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload form
  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "pinescript" as Language,
    category: "indicator" as Category,
    code: "",
    tags: "",
    asset_class: "",
    timeframe: "",
    source_url: "",
  });

  const loadScripts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shared_scripts")
      .select("*")
      .eq("visibility", "public")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Failed to load scripts");
    } else {
      setScripts((data ?? []) as SharedScript[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadScripts(); }, []);

  const filtered = useMemo(() => {
    return scripts.filter(s => {
      if (langFilter !== "all" && s.language !== langFilter) return false;
      if (catFilter !== "all" && s.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.title.toLowerCase().includes(q)
          || (s.description ?? "").toLowerCase().includes(q)
          || s.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [scripts, search, langFilter, catFilter]);

  const handleUpload = async () => {
    if (!user) { toast.error("Sign in to share scripts"); return; }
    if (!form.title.trim() || !form.code.trim()) { toast.error("Title and code required"); return; }
    if (form.code.length > 200_000) { toast.error("Code too large (200KB max)"); return; }

    const { error } = await supabase.from("shared_scripts").insert({
      user_id: user.id,
      title: form.title.trim().slice(0, 200),
      description: form.description.trim().slice(0, 2000) || null,
      language: form.language,
      category: form.category,
      code: form.code,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 10),
      asset_class: form.asset_class.trim() || null,
      timeframe: form.timeframe.trim() || null,
      source_url: form.source_url.trim() || null,
    });

    if (error) { toast.error(error.message); return; }
    toast.success("Script published");
    setUploadOpen(false);
    setForm({ ...form, title: "", description: "", code: "", tags: "", asset_class: "", timeframe: "", source_url: "" });
    loadScripts();
  };

  const handleLike = async (id: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    const { error } = await supabase.from("shared_script_likes").insert({ script_id: id, user_id: user.id });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    setScripts(prev => prev.map(s => s.id === id ? { ...s, likes: s.likes + 1 } : s));
  };

  const handleCopy = async (s: SharedScript) => {
    await navigator.clipboard.writeText(s.code);
    await supabase.from("shared_scripts").update({ downloads: s.downloads + 1 }).eq("id", s.id);
    setScripts(prev => prev.map(x => x.id === s.id ? { ...x, downloads: x.downloads + 1 } : x));
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background hacker-grid">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero */}
        <div className="mb-8 border border-primary/30 bg-card/60 backdrop-blur p-6 rounded-lg hacker-scanline relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-accent mb-2">
                <Terminal className="w-3 h-3" />
                <span className="hacker-blink">●</span>
                <span>{"//"} aiqtp://script-library</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
                <span className="text-foreground">Community </span>
                <span className="text-accent hacker-glow">Script Library</span>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Share and discover <span className="text-accent">PineScript</span>, <span className="text-gold">ThinkScript</span>,{" "}
                <span className="text-primary">Freqtrade</span>, MQL4/5, EasyLanguage & Python strategies, indicators, screeners, and studies — built by traders, for traders.
              </p>
            </div>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="font-mono gap-2">
                  <Upload className="w-4 h-4" /> Publish Script
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-mono flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-accent" /> Publish a Script
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Title (e.g. SuperTrend Pro v2)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={200} />
                  <Textarea placeholder="Description — what it does, inputs, signals…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={2000} rows={3} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as Language })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(LANG_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["indicator","strategy","study","screener","scanner","library","utility"].map(c =>
                          <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Asset class (BTC, ES, SPY…)" value={form.asset_class} onChange={e => setForm({ ...form, asset_class: e.target.value })} />
                    <Input placeholder="Timeframe (1h, 1D…)" value={form.timeframe} onChange={e => setForm({ ...form, timeframe: e.target.value })} />
                    <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                  </div>
                  <Input placeholder="Source URL (optional)" value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} />
                  <Textarea
                    placeholder="// paste your full script here&#10;//@version=5&#10;indicator(&quot;My Indicator&quot;, overlay=true)"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    rows={14}
                    className="font-mono text-xs bg-black/60"
                  />
                  <p className="text-xs text-muted-foreground">
                    By publishing you confirm you have the right to share this code. Published as MIT unless your script header says otherwise.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpload} className="gap-2"><Upload className="w-4 h-4" /> Publish</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search scripts, tags, descriptions…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 font-mono" />
          </div>
          <Tabs value={langFilter} onValueChange={(v) => setLangFilter(v as any)}>
            <TabsList className="font-mono">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pinescript">Pine</TabsTrigger>
              <TabsTrigger value="thinkscript">ThinkScript</TabsTrigger>
              <TabsTrigger value="freqtrade">Freqtrade</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={catFilter} onValueChange={(v) => setCatFilter(v as any)}>
            <SelectTrigger className="w-[180px] font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {["indicator","strategy","study","screener","scanner","library","utility"].map(c =>
                <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-mono">{"//"} loading scripts…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <Code2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-mono text-muted-foreground">No scripts yet. Be the first to publish.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <Card key={s.id} className="hover:border-accent/60 transition-colors bg-card/60 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-mono line-clamp-1">{s.title}</CardTitle>
                    {s.is_featured && <Sparkles className="w-4 h-4 text-gold shrink-0" />}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="outline" className={`text-xs font-mono ${LANG_COLOR[s.language]}`}>{LANG_LABEL[s.language]}</Badge>
                    <Badge variant="secondary" className="text-xs">{s.category}</Badge>
                    {s.timeframe && <Badge variant="outline" className="text-xs">{s.timeframe}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {s.description || "No description provided."}
                  </p>
                  {s.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.tags.slice(0, 4).map(t => <span key={t} className="text-[10px] font-mono text-accent">#{t}</span>)}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border/50">
                    <span className="flex items-center gap-3">
                      <button onClick={() => handleLike(s.id)} className="flex items-center gap-1 hover:text-royal-red transition-colors">
                        <Heart className="w-3 h-3" /> {s.likes}
                      </button>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {s.downloads}</span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setViewScript(s)} className="h-7 text-xs font-mono">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View dialog */}
        <Dialog open={!!viewScript} onOpenChange={(o) => !o && setViewScript(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {viewScript && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-mono flex items-center gap-2 flex-wrap">
                    <FileCode2 className="w-5 h-5 text-accent" />
                    {viewScript.title}
                    <Badge variant="outline" className={`text-xs font-mono ${LANG_COLOR[viewScript.language]}`}>{LANG_LABEL[viewScript.language]}</Badge>
                    <Badge variant="secondary" className="text-xs">{viewScript.category}</Badge>
                  </DialogTitle>
                </DialogHeader>
                {viewScript.description && <p className="text-sm text-muted-foreground">{viewScript.description}</p>}
                <pre className="flex-1 overflow-auto bg-black/80 border border-accent/30 rounded p-4 text-xs font-mono text-accent">
                  <code>{viewScript.code}</code>
                </pre>
                <DialogFooter className="gap-2">
                  {viewScript.source_url && (
                    <Button variant="outline" asChild>
                      <a href={viewScript.source_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                        <ExternalLink className="w-4 h-4" /> Source
                      </a>
                    </Button>
                  )}
                  <Button onClick={() => handleCopy(viewScript)} className="gap-2">
                    <Download className="w-4 h-4" /> Copy Code
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default ScriptLibraryPage;