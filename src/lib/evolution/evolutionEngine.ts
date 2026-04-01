/**
 * Evolutionary Strategy Engine
 * Genetic algorithm for strategy parameter optimization.
 */

export interface StrategyGenome {
  id: string;
  generation: number;
  aggressiveness: number;   // 0-1
  riskTolerance: number;    // 0-1
  momentumBias: number;     // -1 to 1
  meanReversionBias: number; // 0-1
  holdingPeriod: number;    // ticks
  fitness: number;
}

export interface EvolutionConfig {
  populationSize: number;
  mutationRate: number;
  mutationMagnitude: number;
  eliteRatio: number;       // top % kept unchanged
  crossoverRate: number;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  populationSize: 50,
  mutationRate: 0.3,
  mutationMagnitude: 0.15,
  eliteRatio: 0.1,
  crossoverRate: 0.7,
};

let genomeSeq = 0;

function randomGenome(generation: number): StrategyGenome {
  return {
    id: `gen${generation}_${genomeSeq++}`,
    generation,
    aggressiveness: Math.random(),
    riskTolerance: Math.random(),
    momentumBias: (Math.random() - 0.5) * 2,
    meanReversionBias: Math.random(),
    holdingPeriod: Math.floor(1 + Math.random() * 20),
    fitness: 0,
  };
}

export class EvolutionEngine {
  population: StrategyGenome[];
  generation = 0;
  private config: EvolutionConfig;

  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.population = Array.from({ length: this.config.populationSize }, () =>
      randomGenome(0)
    );
  }

  /** Assign fitness scores from external evaluation. */
  evaluate(fitnessMap: Record<string, number>): void {
    for (const genome of this.population) {
      genome.fitness = fitnessMap[genome.id] ?? 0;
    }
  }

  /** Run one generation: select → crossover → mutate. */
  evolve(): StrategyGenome[] {
    this.generation++;

    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
    const eliteCount = Math.max(1, Math.floor(this.config.eliteRatio * sorted.length));
    const elite = sorted.slice(0, eliteCount);

    const nextGen: StrategyGenome[] = elite.map((g) => ({ ...g, generation: this.generation }));

    while (nextGen.length < this.config.populationSize) {
      const parentA = this.tournamentSelect(sorted);
      const parentB = this.tournamentSelect(sorted);

      let child: StrategyGenome;
      if (Math.random() < this.config.crossoverRate) {
        child = this.crossover(parentA, parentB);
      } else {
        child = { ...parentA, id: `gen${this.generation}_${genomeSeq++}`, generation: this.generation, fitness: 0 };
      }

      if (Math.random() < this.config.mutationRate) {
        child = this.mutate(child);
      }

      nextGen.push(child);
    }

    this.population = nextGen;
    return this.population;
  }

  private tournamentSelect(sorted: StrategyGenome[]): StrategyGenome {
    const k = 3;
    const candidates = Array.from({ length: k }, () =>
      sorted[Math.floor(Math.random() * sorted.length)]
    );
    return candidates.reduce((best, c) => (c.fitness > best.fitness ? c : best));
  }

  private crossover(a: StrategyGenome, b: StrategyGenome): StrategyGenome {
    return {
      id: `gen${this.generation}_${genomeSeq++}`,
      generation: this.generation,
      aggressiveness: Math.random() > 0.5 ? a.aggressiveness : b.aggressiveness,
      riskTolerance: (a.riskTolerance + b.riskTolerance) / 2,
      momentumBias: Math.random() > 0.5 ? a.momentumBias : b.momentumBias,
      meanReversionBias: (a.meanReversionBias + b.meanReversionBias) / 2,
      holdingPeriod: Math.random() > 0.5 ? a.holdingPeriod : b.holdingPeriod,
      fitness: 0,
    };
  }

  private mutate(g: StrategyGenome): StrategyGenome {
    const m = this.config.mutationMagnitude;
    const jitter = () => (Math.random() - 0.5) * 2 * m;
    return {
      ...g,
      aggressiveness: clamp(g.aggressiveness + jitter(), 0, 1),
      riskTolerance: clamp(g.riskTolerance + jitter(), 0, 1),
      momentumBias: clamp(g.momentumBias + jitter(), -1, 1),
      meanReversionBias: clamp(g.meanReversionBias + jitter(), 0, 1),
      holdingPeriod: Math.max(1, g.holdingPeriod + Math.round(jitter() * 5)),
    };
  }

  get stats() {
    const fitnesses = this.population.map((g) => g.fitness);
    return {
      generation: this.generation,
      populationSize: this.population.length,
      bestFitness: Math.max(...fitnesses),
      avgFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      worstFitness: Math.min(...fitnesses),
    };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
