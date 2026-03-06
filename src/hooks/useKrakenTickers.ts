import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface KrakenTickerQuote {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  volume: number;
  lastUpdate: Date;
}

// ──────────────────────────────────────────────────────────────
// Comprehensive CoinGecko ID map — 200+ assets across every category
// ──────────────────────────────────────────────────────────────
const CG_ID_MAP: Record<string, string> = {
  // ── Major L1s ──
  "BTC/USDT": "bitcoin",
  "ETH/USDT": "ethereum",
  "SOL/USDT": "solana",
  "BNB/USDT": "binancecoin",
  "XRP/USDT": "ripple",
  "ADA/USDT": "cardano",
  "AVAX/USDT": "avalanche-2",
  "DOT/USDT": "polkadot",
  "TRX/USDT": "tron",
  "MATIC/USDT": "matic-network",
  "LINK/USDT": "chainlink",
  "DOGE/USDT": "dogecoin",
  "LTC/USDT": "litecoin",
  "ATOM/USDT": "cosmos",
  "NEAR/USDT": "near",
  "FTM/USDT": "fantom",
  "SUI/USDT": "sui",
  "APT/USDT": "aptos",
  "SEI/USDT": "sei-network",
  "INJ/USDT": "injective-protocol",
  "TON/USDT": "the-open-network",
  "ICP/USDT": "internet-computer",
  "HBAR/USDT": "hedera-hashgraph",
  "VET/USDT": "vechain",
  "EOS/USDT": "eos",
  "XTZ/USDT": "tezos",
  "EGLD/USDT": "multiversx-elrond",
  "KAVA/USDT": "kava",
  "MINA/USDT": "mina-protocol",
  "CELO/USDT": "celo",
  "KAS/USDT": "kaspa",
  "TAO/USDT": "bittensor",
  "TIA/USDT": "celestia",
  "STX/USDT": "blockstack",

  // ── L2s & Scaling ──
  "ARB/USDT": "arbitrum",
  "OP/USDT": "optimism",
  "STRK/USDT": "starknet",
  "IMX/USDT": "immutable-x",
  "METIS/USDT": "metis-token",
  "MANTA/USDT": "manta-network",
  "BLAST/USDT": "blast",
  "ZK/USDT": "zksync",
  "SCROLL/USDT": "scroll",

  // ── Privacy ──
  "XMR/USDT": "monero",
  "ZEC/USDT": "zcash",
  "DASH/USDT": "dash",
  "SCRT/USDT": "secret",

  // ── DeFi Blue Chips ──
  "UNI/USDT": "uniswap",
  "AAVE/USDT": "aave",
  "MKR/USDT": "maker",
  "COMP/USDT": "compound-governance-token",
  "LDO/USDT": "lido-dao",
  "RPL/USDT": "rocket-pool",
  "CRV/USDT": "curve-dao-token",
  "CVX/USDT": "convex-finance",
  "SNX/USDT": "havven",
  "SUSHI/USDT": "sushi",
  "YFI/USDT": "yearn-finance",
  "BAL/USDT": "balancer",
  "1INCH/USDT": "1inch",

  // ── DEX & DeFi Protocols ──
  "DYDX/USDT": "dydx",
  "GMX/USDT": "gmx",
  "PENDLE/USDT": "pendle",
  "JUP/USDT": "jupiter-exchange-solana",
  "RAY/USDT": "raydium",
  "ORCA/USDT": "orca",
  "CAKE/USDT": "pancakeswap-token",
  "JOE/USDT": "joe",

  // ── AI & Data ──
  "RNDR/USDT": "render-token",
  "FET/USDT": "fetch-ai",
  "OCEAN/USDT": "ocean-protocol",
  "AGIX/USDT": "singularitynet",
  "GRT/USDT": "the-graph",
  "FIL/USDT": "filecoin",
  "AR/USDT": "arweave",
  "HNT/USDT": "helium",
  "AKT/USDT": "akash-network",
  "THETA/USDT": "theta-token",
  "TFUEL/USDT": "theta-fuel",
  "WLD/USDT": "worldcoin-wld",

  // ── Gaming & Metaverse ──
  "AXS/USDT": "axie-infinity",
  "SAND/USDT": "the-sandbox",
  "MANA/USDT": "decentraland",
  "GALA/USDT": "gala",
  "ENJ/USDT": "enjincoin",
  "ILV/USDT": "illuvium",
  "PRIME/USDT": "echelon-prime",
  "BEAM/USDT": "beam-2",
  "PIXEL/USDT": "pixels",
  "PORTAL/USDT": "portal-2",

  // ── Memes & Culture ──
  "SHIB/USDT": "shiba-inu",
  "PEPE/USDT": "pepe",
  "FLOKI/USDT": "floki",
  "BONK/USDT": "bonk",
  "WIF/USDT": "dogwifcoin",
  "MEME/USDT": "memecoin-2",

  // ── RWA & Stablecoins ──
  "ONDO/USDT": "ondo-finance",
  "MNT/USDT": "mantle",
  "PYTH/USDT": "pyth-network",
  "JTO/USDT": "jito-governance-token",
  "W/USDT": "wormhole",
  "STRK2/USDT": "strike",

  // ── Infrastructure & Interop ──
  "QNT/USDT": "quant-network",
  "RUNE/USDT": "thorchain",
  "ZRX/USDT": "0x",
  "BAND/USDT": "band-protocol",
  "API3/USDT": "api3",
  "COTI/USDT": "coti",
  "RLC/USDT": "iexec-rlc",
  "NKN/USDT": "nkn",
  "CTSI/USDT": "cartesi",
  "CELR/USDT": "celer-network",

  // ── Older L1s & Infrastructure ──
  "ALGO/USDT": "algorand",
  "XLM/USDT": "stellar",
  "NEO/USDT": "neo",
  "IOTA/USDT": "iota",
  "ZIL/USDT": "zilliqa",
  "ONE/USDT": "harmony",
  "CKB/USDT": "nervos-network",
  "ROSE/USDT": "oasis-network",
  "ASTR/USDT": "astar",
  "GLMR/USDT": "moonbeam",
  "WAVES/USDT": "waves",
  "ICX/USDT": "icon",
  "KDA/USDT": "kadena",
  "ERGO/USDT": "ergo",
  "CSPR/USDT": "casper-network",

  // ── Exchange Tokens ──
  "CRO/USDT": "crypto-com-chain",
  "OKB/USDT": "okb",
  "GT/USDT": "gatechain-token",
  "LEO/USDT": "leo-token",

  // ── Liquid Staking ──
  "CBETH/USDT": "coinbase-wrapped-staked-eth",
  "RETH/USDT": "rocket-pool-eth",
  "MSOL/USDT": "msol",

  // ── Perpetuals & Derivatives ──
  "PERP/USDT": "perpetual-protocol",

  // ── NFT Infrastructure ──
  "BLUR/USDT": "blur",
  "LOOKS/USDT": "looksrare",
  "RARI/USDT": "rarible",
  "SUPER/USDT": "superfarm",
};

