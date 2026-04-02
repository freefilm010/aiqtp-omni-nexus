/**
 * Regime Latent Space
 * Discovers emergent market regimes from latent state trajectories
 * using density-based clustering (simplified HDBSCAN-style).
 * Regimes are NOT predefined — they emerge from the data.
 */

export interface RegimeCluster {
  id: number;
  label: string;
  centroid: number[];
  memberCount: number;
  avgVolatility: number;
  avgFaucetDependency: number;
  firstSeen: number;
  lastSeen: number;
}

export interface RegimeDetection {
  currentRegime: number;
  regimeLabel: string;
  confidence: number;
  transitionProbability: number; // probability of regime change
  regimeHistory: { regime: number; tick: number }[];
  clusters: RegimeCluster[];
}

export class RegimeLatentSpace {
  private stateBuffer: { z: number[]; tick: number }[] = [];
  private clusters: RegimeCluster[] = [];
  private regimeHistory: { regime: number; tick: number }[] = [];
  private currentRegime = -1;
  private readonly maxBuffer = 500;
  private readonly minClusterSize = 5;

  /** Add a new latent state observation */
  observe(z: number[], tick: number): void {
    this.stateBuffer.push({ z, tick });
    if (this.stateBuffer.length > this.maxBuffer) {
      this.stateBuffer = this.stateBuffer.slice(-this.maxBuffer);
    }

    // Re-cluster periodically
    if (this.stateBuffer.length % 10 === 0 && this.stateBuffer.length >= 20) {
      this.recluster();
    }

    // Assign current state to nearest cluster
    if (this.clusters.length > 0) {
      const nearest = this.findNearestCluster(z);
      if (nearest !== this.currentRegime) {
        this.currentRegime = nearest;
      }
      this.regimeHistory.push({ regime: nearest, tick });
      if (this.regimeHistory.length > 1000) {
        this.regimeHistory = this.regimeHistory.slice(-500);
      }
    }
  }

  /** Simple k-means clustering with automatic k selection */
  private recluster(): void {
    const points = this.stateBuffer.map(s => s.z);
    if (points.length < 20) return;

    // Try k = 2..6, pick best silhouette
    let bestK = 2;
    let bestScore = -Infinity;
    let bestCentroids: number[][] = [];
    let bestAssignments: number[] = [];

    for (let k = 2; k <= Math.min(6, Math.floor(points.length / this.minClusterSize)); k++) {
      const { centroids, assignments, score } = this.kmeans(points, k);
      if (score > bestScore) {
        bestScore = score;
        bestK = k;
        bestCentroids = centroids;
        bestAssignments = assignments;
      }
    }

    // Build cluster metadata
    this.clusters = bestCentroids.map((centroid, id) => {
      const members = this.stateBuffer.filter((_, i) => bestAssignments[i] === id);
      const memberZs = members.map(m => m.z);

      // Derive regime characteristics from latent dimensions
      // dim 0 ≈ return signal, dim 4 ≈ volatility, dim 2 ≈ faucet rate
      const avgVol = memberZs.length > 0
        ? memberZs.reduce((s, z) => s + Math.abs(z[4] ?? 0), 0) / memberZs.length
        : 0;
      const avgFaucet = memberZs.length > 0
        ? memberZs.reduce((s, z) => s + (z[2] ?? 0), 0) / memberZs.length
        : 0;

      return {
        id,
        label: this.autoLabel(centroid, avgVol, avgFaucet),
        centroid,
        memberCount: members.length,
        avgVolatility: avgVol,
        avgFaucetDependency: Math.abs(avgFaucet),
        firstSeen: members[0]?.tick ?? 0,
        lastSeen: members[members.length - 1]?.tick ?? 0,
      };
    });
  }

