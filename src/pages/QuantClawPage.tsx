import Header from "@/components/Header";

import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Brain, FlaskConical, Shield, Search, Zap, GitBranch, BarChart3, Lock, AlertTriangle, Megaphone, Share2, Mail, Calendar, Loader2, Play, CheckCircle2, XCircle, Clock, Send, TrendingUp } from "lucide-react";
import StrategyBacktest from "@/components/strategy/StrategyBacktest";
import AIAgentLeaderboard from "@/components/trading/AIAgentLeaderboard";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as renderApi from "@/integrations/renderApi";
import { toast } from "sonner";

const AGENT_TOOLS_DEV = [
  { name: "search_trading_code", desc: "RAG search across Tier 1+2 trading repos", icon: Search },
  { name: "search_quant_research", desc: "RAG search across quant & ML repos", icon: Brain },
  { name: "search_onchain", desc: "On-chain contract & protocol search", icon: GitBranch },
  { name: "freqtrade_backtest", desc: "Run strategy backtests", icon: FlaskConical },
  { name: "freqtrade_optimize", desc: "Hyperparameter optimization", icon: Zap },
  { name: "ccxt_sim_order", desc: "Order simulation & testing", icon: BarChart3 },
  { name: "social_media_post", desc: "Create & schedule posts for X/Twitter, LinkedIn, Threads", icon: Share2 },
  { name: "marketing_campaign", desc: "Generate campaigns: email, airdrop, referral, influencer", icon: Megaphone },
  { name: "content_generator", desc: "Blog posts, press releases, newsletters for aiqtp.com", icon: Mail },
  { name: "campaign_scheduler", desc: "Schedule multi-channel campaigns with analytics", icon: Calendar },
];

const AGENT_TOOLS_PROD = [
  { name: "ccxt_live_order", desc: "Live order (admin-gated, ≤2% position)", icon: AlertTriangle, restricted: true },
];

const TIER_DATA = [
  { tier: 1, label: "Core Trading Brain", count: 27, color: "text-green-400", desc: "Default corpus — your platforms, strategies, ML" },
  { tier: 2, label: "Infra & On-Chain", count: 16, color: "text-blue-400", desc: "APIs, exchanges, smart contracts" },
  { tier: 3, label: "Frameworks & Research", count: 30, color: "text-muted-foreground", desc: "Opt-in only — LLMs, quantum, deep learning" },
];

type DirectiveStatus = "pending" | "running" | "done" | "error";

type DirectiveRow = {
  id: string;
  tool: string;
  status: DirectiveStatus;
  result: Record<string, unknown> | null;
  error_msg: string | null;
  created_at: string;
};

// Tools that dispatch to the Render Worker via agent_directives
const WORKER_TOOLS = new Set([
  "freqtrade_backtest",
  "freqtrade_optimize",
  "ccxt_sim_order",
  "factor_generation",
]);

// RAG search tools — invoke qaqi-agent edge function directly (OpenClaw gateway)
const RAG_TOOLS = new Set([
  "search_trading_code",
  "search_quant_research",
  "search_onchain",
]);

// Tier filter for each RAG tool
const RAG_TIER: Record<string, string> = {
  search_trading_code:  "tier1_tier2",
  search_quant_research: "tier1_tier3",
  search_onchain:        "tier2_onchain",
};

// Default params template per tool (shown in the dispatch panel)
const DEFAULT_PARAMS: Record<string, Record<string, unknown>> = {
  freqtrade_backtest:  { symbol: "BTC/USDT", timeframe: "1h", strategy: "RSI_EMA_Cross", days: 90 },
  freqtrade_optimize:  { strategy: "RSI_EMA_Cross", optimization_target: "sharpe_ratio", n_trials: 50 },
  ccxt_sim_order:      { symbol: "BTC/USDT", side: "buy", quantity: 0.001 },
  ccxt_live_order:     { symbol: "BTCUSD", side: "buy", notional: 100, approved: false },
  factor_generation:   { factors: ["RSI", "MACD", "Volume_Profile"], symbol: "BTC/USDT" },
};

