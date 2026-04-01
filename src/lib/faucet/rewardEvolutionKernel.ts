/**
 * Self-Writing Reward Kernel
 * Agents evolve their own reward functions over time.
 * Extends the existing self-writing economy engine.
 */

import { RuleEngine, type EconomicRules } from "@/lib/selfwriting/selfWritingEconomy";

// ── Reward Function Genome ──────────────────────────────────

export interface RewardGenome {
  id: string;
  tradingPnlWeight: number;
  faucetIncomeWeight: number;
  riskPenaltyWeight: number;
  drawdownPenalty: number;
  streakBonus: number;
  diversificationBonus: number;
  contrarianism: number;
  fitness: number;
  generation: number;
  parentId: string | null;
}

export class RewardEvolutionKernel {
  private population: RewardGenome[] = [];
  private generation = 0;
  private maxPopulation: number;
  private mutationRate: number;
  private ruleEngine: RuleEngine;
  private history: { gen: number; avgFitness: number; bestFitness: number; bestGenome: string }[] = [];

  constructor(
    popSize = 20,
    mutationRate = 0.15,
    ruleEngine?: RuleEngine
  ) {
    this.maxPopulation = popSize;
    this.mutationRate = mutationRate;
    this.ruleEngine = ruleEngine || new RuleEngine({
      inflationSensitivity: 0.5,
      volatilityFeedback: 1.0,
      liquidityCreationRate: 0.3,
      panicAmplification: 1.0,
      meanReversionStrength: 0.5,
    });

    // Seed initial population
    for (let i = 0; i < popSize; i++) {
      this.population.push(this.randomGenome());
    }
  }

  private randomGenome(): RewardGenome {
    return {
      id: `rg_${this.generation}_${Math.random().toString(36).slice(2, 8)}`,
      tradingPnlWeight: 0.3 + Math.random() * 0.7,
      faucetIncomeWeight: Math.random() * 0.5,
      riskPenaltyWeight: 0.1 + Math.random() * 0.9,
      drawdownPenalty: Math.random() * 0.5,
      streakBonus: Math.random() * 0.3,
      diversificationBonus: Math.random() * 0.2,
      contrarianism: Math.random() * 0.4,
      fitness: 0,
      generation: this.generation,
      parentId: null,
    };
  }

  /** Compute reward using a specific genome */
  computeReward(
    genome: RewardGenome,
    tradingPnl: number,
    faucetIncome: number,
    riskExposure: number,
    drawdown: number = 0,
    streak: number = 0,
    diversification: number = 0
  ): number {
    return (
      genome.tradingPnlWeight * tradingPnl +
      genome.faucetIncomeWeight * faucetIncome -
      genome.riskPenaltyWeight * riskExposure -
      genome.drawdownPenalty * drawdown +
      genome.streakBonus * Math.log1p(streak) +
      genome.diversificationBonus * diversification -
      genome.contrarianism * Math.abs(tradingPnl) * 0.1
    );
  }

  /** Evaluate fitness of all genomes (simulate one generation) */
  evaluateGeneration(
    scenarios: Array<{
      tradingPnl: number;
      faucetIncome: number;
      riskExposure: number;
      drawdown: number;
    }>
  ): void {
    for (const genome of this.population) {
      let totalFitness = 0;
      for (const s of scenarios) {
        const reward = this.computeReward(
          genome, s.tradingPnl, s.faucetIncome, s.riskExposure, s.drawdown
        );
        // Fitness = cumulative reward with survival bias
        totalFitness += reward - Math.max(0, s.drawdown) * 2;
      }
      genome.fitness = totalFitness / scenarios.length;
    }

    // Sort by fitness
    this.population.sort((a, b) => b.fitness - a.fitness);

    // Record history
    const fitnesses = this.population.map(g => g.fitness);
    this.history.push({
      gen: this.generation,
      avgFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      bestFitness: fitnesses[0],
      bestGenome: this.population[0].id,
    });
  }

  /** Evolve to next generation via crossover + mutation */
  evolve(): RewardGenome[] {
    this.generation++;

    // Keep top 20% (elitism)
    const eliteCount = Math.ceil(this.maxPopulation * 0.2);
    const elites = this.population.slice(0, eliteCount);

    const newPop: RewardGenome[] = [...elites];

    // Fill rest via crossover + mutation
    while (newPop.length < this.maxPopulation) {
      const parent1 = elites[Math.floor(Math.random() * elites.length)];
      const parent2 = elites[Math.floor(Math.random() * elites.length)];
      const child = this.crossover(parent1, parent2);
      if (Math.random() < this.mutationRate) this.mutate(child);
      newPop.push(child);
    }

    this.population = newPop;

    // Also evolve economic rules based on best genome performance
    const bestFitness = this.population[0].fitness;
    this.ruleEngine.mutate(
      bestFitness < 0 ? 0.8 : 0.2,
      bestFitness
    );

    return [...this.population];
  }

  private crossover(a: RewardGenome, b: RewardGenome): RewardGenome {
    const pick = () => Math.random() > 0.5;
    return {
      id: `rg_${this.generation}_${Math.random().toString(36).slice(2, 8)}`,
      tradingPnlWeight: pick() ? a.tradingPnlWeight : b.tradingPnlWeight,
      faucetIncomeWeight: pick() ? a.faucetIncomeWeight : b.faucetIncomeWeight,
      riskPenaltyWeight: pick() ? a.riskPenaltyWeight : b.riskPenaltyWeight,
      drawdownPenalty: pick() ? a.drawdownPenalty : b.drawdownPenalty,
      streakBonus: pick() ? a.streakBonus : b.streakBonus,
      diversificationBonus: pick() ? a.diversificationBonus : b.diversificationBonus,
      contrarianism: pick() ? a.contrarianism : b.contrarianism,
      fitness: 0,
      generation: this.generation,
      parentId: a.id,
    };
  }

  private mutate(genome: RewardGenome): void {
    const keys: (keyof Pick<RewardGenome,
      "tradingPnlWeight" | "faucetIncomeWeight" | "riskPenaltyWeight" |
      "drawdownPenalty" | "streakBonus" | "diversificationBonus" | "contrarianism"
    >)[] = [
      "tradingPnlWeight", "faucetIncomeWeight", "riskPenaltyWeight",
      "drawdownPenalty", "streakBonus", "diversificationBonus", "contrarianism",
    ];
    const key = keys[Math.floor(Math.random() * keys.length)];
    genome[key] = Math.max(0, genome[key] + (Math.random() - 0.5) * 0.2);
  }

  /** Get the best performing reward function */
  getBestGenome(): RewardGenome {
    return this.population[0];
  }

  /** Get evolution stats */
  getStats() {
    return {
      generation: this.generation,
      populationSize: this.population.length,
      bestFitness: this.population[0]?.fitness || 0,
      avgFitness: this.population.reduce((s, g) => s + g.fitness, 0) / this.population.length,
      ruleDrift: this.ruleEngine.drift,
      currentRules: { ...this.ruleEngine.rules },
      history: this.history.slice(-50),
    };
  }

  getPopulation(): RewardGenome[] {
    return [...this.population];
  }
}

// ── Singleton ───────────────────────────────────────────────

let kernelInstance: RewardEvolutionKernel | null = null;

export function getRewardKernel(): RewardEvolutionKernel {
  if (!kernelInstance) {
    kernelInstance = new RewardEvolutionKernel(20, 0.15);
  }
  return kernelInstance;
}
