import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Gem, Zap, Star, Flame, Shield, TrendingUp, RefreshCw,
  CircleDollarSign, Coins, Bot
} from "lucide-react";
import type { FaucetToken, ClaimRecord } from "./faucetTypes";
import FaucetStats from "./FaucetStats";
import FaucetAutomation from "./FaucetAutomation";
import FaucetTokenList from "./FaucetTokenList";
import FaucetSidebar from "./FaucetSidebar";
import CompoundAnalytics from "./CompoundAnalytics";
import FaucetScheduler from "./FaucetScheduler";
import { useAssetValuation } from "@/hooks/useAssetValuation";

const FAUCET_TOKENS: FaucetToken[] = [
  { id: 'usdc-test', symbol: 'USDC', name: 'USD Coin (Test)', icon: <CircleDollarSign className="h-5 w-5 text-blue-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'Testnet USDC', chain: 'ethereum' },
  { id: 'usdt-test', symbol: 'USDT', name: 'Tether (Test)', icon: <CircleDollarSign className="h-5 w-5 text-green-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'Testnet USDT', chain: 'ethereum' },
  { id: 'dai-test', symbol: 'DAI', name: 'DAI (Test)', icon: <CircleDollarSign className="h-5 w-5 text-amber-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'Decentralized stablecoin', chain: 'ethereum' },
  { id: 'busd-test', symbol: 'BUSD', name: 'Binance USD (Test)', icon: <CircleDollarSign className="h-5 w-5 text-yellow-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'BSC stablecoin', chain: 'bsc' },
  { id: 'qtc', symbol: 'QTC', name: 'Quantum Time Crystal', icon: <Gem className="h-5 w-5 text-purple-500" />, claimAmount: 5, claimInterval: 8, available: true, category: 'platform', description: 'Native platform token', chain: 'platform', bonus: '2x weekends' },
  { id: 'aiq', symbol: 'AIQ', name: 'AI Quant Token', icon: <Zap className="h-5 w-5 text-cyan-500" />, claimAmount: 25, claimInterval: 6, available: true, category: 'platform', description: 'Governance & AI access', chain: 'platform', bonus: 'Streak bonus' },
  { id: 'nxs', symbol: 'NXS', name: 'Nexus Points', icon: <Star className="h-5 w-5 text-amber-400" />, claimAmount: 50, claimInterval: 4, available: true, category: 'platform', description: 'Loyalty points', chain: 'platform' },
  { id: 'eth-test', symbol: 'ETH', name: 'Ethereum (Sepolia)', icon: <Flame className="h-5 w-5 text-indigo-400" />, claimAmount: 0.5, claimInterval: 24, available: true, category: 'testnet', description: 'Sepolia testnet ETH', chain: 'ethereum-sepolia' },
  { id: 'btc-test', symbol: 'BTC', name: 'Bitcoin (Testnet)', icon: <Coins className="h-5 w-5 text-orange-500" />, claimAmount: 0.01, claimInterval: 48, available: true, category: 'testnet', description: 'Bitcoin testnet', chain: 'bitcoin-testnet' },
  { id: 'sol-test', symbol: 'SOL', name: 'Solana (Devnet)', icon: <Zap className="h-5 w-5 text-emerald-400" />, claimAmount: 5, claimInterval: 12, available: true, category: 'testnet', description: 'Solana devnet', chain: 'solana-devnet' },
  { id: 'matic-test', symbol: 'MATIC', name: 'Polygon (Mumbai)', icon: <Shield className="h-5 w-5 text-violet-500" />, claimAmount: 10, claimInterval: 12, available: true, category: 'testnet', description: 'Polygon testnet', chain: 'polygon-mumbai' },
  { id: 'avax-test', symbol: 'AVAX', name: 'Avalanche (Fuji)', icon: <TrendingUp className="h-5 w-5 text-red-500" />, claimAmount: 2, claimInterval: 24, available: true, category: 'testnet', description: 'Avalanche testnet', chain: 'avalanche-fuji' },
  { id: 'uni-test', symbol: 'UNI', name: 'Uniswap (Test)', icon: <RefreshCw className="h-5 w-5 text-pink-500" />, claimAmount: 10, claimInterval: 24, available: true, category: 'defi', description: 'Test UNI', chain: 'ethereum' },
  { id: 'aave-test', symbol: 'AAVE', name: 'Aave (Test)', icon: <Shield className="h-5 w-5 text-sky-400" />, claimAmount: 2, claimInterval: 24, available: true, category: 'defi', description: 'Test AAVE', chain: 'ethereum' },
  { id: 'link-test', symbol: 'LINK', name: 'Chainlink (Test)', icon: <Zap className="h-5 w-5 text-blue-400" />, claimAmount: 15, claimInterval: 24, available: true, category: 'defi', description: 'Test LINK', chain: 'ethereum' },
];

const CryptoFaucet = () => {
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [lastClaimTimes, setLastClaimTimes] = useState<Record<string, Date>>({});
  const [streakCount, setStreakCount] = useState(0);
  const [autoClaim, setAutoClaim] = useState(false);
  const [autoClaimRunning, setAutoClaimRunning] = useState(false);
  const [autoCompound, setAutoCompound] = useState(true);
  const [reinvestPercent, setReinvestPercent] = useState(100);
  const [compoundEngine, setCompoundEngine] = useState<any>(null);
  const [compoundStats, setCompoundStats] = useState({ deployed: 0, transactions: 0, profit: 0 });
  const autoClaimRef = useRef(false);
  const autoCompoundRef = useRef(false);
  const lastClaimTimesRef = useRef<Record<string, Date>>({});
  const { getValuation } = useAssetValuation();

  const loadClaims = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data } = await supabase
      .from("faucet_claims")
      .select("id, amount, chain, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200) as { data: ClaimRecord[] | null };

    const records = data || [];
    setClaims(records);

    const bal: Record<string, number> = {};
    const lastTimes: Record<string, Date> = {};
    for (const claim of records) {
      const token = FAUCET_TOKENS.find(t => t.chain === claim.chain || t.id === claim.chain);
      const symbol = token?.symbol || claim.chain;
      bal[symbol] = (bal[symbol] || 0) + Number(claim.amount);
      const tokenId = token?.id || claim.chain;
      if (!lastTimes[tokenId]) lastTimes[tokenId] = new Date(claim.created_at);
    }
    setBalances(bal);
    setLastClaimTimes(lastTimes);
    lastClaimTimesRef.current = lastTimes;

    const claimDays = new Set(records.map(c => new Date(c.created_at).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (claimDays.has(d.toDateString())) streak++;
      else break;
    }
    setStreakCount(streak);
    setLoading(false);
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  // Realtime subscription for faucet_claims
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('faucet-claims-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faucet_claims', filter: `user_id=eq.${userId}` },
        () => { loadClaims(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadClaims]);

  const loadCompoundEngine = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("auto_invest_engine")
      .select("id, total_capital, total_profit, total_deployed, strategy, status, reinvest_percent, cycle_count")
      .limit(1) as any;

    if (data?.[0]) {
      setCompoundEngine(data[0]);
      setReinvestPercent(Number(data[0].reinvest_percent) || 100);
      // Always keep compound active — only read UI toggle state, don't override to false
      if (data[0].status === 'active') setAutoCompound(true);

      const { count } = await supabase
        .from("auto_invest_transactions")
        .select("id", { count: 'exact', head: true })
        .eq("engine_id", data[0].id) as any;

      setCompoundStats({
        deployed: Number(data[0].total_deployed) || 0,
        transactions: count || 0,
        profit: Number(data[0].total_profit) || 0,
      });
    } else {
      // Auto-create engine so claims always compound
      const { data: newEngine } = await supabase.from("auto_invest_engine").insert({
        engine_name: 'Faucet Compound Engine',
        strategy: 'ultra_aggressive',
        status: 'active',
        reinvest_percent: 100,
        growth_target_percent: 95,
        stable_target_percent: 5,
        total_capital: 0,
        total_deployed: 0,
        total_profit: 0,
        total_reinvested: 0,
        rebalance_threshold: 5,
        cycle_count: 0,
      } as any).select('id, total_capital, total_profit, total_deployed, strategy, status, reinvest_percent, cycle_count').single() as any;

      if (newEngine) {
        setCompoundEngine(newEngine);
        setAutoCompound(true);
      }
    }
  }, [userId]);

  useEffect(() => { if (userId) loadCompoundEngine(); }, [userId, loadCompoundEngine]);

  const routeToCompound = useCallback(async (tokenSymbol: string, amount: number) => {
    // Always compound — if engine doesn't exist yet, skip silently
    if (!compoundEngine) return;
    
    // Convert token amount to real USD value using live prices
    const valuation = getValuation(tokenSymbol, amount);
    const usdValue = valuation.valueUsd;
    if (usdValue <= 0) return;
    
    const deployAmount = usdValue * (reinvestPercent / 100);
    if (deployAmount <= 0) return;

    const strategies = [
      { name: 'AI Momentum Alpha', pct: 50 },
      { name: 'Quantum Mean Reversion', pct: 30 },
      { name: 'DeFi Yield Optimizer', pct: 20 },
    ];

    for (const strat of strategies) {
      const stratAmount = deployAmount * (strat.pct / 100);
      if (stratAmount <= 0) continue;
      
      // Create allocation record for tracking
      await supabase.from("auto_invest_allocations").insert({
        engine_id: compoundEngine.id,
        asset_symbol: tokenSymbol,
        asset_name: strat.name,
        asset_class: 'strategy',
        allocation_type: 'growth',
        target_percent: strat.pct,
        current_percent: strat.pct,
        value_usd: stratAmount,
        quantity: amount * (strat.pct / 100),
        entry_price: valuation.priceUsd,
        current_price: valuation.priceUsd,
        is_active: true,
      } as any);
      
      // Log transaction
      await supabase.from("auto_invest_transactions").insert({
        engine_id: compoundEngine.id,
        transaction_type: 'reinvest',
        amount_usd: stratAmount,
        asset_symbol: tokenSymbol,
        side: 'buy',
        price: valuation.priceUsd,
        quantity: amount * (strat.pct / 100),
        status: 'completed',
        ai_triggered: true,
        ai_reason: `Auto-compound ${tokenSymbol} → ${strat.name} (${strat.pct}%) | $${usdValue.toFixed(2)} total`,
        ai_confidence: 0.85,
        market_regime: 'growth',
      } as any);
    }

    await supabase.from("auto_invest_engine").update({
      total_capital: (Number(compoundEngine.total_capital) || 0) + deployAmount,
      total_deployed: (Number(compoundEngine.total_deployed) || 0) + deployAmount,
      cycle_count: (compoundEngine.cycle_count || 0) + 1,
    } as any).eq("id", compoundEngine.id) as any;

    await loadCompoundEngine();
  }, [compoundEngine, reinvestPercent, loadCompoundEngine, getValuation]);

  useEffect(() => { autoCompoundRef.current = autoCompound; }, [autoCompound]);
  useEffect(() => { autoClaimRef.current = autoClaim; }, [autoClaim]);

  const isOnCooldown = useCallback((token: FaucetToken): boolean => {
    const last = lastClaimTimes[token.id];
    if (!last) return false;
    return (Date.now() - last.getTime()) < (token.claimInterval * 3600000);
  }, [lastClaimTimes]);

  const getCooldownRemaining = useCallback((token: FaucetToken): string => {
    const last = lastClaimTimes[token.id];
    if (!last) return 'Ready!';
    const remaining = (token.claimInterval * 3600000) - (Date.now() - last.getTime());
    if (remaining <= 0) return 'Ready!';
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return `${h}h ${m}m`;
  }, [lastClaimTimes]);

  const getCooldownProgress = useCallback((token: FaucetToken): number => {
    const last = lastClaimTimes[token.id];
    if (!last) return 100;
    const total = token.claimInterval * 3600000;
    const elapsed = Date.now() - last.getTime();
    return Math.min(100, (elapsed / total) * 100);
  }, [lastClaimTimes]);

  const insertClaim = async (token: FaucetToken) => {
    const { error } = await supabase.from("faucet_claims").insert({
      user_id: userId,
      amount: token.claimAmount,
      chain: token.id,
      wallet_address: '',
      status: 'completed',
    } as any);
    if (error) return error;

    // Credit portfolio_holdings via DB function
    const { error: creditError } = await supabase.rpc('credit_faucet_claim', {
      p_user_id: userId,
      p_symbol: token.symbol,
      p_amount: token.claimAmount,
      p_chain: token.id,
    });
    if (creditError) console.error('Credit error:', creditError);
    return null;
  };

  const handleClaim = async (token: FaucetToken) => {
    if (!userId) { toast.error("Please sign in to claim tokens"); return; }
    if (isOnCooldown(token)) { toast.error(`Wait ${getCooldownRemaining(token)}`); return; }
    setClaiming(token.id);
    const error = await insertClaim(token);
    if (error) { toast.error("Claim failed: " + error.message); setClaiming(null); return; }
    await routeToCompound(token.symbol, token.claimAmount);
    toast.success(`Claimed ${token.claimAmount} ${token.symbol}!`, {
      description: autoCompound ? `${reinvestPercent}% → top strategies` : streakCount > 0 ? `🔥 ${streakCount + 1}-day streak!` : undefined,
    });
    await loadClaims();
    setClaiming(null);
  };

  const handleClaimAll = async () => {
    if (!userId) { toast.error("Please sign in"); return; }
    setClaiming('all');
    let count = 0;
    for (const token of FAUCET_TOKENS) {
      if (!isOnCooldown(token) && token.available) {
        const error = await insertClaim(token);
        if (!error) { count++; await routeToCompound(token.symbol, token.claimAmount); }
      }
    }
    if (count > 0) { toast.success(`Claimed ${count} tokens!`); await loadClaims(); }
    else toast.info("All on cooldown");
    setClaiming(null);
  };

  // Auto-claim loop
  useEffect(() => {
    if (!autoClaim || !userId) return;
    const run = async () => {
      if (!autoClaimRef.current) return;
      setAutoClaimRunning(true);
      let count = 0;
      for (const token of FAUCET_TOKENS) {
        if (!autoClaimRef.current) break;
        const last = lastClaimTimesRef.current[token.id];
        const onCd = last && (Date.now() - last.getTime()) < (token.claimInterval * 3600000);
        if (!onCd && token.available) {
          const error = await insertClaim(token);
          if (!error) { count++; await routeToCompound(token.symbol, token.claimAmount); }
        }
      }
      if (count > 0) {
        toast.success(`Auto-claimed ${count} token${count > 1 ? 's' : ''}!`, { icon: <Bot className="h-4 w-4" /> });
        await loadClaims();
      }
      setAutoClaimRunning(false);
    };
    run();
    const interval = setInterval(run, 30000);
    return () => clearInterval(interval);
  }, [autoClaim, userId, loadClaims, routeToCompound]);

  const { getPortfolioValuation } = useAssetValuation();
  const availableCount = FAUCET_TOKENS.filter(t => !isOnCooldown(t) && t.available).length;
  const { totalUsd } = getPortfolioValuation(balances);

  return (
    <div className="space-y-4">
      <FaucetStats
        totalTokens={FAUCET_TOKENS.length}
        ownedTokens={Object.keys(balances).length}
        totalClaims={claims.length}
        streakCount={streakCount}
        totalValue={totalUsd}
      />

      <FaucetAutomation
        autoClaim={autoClaim}
        setAutoClaim={setAutoClaim}
        autoClaimRunning={autoClaimRunning}
        autoCompound={autoCompound}
        setAutoCompound={setAutoCompound}
        reinvestPercent={reinvestPercent}
        setReinvestPercent={setReinvestPercent}
        availableCount={availableCount}
        claiming={claiming}
        loading={loading}
        onClaimAll={handleClaimAll}
        compoundStats={compoundStats}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FaucetTokenList
          tokens={FAUCET_TOKENS}
          balances={balances}
          claiming={claiming}
          loading={loading}
          isOnCooldown={isOnCooldown}
          getCooldownRemaining={getCooldownRemaining}
          getCooldownProgress={getCooldownProgress}
          onClaim={handleClaim}
        />

        <FaucetSidebar
          balances={balances}
          claims={claims}
          tokens={FAUCET_TOKENS}
          loading={loading}
          streakCount={streakCount}
          userId={userId}
        />
      </div>

      {/* Compound Analytics */}
      <CompoundAnalytics userId={userId} engineId={compoundEngine?.id || null} />

      {/* Claim Scheduler */}
      <FaucetScheduler tokens={FAUCET_TOKENS} userId={userId} />
    </div>
  );
};

export default CryptoFaucet;
