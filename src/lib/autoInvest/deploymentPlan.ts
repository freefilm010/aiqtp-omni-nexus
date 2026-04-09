export interface EngineDeploymentConfig {
  strategy?: string | null;
  growthTargetPercent?: number | null;
  stableTargetPercent?: number | null;
}

export interface DeploymentSlice {
  key: string;
  name: string;
  allocationType: "growth" | "stable";
  pct: number;
}

const DEFAULT_GROWTH_SLICES = [
  { key: "momentum-alpha", name: "AI Momentum Alpha", weight: 50 },
  { key: "mean-reversion", name: "Quantum Mean Reversion", weight: 30 },
  { key: "yield-optimizer", name: "DeFi Yield Optimizer", weight: 20 },
] as const;

const STRATEGY_LABELS: Record<string, string> = {
  ultra_aggressive: "Ultra-Aggressive",
  growth: "Growth",
  balanced: "Balanced",
  capital_preservation: "Capital Preservation",
};

const STABLE_RESERVE_NAMES: Record<string, string> = {
  ultra_aggressive: "Stable Reserve Buffer",
  growth: "Stability Buffer",
  balanced: "Capital Defense",
  capital_preservation: "Capital Shield",
};

const DEFAULT_GROWTH_TARGET = 95;
const DEFAULT_STABLE_TARGET = 5;

const clampPercent = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, value));
};

const humanizeStrategyCode = (strategy?: string | null) => {
  if (!strategy) return "Adaptive";

  return strategy
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatEngineStrategy = (strategy?: string | null) => {
  if (!strategy) return "Adaptive";
  return STRATEGY_LABELS[strategy] ?? humanizeStrategyCode(strategy);
};

export const getEngineTargetMix = (config: EngineDeploymentConfig) => {
  const growth = clampPercent(Number(config.growthTargetPercent), DEFAULT_GROWTH_TARGET);
  const stable = clampPercent(
    Number(config.stableTargetPercent),
    Math.max(0, 100 - growth) || DEFAULT_STABLE_TARGET
  );

  const total = growth + stable;

  if (total <= 0) {
    return {
      growth: DEFAULT_GROWTH_TARGET,
      stable: DEFAULT_STABLE_TARGET,
    };
  }

  const normalizedGrowth = Number(((growth / total) * 100).toFixed(2));

  return {
    growth: normalizedGrowth,
    stable: Number((100 - normalizedGrowth).toFixed(2)),
  };
};

export const formatEngineMix = (config: EngineDeploymentConfig) => {
  const mix = getEngineTargetMix(config);
  return `${mix.growth}% growth / ${mix.stable}% stable`;
};

export const buildEngineDeploymentPlan = (config: EngineDeploymentConfig): DeploymentSlice[] => {
  const mix = getEngineTargetMix(config);
  const totalGrowthWeight = DEFAULT_GROWTH_SLICES.reduce((sum, slice) => sum + slice.weight, 0);

  const slices: DeploymentSlice[] = DEFAULT_GROWTH_SLICES.map((slice) => ({
    key: slice.key,
    name: slice.name,
    allocationType: "growth",
    pct: Number(((mix.growth * slice.weight) / totalGrowthWeight).toFixed(2)),
  }));

  if (mix.stable > 0) {
    slices.push({
      key: "stable-reserve",
      name: STABLE_RESERVE_NAMES[config.strategy ?? ""] ?? "Stable Reserve",
      allocationType: "stable",
      pct: Number(mix.stable.toFixed(2)),
    });
  }

  const totalPct = slices.reduce((sum, slice) => sum + slice.pct, 0);
  const roundingDiff = Number((100 - totalPct).toFixed(2));

  if (slices.length > 0 && Math.abs(roundingDiff) >= 0.01) {
    const lastSlice = slices[slices.length - 1];
    lastSlice.pct = Number((lastSlice.pct + roundingDiff).toFixed(2));
  }

  return slices.filter((slice) => slice.pct > 0);
};