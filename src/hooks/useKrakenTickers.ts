import { useEffect, useState, useRef } from "react";

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
  "DYDX/USDT": "dydx",
  "GMX/USDT": "gmx",
  "PENDLE/USDT": "pendle",
  "JUP/USDT": "jupiter-exchange-solana",
  "RAY/USDT": "raydium",
  "ORCA/USDT": "orca",
  "CAKE/USDT": "pancakeswap-token",
  "JOE/USDT": "joe",

  // ── AI & Compute ──
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
  "TAO/USD": "bittensor",
  "WLD/USDT": "worldcoin-wld",
  "AIOZ/USDT": "aioz-network",

  // ── Gaming & Metaverse ──
  "SAND/USDT": "the-sandbox",
  "MANA/USDT": "decentraland",
  "AXS/USDT": "axie-infinity",
  "GALA/USDT": "gala",
  "ENJ/USDT": "enjincoin",
  "ILV/USDT": "illuvium",
  "BEAM/USDT": "beam-2",
  "PIXEL/USDT": "pixels",
  "PORTAL/USDT": "portal-2",
  "PRIME/USDT": "echelon-prime",
  "RON/USDT": "ronin",
  "WEMIX/USDT": "wemix-token",
  "IME/USDT": "ime",

  // ── Meme ──
  "PEPE/USDT": "pepe",
  "WIF/USDT": "dogwifcoin",
  "BONK/USDT": "bonk",
  "SHIB/USDT": "shiba-inu",
  "FLOKI/USDT": "floki",
  "BABYDOGE/USDT": "baby-doge-coin",
  "TURBO/USDT": "turbo",
  "BRETT/USDT": "brett",
  "MEW/USDT": "cat-in-a-dogs-world",
  "POPCAT/USDT": "popcat",
  "NEIRO/USDT": "neiro-on-eth",
  "MOG/USDT": "mog-coin",

  // ── Stablecoins ──
  "USDC/USDT": "usd-coin",
  "DAI/USDT": "dai",
  "FRAX/USDT": "frax",
  "LUSD/USDT": "liquity-usd",
  "PYUSD/USDT": "paypal-usd",

  // ── Infrastructure / Oracles ──
  "PYTH/USDT": "pyth-network",
  "API3/USDT": "api3",
  "BAND/USDT": "band-protocol",
  "TRB/USDT": "tellor",
  "UMA/USDT": "uma",

  // ── Cross-chain / Bridges ──
  "RUNE/USDT": "thorchain",
  "WORMHOLE/USDT": "wormhole",
  "AXL/USDT": "axelar",
  "ZRO/USDT": "layerzero",
  "STG/USDT": "stargate-finance",

  // ── Storage & Data ──
  "STORJ/USDT": "storj",
  "SC/USDT": "siacoin",
  "FLUX/USDT": "zelcash",

  // ── Social / Identity ──
  "ENS/USDT": "ethereum-name-service",
  "MASK/USDT": "mask-network",
  "CYBER/USDT": "cyberconnect",

  // ── Real World Assets (RWA) ──
  "ONDO/USDT": "ondo-finance",
  "MPL/USDT": "maple",
  "CFG/USDT": "centrifuge",
  "CPOOL/USDT": "clearpool",
  "POLYX/USDT": "polymesh",

  // ── Alt L1s & Others ──
  "XLM/USDT": "stellar",
  "ALGO/USDT": "algorand",
  "RVN/USDT": "ravencoin",
  "FLOW/USDT": "flow",
  "NEO/USDT": "neo",
  "QTUM/USDT": "qtum",
  "ZIL/USDT": "zilliqa",
  "IOTA/USDT": "iota",
  "XDC/USDT": "xdce-crowd-sale",
  "ONE/USDT": "harmony",
  "CKB/USDT": "nervos-network",
  "ROSE/USDT": "oasis-network",
  "ASTR/USDT": "astar",
  "GLMR/USDT": "moonbeam",
  "MOVR/USDT": "moonriver",
  "WAVES/USDT": "waves",
  "ICX/USDT": "icon",
  "KDA/USDT": "kadena",
  "ERGO/USDT": "ergo",
  "CSPR/USDT": "casper-network",

  // ── Exchange Tokens ──
  "CRO/USDT": "crypto-com-chain",
  "OKB/USDT": "okb",
  "GT/USDT": "gatechain-token",
  "MX/USDT": "mx-token",
  "LEO/USDT": "leo-token",
  "FTT/USDT": "ftx-token",
  "HT/USDT": "huobi-token",

  // ── Liquid Staking ──
  "CBETH/USDT": "coinbase-wrapped-staked-eth",
  "RETH/USDT": "rocket-pool-eth",
  "MSOL/USDT": "msol",
  "JITOSOL/USDT": "jito-governance-token",

  // ── Perpetuals & Derivatives ──
  "PERP/USDT": "perpetual-protocol",
  "KWENTA/USDT": "kwenta",
  "VRTX/USDT": "vertex-protocol",

  // ── Yield & Lending ──
  "MORPHO/USDT": "morpho",
  "RDNT/USDT": "radiant-capital",
  "GEIST/USDT": "geist-finance",

  // ── NFT Infrastructure ──
  "BLUR/USDT": "blur",
  "LOOKS/USDT": "looksrare",
  "X2Y2/USDT": "x2y2",
  "RARI/USDT": "rarible",
  "SUPER/USDT": "superfarm",
};

// Build default list from all mapped symbols
const DEFAULT_SYMBOLS = Object.keys(CG_ID_MAP);

/**
 * Live ticker hook — batches symbols into CoinGecko requests (50 per batch)
 * to avoid rate-limiting. Polls every `pollMs` (min 15s).
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
      const ids = symbols
        .map((s) => CG_ID_MAP[s])
        .filter(Boolean);

      if (ids.length === 0) return;

      // Deduplicate IDs
      const uniqueIds = [...new Set(ids)];
      
      // Batch into groups of 20 for CoinGecko free-tier limits
      const batches: string[][] = [];
      for (let i = 0; i < uniqueIds.length; i += 20) {
        batches.push(uniqueIds.slice(i, i + 20));
      }

      try {
        const allResults: Record<string, KrakenTickerQuote> = {};

        for (let b = 0; b < batches.length; b++) {
          if (cancelled || !mountedRef.current) return;
          if (b > 0) await new Promise(r => setTimeout(r, 1200)); // rate limit gap

          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${batches[b].join(",")}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
          );
          if (!res.ok) continue;
          const json = await res.json();

          for (const sym of symbols) {
            const cgId = CG_ID_MAP[sym];
            const d = cgId ? json[cgId] : null;
            if (d) {
              allResults[sym] = {
                symbol: sym,
                lastPrice: Number(d.usd) || 0,
                priceChangePercent: Number(d.usd_24h_change) || 0,
                volume: Number(d.usd_24h_vol) || 0,
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
        // Network error — keep previous data
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
