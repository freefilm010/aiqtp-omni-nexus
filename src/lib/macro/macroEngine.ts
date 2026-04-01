/**
 * Global Macro Simulation Engine
 * Interest rates, inflation, liquidity cycles, and regime detection.
 */

export interface MacroState {
  interestRate: number;
  inflation: number;
  liquidity: number;
  growth: number;
  unemployment: number;
  riskRegime: "risk_on" | "risk_off" | "crisis";
  tick: number;
}

export interface MacroImpact {
  equityMultiplier: number;
  bondMultiplier: number;
  cryptoMultiplier: number;
  commodityMultiplier: number;
  volatilityMultiplier: number;
}

export class MacroEngine {
  state: MacroState;

  constructor(initial?: Partial<MacroState>) {
    this.state = {
      interestRate: 0.05,
      inflation: 0.025,
      liquidity: 1.0,
      growth: 0.02,
      unemployment: 0.04,
      riskRegime: "risk_on",
      tick: 0,
      ...initial,
    };
  }

  step(): MacroState {
    const s = this.state;
    const noise = () => (Math.random() - 0.5) * 0.005;

    // Phillips curve: low unemployment → higher inflation
    s.inflation += (0.05 - s.unemployment) * 0.02 + noise();
    s.inflation = Math.max(-0.02, Math.min(0.15, s.inflation));

    // Taylor rule: central bank reacts
    const neutralRate = 0.02 + s.inflation * 1.5 + (s.growth - 0.02) * 0.5;
    s.interestRate += (neutralRate - s.interestRate) * 0.1;
    s.interestRate = Math.max(0, Math.min(0.2, s.interestRate));

    // Liquidity inversely related to rates
    s.liquidity += (0.05 - s.interestRate) * 0.5 + noise() * 2;
    s.liquidity = Math.max(0.1, Math.min(2.0, s.liquidity));

    // Growth cycle
    s.growth += noise() * 2 + (s.liquidity - 1) * 0.01 - s.interestRate * 0.05;
    s.growth = Math.max(-0.1, Math.min(0.1, s.growth));

    // Unemployment (Okun's law)
    s.unemployment += -s.growth * 0.4 + noise();
    s.unemployment = Math.max(0.02, Math.min(0.15, s.unemployment));

    // Regime detection
    if (s.growth < -0.02 && s.liquidity < 0.5) {
      s.riskRegime = "crisis";
    } else if (s.liquidity > 0.8 && s.growth > 0) {
      s.riskRegime = "risk_on";
    } else {
      s.riskRegime = "risk_off";
    }

    s.tick++;
    return { ...s };
  }

  impact(): MacroImpact {
    const s = this.state;
    const crisisMultiplier = s.riskRegime === "crisis" ? 0.85 : 1;

    return {
      equityMultiplier: (1 + s.growth) * (s.liquidity > 1 ? 1.02 : 0.98) * crisisMultiplier,
      bondMultiplier: 1 - s.interestRate * 0.5,
      cryptoMultiplier: (s.liquidity > 1 ? 1.05 : 0.92) * crisisMultiplier,
      commodityMultiplier: 1 + s.inflation * 2,
      volatilityMultiplier: s.riskRegime === "crisis" ? 2.5 : s.riskRegime === "risk_off" ? 1.5 : 1.0,
    };
  }
}