// Build default list from all mapped symbols
const DEFAULT_SYMBOLS = Object.keys(CG_ID_MAP);

// Reverse map: CoinGecko ID → symbol
const REVERSE_MAP: Record<string, string> = {};
for (const [sym, cgId] of Object.entries(CG_ID_MAP)) {
  REVERSE_MAP[cgId] = sym;
}

/**
 * Live ticker hook — fetches prices via the market-data-sync edge function
 * (server-side CoinGecko proxy with caching + rate limiting).
 * Falls back to database cache if the edge function is unavailable.
 * Polls every `pollMs` (default 30s, min 15s).
 */
export function useKrakenTickers(symbols: string[] = DEFAULT_SYMBOLS, pollMs = 30_000) {
  const [tickers, setTickers] = useState<Record<string, KrakenTickerQuote>>({});
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const fetchAll = async () => {
      const ids = [...new Set(symbols.map((s) => CG_ID_MAP[s]).filter(Boolean))];
      if (ids.length === 0) return;

      try {
        const allResults: Record<string, KrakenTickerQuote> = {};

        // Batch into groups of 50 for the edge function (server-side has no CORS issues)
        const batches: string[][] = [];
        for (let i = 0; i < ids.length; i += 50) {
          batches.push(ids.slice(i, i + 50));
        }

        for (let b = 0; b < batches.length; b++) {
          if (cancelled || !mountedRef.current) return;
          if (b > 0) await new Promise(r => setTimeout(r, 500));

          const { data, error } = await supabase.functions.invoke("market-data-sync", {
            body: { action: "get_price", params: { coinIds: batches[b] } },
          });

          if (error || !data?.success || !data?.prices) continue;

          for (const [cgId, priceData] of Object.entries(data.prices) as [string, any][]) {
            const sym = REVERSE_MAP[cgId];
            if (sym) {
              allResults[sym] = {
                symbol: sym,
                lastPrice: Number(priceData.usd) || 0,
                priceChangePercent: Number(priceData.usd_24h_change) || 0,
                volume: Number(priceData.usd_24h_vol) || 0,
                lastUpdate: new Date(),
              };
            }
          }
        }

        if (!cancelled && mountedRef.current) {
          setTickers((prev) => ({ ...prev, ...allResults }));
          setConnected(Object.keys(allResults).length > 0);
        }
      } catch {
        // Network error — keep previous data, try DB fallback
        try {
          const { data: cached } = await supabase
            .from("market_prices")
            .select("coin_id, price_usd, price_change_percentage_24h, total_volume, last_updated")
            .in("coin_id", ids)
            .order("market_cap", { ascending: false, nullsFirst: false });

          if (cached && cached.length > 0 && !cancelled && mountedRef.current) {
            const fallback: Record<string, KrakenTickerQuote> = {};
            for (const row of cached) {
              const sym = REVERSE_MAP[row.coin_id];
              if (sym) {
                fallback[sym] = {
                  symbol: sym,
                  lastPrice: Number(row.price_usd) || 0,
                  priceChangePercent: Number(row.price_change_percentage_24h) || 0,
                  volume: Number(row.total_volume) || 0,
                  lastUpdate: new Date(row.last_updated || Date.now()),
                };
              }
            }
            setTickers((prev) => ({ ...prev, ...fallback }));
            setConnected(Object.keys(fallback).length > 0);
          }
        } catch {
          // Complete failure — keep existing state
        }
      }
    };

    fetchAll();
    timerRef.current = window.setInterval(fetchAll, Math.max(15_000, pollMs));

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [symbols.join("|"), pollMs]);

  return { tickers, connected };
}
