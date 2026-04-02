/**
 * Execution Router — Unified trade execution abstraction.
 * Routes orders to simulation, paper, or live mode.
 * Integrates 200-trade checkpoint for stale/stuck position audits.
 */

import { TradeCheckpointSystem, type PositionSnapshot } from "./tradeCheckpoint";

export type ExecutionMode = "simulation" | "paper" | "live";

export interface OrderRequest {
  agentId: string;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  type: "market" | "limit";
}

export interface FillResult {
  orderId: string;
  filled: boolean;
  fillPrice: number;
  fillSize: number;
  slippage: number;
  fee: number;
  mode: ExecutionMode;
  timestamp: number;
  checkpointTriggered?: boolean;
}

let orderSeq = 0;

export class ExecutionRouter {
  mode: ExecutionMode;
  readonly checkpoint: TradeCheckpointSystem;

  private feeRates: Record<ExecutionMode, number> = {
    simulation: 0.001,
    paper: 0.001,
    live: 0.0006,
  };

  constructor(mode: ExecutionMode = "simulation") {
    this.mode = mode;
    this.checkpoint = new TradeCheckpointSystem({ tradeInterval: 200 });
  }

  execute(order: OrderRequest): FillResult {
    // Block execution if checkpoint audit is pending
    if (this.checkpoint.paused) {
      return {
        orderId: `blocked_${orderSeq++}`,
        filled: false,
        fillPrice: 0,
        fillSize: 0,
        slippage: 0,
        fee: 0,
        mode: this.mode,
        timestamp: Date.now(),
        checkpointTriggered: true,
      };
    }

    let result: FillResult;
    switch (this.mode) {
      case "simulation":
        result = this.simulatedFill(order);
        break;
      case "paper":
        result = this.paperFill(order);
        break;
      case "live":
        result = this.liveFill(order);
        break;
    }

    // Record trade and check if checkpoint triggered
    if (result.filled) {
      const triggered = this.checkpoint.recordTrade(order.symbol, result.fillPrice);
      result.checkpointTriggered = triggered;
      if (triggered) {
        console.log(`[ExecutionRouter] 🔄 Checkpoint triggered after ${this.checkpoint.stats.lifetimeTradeCount} lifetime trades — pausing for audit`);
      }
    }

    return result;
  }

  /** Run checkpoint audit with current positions, resume if passed */
  auditAndResume(positions: PositionSnapshot[], forceResume = false) {
    const audit = this.checkpoint.runAudit(positions);
    console.log(`[ExecutionRouter] ${audit.summary}`);

    if (audit.passed || forceResume) {
      this.checkpoint.resume(forceResume);
    }

    return audit;
  }

  private simulatedFill(order: OrderRequest): FillResult {
    const slippagePct = (Math.random() - 0.3) * 0.002;
    const fillPrice = order.price * (1 + (order.side === "buy" ? slippagePct : -slippagePct));
    const fee = fillPrice * order.size * this.feeRates.simulation;

    return {
      orderId: `sim_${orderSeq++}`,
      filled: Math.random() > 0.05,
      fillPrice: +fillPrice.toFixed(6),
      fillSize: order.size,
      slippage: +(fillPrice - order.price).toFixed(6),
      fee: +fee.toFixed(6),
      mode: "simulation",
      timestamp: Date.now(),
    };
  }

  private paperFill(order: OrderRequest): FillResult {
    return {
      orderId: `paper_${orderSeq++}`,
      filled: true,
      fillPrice: order.price,
      fillSize: order.size,
      slippage: 0,
      fee: order.price * order.size * this.feeRates.paper,
      mode: "paper",
      timestamp: Date.now(),
    };
  }

  private liveFill(_order: OrderRequest): FillResult {
    throw new Error(
      "LIVE TRADING IS NOT ENABLED. Configure exchange credentials and set ENABLE_LIVE_TRADING=true."
    );
  }
}
