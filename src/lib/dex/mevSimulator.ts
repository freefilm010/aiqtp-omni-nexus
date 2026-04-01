/**
 * DEX + MEV Simulation Engine
 * Mempool ordering, gas auctions, front-running, sandwich attacks.
 */

export interface MempoolTx {
  id: string;
  sender: string;
  type: "swap" | "transfer" | "liquidity";
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  gasPrice: number; // gwei
  timestamp: number;
  slippageTolerance: number;
}

export interface MEVBundle {
  type: "frontrun" | "backrun" | "sandwich";
  botId: string;
  txs: MempoolTx[];
  expectedProfit: number;
  gasUsed: number;
}

// ── Mempool ─────────────────────────────────────────────────

export function sortMempool(txs: MempoolTx[]): MempoolTx[] {
  return [...txs].sort((a, b) => b.gasPrice - a.gasPrice);
}

export function estimateSwapImpact(amount: number, poolLiquidity: number): number {
  // Constant product AMM: Δy = y * Δx / (x + Δx)
  return amount / (poolLiquidity + amount);
}

// ── Front-Running ───────────────────────────────────────────

export function detectFrontrunOpportunity(
  tx: MempoolTx,
  poolLiquidity: number,
  minProfitUsd: number = 10
): MEVBundle | null {
  const victimImpact = estimateSwapImpact(tx.amountIn, poolLiquidity);
  if (victimImpact < 0.001) return null; // too small to exploit

  const frontAmount = tx.amountIn * 0.5;
  const frontImpact = estimateSwapImpact(frontAmount, poolLiquidity);
  const profit = frontAmount * victimImpact - frontAmount * frontImpact;

  if (profit < minProfitUsd) return null;

  const frontTx: MempoolTx = {
    id: `mev_front_${tx.id}`,
    sender: "MEV_BOT",
    type: "swap",
    tokenIn: tx.tokenIn,
    tokenOut: tx.tokenOut,
    amountIn: frontAmount,
    gasPrice: tx.gasPrice + 1,
    timestamp: tx.timestamp - 1,
    slippageTolerance: 0.5,
  };

  return {
    type: "frontrun",
    botId: "MEV_BOT",
    txs: [frontTx],
    expectedProfit: profit,
    gasUsed: tx.gasPrice + 1,
  };
}

// ── Sandwich Attack ─────────────────────────────────────────

export function buildSandwich(
  victimTx: MempoolTx,
  poolLiquidity: number
): MEVBundle | null {
  const victimImpact = estimateSwapImpact(victimTx.amountIn, poolLiquidity);
  if (victimImpact < 0.002) return null;

  const sandwichSize = victimTx.amountIn * 0.8;

  const frontTx: MempoolTx = {
    id: `sandwich_front_${victimTx.id}`,
    sender: "SANDWICH_BOT",
    type: "swap",
    tokenIn: victimTx.tokenIn,
    tokenOut: victimTx.tokenOut,
    amountIn: sandwichSize,
    gasPrice: victimTx.gasPrice + 2,
    timestamp: victimTx.timestamp - 1,
    slippageTolerance: 1,
  };

  const backTx: MempoolTx = {
    id: `sandwich_back_${victimTx.id}`,
    sender: "SANDWICH_BOT",
    type: "swap",
    tokenIn: victimTx.tokenOut,
    tokenOut: victimTx.tokenIn,
    amountIn: sandwichSize,
    gasPrice: victimTx.gasPrice - 1,
    timestamp: victimTx.timestamp + 1,
    slippageTolerance: 1,
  };

  const priceMovement = estimateSwapImpact(sandwichSize, poolLiquidity);
  const profit = sandwichSize * priceMovement * 0.5;

  return {
    type: "sandwich",
    botId: "SANDWICH_BOT",
    txs: [frontTx, victimTx, backTx],
    expectedProfit: profit,
    gasUsed: (victimTx.gasPrice + 2) * 2,
  };
}

// ── Gas Auction Simulator ───────────────────────────────────

export function simulateGasAuction(
  bundles: MEVBundle[],
  blockGasLimit: number = 30_000_000
): MEVBundle[] {
  // Sort by profit/gas efficiency
  const sorted = [...bundles].sort(
    (a, b) => b.expectedProfit / b.gasUsed - a.expectedProfit / a.gasUsed
  );

  const included: MEVBundle[] = [];
  let gasUsed = 0;

  for (const bundle of sorted) {
    if (gasUsed + bundle.gasUsed <= blockGasLimit) {
      included.push(bundle);
      gasUsed += bundle.gasUsed;
    }
  }

  return included;
}