  /** Auto-generate regime labels based on latent characteristics */
  private autoLabel(centroid: number[], vol: number, faucet: number): string {
    const returnSignal = centroid[0] ?? 0;
    const riskSignal = centroid[7] ?? 0;

    if (vol > 0.6 && riskSignal > 0.3) return "🌪 Crisis";
    if (returnSignal > 0.3 && vol < 0.3) return "🟢 Bull";
    if (returnSignal < -0.3 && vol < 0.4) return "🔴 Bear";
    if (faucet > 0.4) return "💧 Faucet Saturation";
    if (vol < 0.15) return "😴 Low Vol";
    if (Math.abs(returnSignal) < 0.1) return "➡️ Sideways";
    return `⚡ Regime-${Math.floor(Math.random() * 100)}`;
  }

  /** Simple k-means implementation */
  private kmeans(points: number[][], k: number, maxIter = 30) {
    const dim = points[0]?.length ?? 0;
    // Init centroids via k-means++
    const centroids: number[][] = [points[Math.floor(Math.random() * points.length)]];
    while (centroids.length < k) {
      const dists = points.map(p => {
        const minDist = Math.min(...centroids.map(c => this.euclidean(p, c)));
        return minDist * minDist;
      });
      const totalDist = dists.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalDist;
      for (let i = 0; i < points.length; i++) {
        r -= dists[i];
        if (r <= 0) { centroids.push([...points[i]]); break; }
      }
    }

    let assignments = new Array(points.length).fill(0);

    for (let iter = 0; iter < maxIter; iter++) {
      // Assign
      assignments = points.map(p => {
        let minDist = Infinity;
        let best = 0;
        centroids.forEach((c, i) => {
          const d = this.euclidean(p, c);
          if (d < minDist) { minDist = d; best = i; }
        });
        return best;
      });

      // Update centroids
      for (let c = 0; c < k; c++) {
        const members = points.filter((_, i) => assignments[i] === c);
        if (members.length === 0) continue;
        for (let d = 0; d < dim; d++) {
          centroids[c][d] = members.reduce((s, m) => s + (m[d] ?? 0), 0) / members.length;
        }
      }
    }

    // Simplified silhouette score
    const score = this.silhouetteScore(points, assignments, centroids);
    return { centroids, assignments, score };
  }

  private euclidean(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = (a[i] ?? 0) - (b[i] ?? 0);
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  private silhouetteScore(points: number[][], assignments: number[], centroids: number[][]): number {
    if (points.length < 3) return 0;
    const k = centroids.length;
    let totalScore = 0;
    const sampleSize = Math.min(50, points.length);
    const indices = Array.from({ length: points.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, sampleSize);

    for (const i of indices) {
      const cluster = assignments[i];
      const sameCluster = points.filter((_, j) => assignments[j] === cluster && j !== i);
      const a = sameCluster.length > 0
        ? sameCluster.reduce((s, p) => s + this.euclidean(points[i], p), 0) / sameCluster.length
        : 0;

      let minB = Infinity;
      for (let c = 0; c < k; c++) {
        if (c === cluster) continue;
        const otherCluster = points.filter((_, j) => assignments[j] === c);
        if (otherCluster.length === 0) continue;
        const b = otherCluster.reduce((s, p) => s + this.euclidean(points[i], p), 0) / otherCluster.length;
        minB = Math.min(minB, b);
      }

      if (minB === Infinity) continue;
      totalScore += (minB - a) / Math.max(a, minB);
    }

    return totalScore / indices.length;
  }

  private findNearestCluster(z: number[]): number {
    let minDist = Infinity;
    let nearest = 0;
    this.clusters.forEach((c, i) => {
      const d = this.euclidean(z, c.centroid);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    return nearest;
  }

  /** Get current regime detection results */
  detect(): RegimeDetection {
    const recent = this.regimeHistory.slice(-20);
    const transitions = recent.filter((r, i) => i > 0 && r.regime !== recent[i - 1].regime).length;
    const transitionProb = recent.length > 1 ? transitions / (recent.length - 1) : 0;

    return {
      currentRegime: this.currentRegime,
      regimeLabel: this.clusters[this.currentRegime]?.label ?? "Unknown",
      confidence: this.clusters.length > 0 ? Math.max(0.3, 1 - transitionProb) : 0,
      transitionProbability: transitionProb,
      regimeHistory: this.regimeHistory.slice(-100),
      clusters: this.clusters,
    };
  }
}
