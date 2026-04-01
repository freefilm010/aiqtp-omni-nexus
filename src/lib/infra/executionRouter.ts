/**
 * Execution Router — Unified trade execution abstraction.
 * Routes orders to simulation, paper, or live mode.
 */

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
}

let orderSeq = 0;

export class ExecutionRouter {
  mode: ExecutionMode;
  private feeRates: Record<ExecutionMode, number> = {
    simulation: 0.001,
    paper: 0.001,
    live: 0.0006,
  };

  constructor(mode: ExecutionMode = "simulation") {
    this.mode = mode;
  }

  execute(order: OrderRequest): FillResult {
    switch (this.mode) {
      case "simulation":
        return this.simulatedFill(order);
      case "paper":
        return this.paperFill(order);
      case "live":
        return this.liveFill(order);
    }
  }

  private simulatedFill(order: OrderRequest): FillResult {
    const slippagePct = (Math.random() - 0.3) * 0.002;
    const fillPrice = order.price * (1 + (order.side === "buy" ? slippagePct : -slippagePct));
    const fee = fillPrice * order.size * this.feeRates.simulation;

    return {
      orderId: `sim_${orderSeq++}`,
      filled: Math.random() > 0.05, // 95% fill rate
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