const StatusIcon = ({ status }: { status: DirectiveStatus | null }) => {
  if (!status) return null;
  if (status === "pending" || status === "running")
    return <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />;
  if (status === "done")
    return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

type ChatMessage = { role: "user" | "assistant"; content: string; ts: number };

const CHAT_STORAGE_KEY = "qaqi_chat_history_v1";

const loadChatHistory = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
};

const saveChatHistory = (msgs: ChatMessage[]) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-100)));
  } catch { /* storage quota — silently ignore */ }
};

const QuantClawPage = () => {
  const [activeAgent, setActiveAgent] = useState<"dev" | "prod">("dev");
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingResult, setMarketingResult] = useState("");
  const [marketingTopic, setMarketingTopic] = useState("");
  const [marketingPlatform, setMarketingPlatform] = useState("twitter");
  const [marketingAction, setMarketingAction] = useState<"generate_post" | "generate_campaign" | "generate_content">("generate_post");

  // Directive dispatch state (worker tools)
  const [dispatchingTool, setDispatchingTool] = useState<string | null>(null);
  const [dispatchParams, setDispatchParams] = useState<string>("");
  const [activeDirectives, setActiveDirectives] = useState<DirectiveRow[]>([]);

  // RAG search state (OpenClaw qaqi-agent)
  const [ragTool, setRagTool] = useState<string | null>(null);
  const [ragQuery, setRagQuery] = useState("");
  const [ragLoading, setRagLoading] = useState(false);

  // Persistent QAQI chat history (survives page reload via localStorage)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(loadChatHistory);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Live order state (alpaca-trading edge function)
  const [alpacaLoading, setAlpacaLoading] = useState(false);
  const [alpacaResult, setAlpacaResult] = useState<Record<string, unknown> | null>(null);

  // Credentials vault state
  const [alpacaKeyInput, setAlpacaKeyInput] = useState("");
  const [alpacaSecretInput, setAlpacaSecretInput] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  // Persist chat history to localStorage whenever it changes
  useEffect(() => {
    saveChatHistory(chatHistory);
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const cleanup = renderApi.pollDirectives(
        user.id,
        (rows) => setActiveDirectives(rows as DirectiveRow[]),
        5000,
      );
      return cleanup;
    });
  }, []);

  const openDispatch = (toolName: string) => {
    setDispatchingTool(toolName);
    setDispatchParams(JSON.stringify(DEFAULT_PARAMS[toolName] ?? {}, null, 2));
  };

  const submitDirective = async () => {
    if (!dispatchingTool) return;

    // ccxt_live_order → alpaca-trading edge function (direct, immediate)
    if (dispatchingTool === "ccxt_live_order") {
      await invokeLiveOrder();
      return;
    }

    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(dispatchParams);
    } catch {
      toast.error("Invalid JSON in params");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); return; }

    try {
      await renderApi.createDirective(user.id, dispatchingTool, activeAgent, params);
      toast.success(`${dispatchingTool} dispatched to Render Worker`);
      setDispatchingTool(null);
    } catch (err) {
      toast.error("Dispatch failed", { description: String(err) });
    }
  };

  // Save Alpaca credentials to Supabase account_key_vault
  // Worker reads from here at startup if env vars are not set
  const saveAlpacaCreds = async () => {
    if (!alpacaKeyInput.trim() || !alpacaSecretInput.trim()) {
      toast.error("Both Alpaca API key and secret are required.");
      return;
    }
    setSavingCreds(true);
    try {
      const upsert = async (accountId: string, value: string) => {
        const existing = await supabase
          .from("account_key_vault")
          .select("id")
          .eq("account_id", accountId)
          .maybeSingle();
        if (existing.data) {
          await supabase
            .from("account_key_vault")
            .update({ api_key_encrypted: value })
            .eq("account_id", accountId);
        } else {
          await supabase
            .from("account_key_vault")
            .insert({ account_id: accountId, api_key_encrypted: value });
        }
      };
      await upsert("alpaca_api_key", alpacaKeyInput.trim());
      await upsert("alpaca_secret_key", alpacaSecretInput.trim());
      toast.success("Alpaca credentials saved to vault", {
        description: "The Render Worker will load them automatically on next restart.",
      });
      setAlpacaKeyInput("");
      setAlpacaSecretInput("");
    } catch (e: unknown) {
      toast.error("Failed to save credentials", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setSavingCreds(false);
    }
  };

  // OpenClaw RAG search — routes through qaqi-agent edge function
  // Appends to persistent chat history
  const invokeRagSearch = async () => {
    if (!ragQuery.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: ragQuery.trim(), ts: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    const query = ragQuery.trim();
    setRagQuery("");
    setRagLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("qaqi-agent", {
        body: {
          action: "chat",
          messages: [{ role: "user", content: query }],
          context: {
            module: "rag_search",
            tier: ragTool ? RAG_TIER[ragTool] : "tier1_tier2",
            tool: ragTool ?? "search_trading_code",
            permissions: ["read"],
          },
        },
      });
      if (error) throw error;
      const content = data?.response || data?.message || data?.content || JSON.stringify(data, null, 2);
      const assistantMsg: ChatMessage = { role: "assistant", content, ts: Date.now() };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const errMsg: ChatMessage = { role: "assistant", content: `Error: ${msg}`, ts: Date.now() };
      setChatHistory(prev => [...prev, errMsg]);
      toast.error("QAQI search failed", { description: msg });
    } finally {
      setRagLoading(false);
    }
  };

  // Live order — routes through existing alpaca-trading edge function directly
  const invokeLiveOrder = async () => {
    if (activeAgent !== "prod") {
      toast.error("Switch to QuantClaw-Prod before submitting live orders.");
      return;
    }
    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(dispatchParams);
    } catch {
      toast.error("Invalid JSON in params");
      return;
    }
    if (!params.approved) {
      toast.error("Set approved: true in params to confirm this live order.");
      return;
    }
    setAlpacaLoading(true);
    setAlpacaResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("alpaca-trading", {
        body: {
          action: "place_order",
          mode: "live",
          params: {
            symbol:      params.symbol,
            side:        params.side,
            quantity:    params.qty ?? undefined,
            notional:    params.notional ?? undefined,
            type:        "market",
            timeInForce: "gtc",
          },
        },
      });
      if (error) throw error;
      setAlpacaResult(data);
      toast.success("Live order submitted via Alpaca", {
        description: `${params.side} ${params.symbol}`,
      });
      setDispatchingTool(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Alpaca order failed", { description: msg });
    } finally {
      setAlpacaLoading(false);
    }
  };

  const handleMarketing = async () => {
    setMarketingLoading(true);
    setMarketingResult("");
    try {
      const { data, error } = await supabase.functions.invoke("quantclaw-marketing", {
        body: {
          action: marketingAction,
          platform: marketingPlatform,
          topic: marketingTopic || "AIQTP quantum trading platform features",
          tone: "professional",
          targetAudience: "crypto traders and quant developers",
        },
      });
      if (error) throw error;
      setMarketingResult(data?.content || "No content generated");
      toast.success("Content generated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate content");
    } finally {
      setMarketingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(225,20%,6%)]">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">QuantClaw Command Center</h1>
            <p className="text-muted-foreground">
              Unified agent layer • RAG-powered • 73 repos indexed across 3 tiers
            </p>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={activeAgent === "dev" ? "default" : "outline"}
            onClick={() => setActiveAgent("dev")}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            QuantClaw-Dev
            <Badge variant="secondary" className="ml-1">Active</Badge>
          </Button>
          <Button
            variant={activeAgent === "prod" ? "default" : "outline"}
            onClick={() => setActiveAgent("prod")}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            QuantClaw-Prod
            <Badge variant="outline" className="ml-1 border-destructive text-destructive">Restricted</Badge>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[hsl(223,18%,9%)] border border-[hsl(222,14%,17%)] flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="qaqi">QAQI Agent</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="rag">RAG Corpus</TabsTrigger>
            <TabsTrigger value="tools">Agent Tools</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {TIER_DATA.map(t => (
                <Card key={t.tier} className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-lg ${t.color}`}>Tier {t.tier}: {t.label}</CardTitle>
                    <CardDescription>{t.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xl sm:text-3xl font-bold text-foreground">{t.count}</span>
                    <span className="text-muted-foreground ml-2">repos</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
              <CardHeader>
                <CardTitle>
                  {activeAgent === "dev" ? "QuantClaw-Dev" : "QuantClaw-Prod"} Agent
                </CardTitle>
                <CardDescription>
                  {activeAgent === "dev"
                    ? "Research, code assistance, strategy exploration, backtests, simulated trades"
                    : "Tightly controlled live trading with safety constraints"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AGENT_TOOLS_DEV.map(tool => (
                    <div key={tool.name} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                      <tool.icon className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium text-foreground truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.desc}</p>
                      </div>
                    </div>
                  ))}
                  {activeAgent === "prod" && AGENT_TOOLS_PROD.map(tool => (
                    <div key={tool.name} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <tool.icon className="h-5 w-5 text-destructive shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium text-foreground truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.desc}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">≤2% position</Badge>
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">5/hr limit</Badge>
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Admin gate</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {activeAgent === "dev" && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-destructive font-medium">ccxt_live_order</span> is blocked on Dev agent — switch to Prod for live trading
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── QAQI Agent Tab — full persistent chat + RAG + Alpaca ─────── */}
          <TabsContent value="qaqi">
            <div className="grid gap-4">
              {/* Chat window */}
              <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-5 w-5 text-primary" />
                      QAQI — Quantum Artificial Qubit Intelligent Agent
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setChatHistory([]);
                        localStorage.removeItem(CHAT_STORAGE_KEY);
                        toast.success("Chat history cleared");
                      }}
                    >
                      Clear history
                    </Button>
                  </div>
                  <CardDescription>
                    OpenClaw RAG gateway · Tier 1+2 repos · persistent chat history
                  </CardDescription>
                </CardHeader>

                {/* RAG tool selector */}
                <div className="px-6 pb-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center">Context:</span>
                    {["search_trading_code", "search_quant_research", "search_onchain"].map(tool => (
                      <Button
                        key={tool}
                        variant={ragTool === tool ? "default" : "outline"}
                        size="sm"
                        className="gap-1 text-xs h-7 px-2"
                        onClick={() => setRagTool(tool)}
                      >
                        <Search className="h-3 w-3" />
                        {tool.replace("search_", "")}
                      </Button>
                    ))}
                    {ragTool && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        tier: <span className="text-primary">{RAG_TIER[ragTool]}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Message history — scrollable, does not overlap input */}
                <CardContent className="flex-1 px-6 pb-0">
                  <div className="h-80 overflow-y-auto rounded-lg border border-border/50 bg-background/30 p-3 space-y-3 flex flex-col">
                    {chatHistory.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground text-center">
                          QAQI is ready. Select a search context above and ask anything about the RAG corpus.
                        </p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Brain className="h-3 w-3 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                            msg.role === "user"
                              ? "bg-primary/20 text-foreground ml-auto"
                              : "bg-background/50 border border-border/50 text-muted-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className="text-[10px] opacity-50 mt-1 text-right">
                            {new Date(msg.ts).toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <div className="w-6 h-6 rounded-full bg-background/50 border border-border/50 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px]">U</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {ragLoading && (
                      <div className="flex gap-2 justify-start">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        </div>
                        <div className="bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                          QAQI is searching the codebase...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </CardContent>

                {/* Input area — always at bottom, never overlapped */}
                <div className="px-6 pt-3 pb-4">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder={ragTool
                        ? `Ask QAQI about ${ragTool.replace("search_", "")} (Enter to send, Shift+Enter for newline)`
                        : "Select a context above, then ask anything..."}
                      value={ragQuery}
                      onChange={e => setRagQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          invokeRagSearch();
                        }
                      }}
                      className="bg-background/50 text-sm resize-none min-h-[44px] max-h-32"
                      rows={1}
                    />
                    <Button
                      size="sm"
                      onClick={invokeRagSearch}
                      disabled={ragLoading || !ragQuery.trim()}
                      className="gap-1 shrink-0 h-11"
                    >
                      {ragLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Alpaca credentials vault */}
              <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4 text-yellow-400" />
                    Alpaca Credentials Vault
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Stored in Supabase — the Render Worker loads them automatically at startup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Alpaca API Key ID"
                      type="password"
                      value={alpacaKeyInput}
                      onChange={e => setAlpacaKeyInput(e.target.value)}
                      className="bg-background/50 text-xs font-mono"
                    />
                    <Input
                      placeholder="Alpaca Secret Key"
                      type="password"
                      value={alpacaSecretInput}
                      onChange={e => setAlpacaSecretInput(e.target.value)}
                      className="bg-background/50 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={saveAlpacaCreds} disabled={savingCreds} className="gap-1">
                      {savingCreds ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Save to Vault
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 px-3 text-xs"
                      disabled={alpacaLoading}
                      onClick={async () => {
                        setAlpacaLoading(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("alpaca-trading", {
                            body: { action: "get_account", mode: activeAgent === "prod" ? "live" : "paper" },
                          });
                          if (error) throw error;
                          setAlpacaResult(data);
                        } catch (e: unknown) {
                          toast.error("Alpaca fetch failed", { description: e instanceof Error ? e.message : String(e) });
                        } finally {
                          setAlpacaLoading(false);
                        }
                      }}
                    >
                      {alpacaLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
                      View Account
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Keys are never stored in code or Render env vars.
                  </p>
                  {alpacaResult && (
                    <pre className="text-[11px] text-muted-foreground bg-background/50 border border-border/50 rounded p-3 overflow-x-auto max-h-48">
                      {JSON.stringify(alpacaResult, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketing">
            <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Social Media & Marketing Engine
                </CardTitle>
                <CardDescription>
                  AI-powered content generation for www.aiqtp.com — posts, campaigns, newsletters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Action</label>
                    <Select value={marketingAction} onValueChange={(v) => setMarketingAction(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generate_post">Social Media Post</SelectItem>
                        <SelectItem value="generate_campaign">Full Campaign</SelectItem>
                        <SelectItem value="generate_content">Blog / Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Platform</label>
                    <Select value={marketingPlatform} onValueChange={setMarketingPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">X / Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="threads">Threads</SelectItem>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="email">Email / Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Topic</label>
                    <Input
                      placeholder="e.g. $QTC token launch, quantum trading..."
                      value={marketingTopic}
                      onChange={(e) => setMarketingTopic(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleMarketing}
                  disabled={marketingLoading}
                  className="gap-2"
                >
                  {marketingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                  {marketingLoading ? "Generating..." : "Generate Content"}
                </Button>

                {marketingResult && (
                  <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground">Generated Content</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(marketingResult);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {marketingResult}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="rag">
            <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
              <CardHeader>
                <CardTitle>RAG Corpus — 73 Repositories</CardTitle>
                <CardDescription>
                  Tier 1 is always searched • Tier 2 added for infra/API queries • Tier 3 opt-in only
                </CardDescription>
              </CardHeader>
              <CardContent>
                {TIER_DATA.map(t => (
                  <div key={t.tier} className="mb-6">
                    <h3 className={`text-sm font-semibold ${t.color} mb-2`}>
                      Tier {t.tier} — {t.label} ({t.count} repos)
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{t.desc}</p>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400">
                    ⚠️ <strong>exploit-uniswap</strong> is tagged as <strong>REFERENCE ONLY</strong> — never used to propose or execute exploits
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <div className="grid gap-4">
              <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                <CardHeader>
                  <CardTitle>Tool → Service Mapping</CardTitle>
                  <CardDescription>
                    Worker tools dispatch via <code className="text-xs bg-muted px-1 rounded">agent_directives</code> table → Render Python Worker.
                    RAG tools call edge functions directly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {[
                      { tool: "search_trading_code",  service: "qaqi-agent (OpenClaw) → Tier 1+2 RAG",               rag: true  },
                      { tool: "search_quant_research", service: "qaqi-agent (OpenClaw) → Tier 1+3 RAG",              rag: true  },
                      { tool: "search_onchain",        service: "qaqi-agent (OpenClaw) → on-chain RAG",               rag: true  },
                      { tool: "freqtrade_backtest",    service: "Render Worker ← agent_directives",                   worker: true  },
                      { tool: "freqtrade_optimize",    service: "Render Worker ← agent_directives",                   worker: true  },
                      { tool: "ccxt_sim_order",        service: "Render Worker ← agent_directives (paper, no broker)", worker: true  },
                      { tool: "ccxt_live_order",       service: "alpaca-trading edge function → Alpaca live API",     alpaca: true, prod: true },
                      { tool: "social_media_post",     service: "quantclaw-marketing edge function",                  worker: false },
                      { tool: "marketing_campaign",    service: "quantclaw-marketing edge function",                  worker: false },
                      { tool: "content_generator",     service: "quantclaw-marketing edge function",                  worker: false },
                      { tool: "factor_generation",     service: "Render Worker ← agent_directives",                   worker: true  },
                      { tool: "portfolio_optimize",    service: "portfolio/optimization.ts (client-side lib)",        worker: false },
                    ].map(({ tool, service, worker, rag, alpaca, prod }) => (
                      <div key={tool} className="flex items-center justify-between p-2 rounded bg-background/30 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <code className="text-primary text-xs shrink-0">{tool}</code>
                          {prod && (
                            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive shrink-0">
                              Prod-only
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground text-xs hidden sm:inline">{service}</span>
                          {rag && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px] gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                              onClick={() => { setRagTool(tool); setRagQuery(""); (document.querySelector('[data-value="qaqi"]') as HTMLElement)?.click(); }}
                            >
                              <Search className="h-3 w-3" />
                              Search
                            </Button>
                          )}
                          {worker && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => openDispatch(tool)}
                            >
                              <Play className="h-3 w-3" />
                              Dispatch
                            </Button>
                          )}
                          {alpaca && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px] gap-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                              onClick={() => openDispatch(tool)}
                            >
                              <TrendingUp className="h-3 w-3" />
                              Trade
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dispatch panel — appears when a tool's Dispatch button is clicked */}
              {dispatchingTool && (
                <Card className="bg-[hsl(223,18%,9%)] border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      Dispatch: <code className="text-primary">{dispatchingTool}</code>
                      {dispatchingTool === "ccxt_live_order" && (
                        <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px]">
                          Prod-only — requires approved: true in params
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Edit params JSON then click Send. The Render Worker picks this up within one cycle (~60s).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      className="font-mono text-xs min-h-[120px] bg-background/50"
                      value={dispatchParams}
                      onChange={e => setDispatchParams(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={submitDirective} className="gap-1">
                        <Play className="h-3 w-3" />
                        Send to Worker
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDispatchingTool(null)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent directives — live status from Supabase realtime */}
              {activeDirectives.length > 0 && (
                <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Recent Directives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {activeDirectives.map(d => (
                        <div key={d.id} className="flex items-start gap-3 p-2 rounded bg-background/30 text-xs">
                          <StatusIcon status={d.status} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-primary">{d.tool}</code>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  d.status === "done"    ? "border-green-500/30 text-green-400"   :
                                  d.status === "error"   ? "border-destructive/30 text-destructive" :
                                  d.status === "running" ? "border-yellow-500/30 text-yellow-400" :
                                                           "border-border text-muted-foreground"
                                }`}
                              >
                                {d.status}
                              </Badge>
                              <span className="text-muted-foreground ml-auto">
                                {new Date(d.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            {d.status === "done" && d.result && (
                              <pre className="mt-1 text-muted-foreground whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                                {JSON.stringify(d.result, null, 2)}
                              </pre>
                            )}
                            {d.status === "error" && d.error_msg && (
                              <p className="mt-1 text-destructive">{d.error_msg}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="backtest">
            <StrategyBacktest />
          </TabsContent>

          <TabsContent value="leaderboard">
            <AIAgentLeaderboard />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default QuantClawPage;
