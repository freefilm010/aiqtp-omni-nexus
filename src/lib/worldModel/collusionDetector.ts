/**
 * Emergent Collusion Detector
 * Detects implicit coordination, shadow coalitions, and
 * reward synchronization patterns among agents.
 */

export interface CollusionAlert {
  clusterId: number;
  confidence: number;
  affectedAgents: string[];
  pattern: "reward_sync" | "action_mirroring" | "coordinated_timing" | "resource_hoarding";
  severity: "low" | "medium" | "high" | "critical";
  tick: number;
  evidence: string;
}

interface AgentTrace {
  agentId: string;
  actions: number[]; // recent action directions
  rewards: number[]; // recent rewards
  timestamps: number[]; // action timestamps
}

export class CollusionDetector {
  private traces: Map<string, AgentTrace> = new Map();
  private alerts: CollusionAlert[] = [];
  private tick = 0;
  private readonly windowSize = 30;

  /** Record an agent's action */
  recordAction(agentId: string, direction: number, reward: number): void {
    this.tick++;
    let trace = this.traces.get(agentId);
    if (!trace) {
      trace = { agentId, actions: [], rewards: [], timestamps: [] };
      this.traces.set(agentId, trace);
    }
    trace.actions.push(direction);
    trace.rewards.push(reward);
    trace.timestamps.push(this.tick);

    // Trim
    if (trace.actions.length > this.windowSize * 2) {
      trace.actions = trace.actions.slice(-this.windowSize);
      trace.rewards = trace.rewards.slice(-this.windowSize);
      trace.timestamps = trace.timestamps.slice(-this.windowSize);
    }

    // Run detection periodically
    if (this.tick % 10 === 0) this.detect();
  }

  /** Run all detection algorithms */
  private detect(): void {
    const agents = Array.from(this.traces.values()).filter(t => t.actions.length >= 10);
    if (agents.length < 2) return;

    this.detectRewardSync(agents);
    this.detectActionMirroring(agents);
    this.detectCoordinatedTiming(agents);
  }

  /** Detect agents whose rewards are suspiciously correlated */
  private detectRewardSync(agents: AgentTrace[]): void {
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const corr = this.pearsonCorrelation(
          agents[i].rewards.slice(-this.windowSize),
          agents[j].rewards.slice(-this.windowSize)
        );
        if (corr > 0.85) {
          this.addAlert({
            clusterId: i * 100 + j,
            confidence: corr,
            affectedAgents: [agents[i].agentId, agents[j].agentId],
            pattern: "reward_sync",
            severity: corr > 0.95 ? "critical" : "high",
            tick: this.tick,
            evidence: `Reward correlation: ${(corr * 100).toFixed(1)}% over ${this.windowSize} steps`,
          });
        }
      }
    }
  }

  /** Detect agents mirroring each other's actions */
  private detectActionMirroring(agents: AgentTrace[]): void {
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a1 = agents[i].actions.slice(-this.windowSize);
        const a2 = agents[j].actions.slice(-this.windowSize);
        const len = Math.min(a1.length, a2.length);
        if (len < 5) continue;

        let matches = 0;
        for (let k = 0; k < len; k++) {
          if (Math.sign(a1[k]) === Math.sign(a2[k])) matches++;
        }
        const mirrorRate = matches / len;

        if (mirrorRate > 0.8) {
          this.addAlert({
            clusterId: i * 100 + j,
            confidence: mirrorRate,
            affectedAgents: [agents[i].agentId, agents[j].agentId],
            pattern: "action_mirroring",
            severity: mirrorRate > 0.9 ? "high" : "medium",
            tick: this.tick,
            evidence: `Action direction match: ${(mirrorRate * 100).toFixed(0)}% over ${len} steps`,
          });
        }
      }
    }
  }

  /** Detect suspiciously synchronized timing */
  private detectCoordinatedTiming(agents: AgentTrace[]): void {
    // Check if multiple agents act within very tight windows
    const recentWindow = 5;
    const recentAgents = agents.filter(a => {
      const lastTs = a.timestamps[a.timestamps.length - 1] ?? 0;
      return this.tick - lastTs < recentWindow;
    });

    if (recentAgents.length > agents.length * 0.7 && agents.length >= 3) {
      this.addAlert({
        clusterId: this.tick,
        confidence: recentAgents.length / agents.length,
        affectedAgents: recentAgents.map(a => a.agentId),
        pattern: "coordinated_timing",
        severity: "medium",
        tick: this.tick,
        evidence: `${recentAgents.length}/${agents.length} agents acted within ${recentWindow} ticks`,
      });
    }
  }

  private addAlert(alert: CollusionAlert): void {
    // Deduplicate: don't add if same cluster + pattern within 20 ticks
    const exists = this.alerts.find(
      a => a.clusterId === alert.clusterId && a.pattern === alert.pattern && this.tick - a.tick < 20
    );
    if (exists) return;

    this.alerts.push(alert);
    if (this.alerts.length > 200) this.alerts = this.alerts.slice(-100);
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 3) return 0;
    const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  }

  /** Get recent alerts */
  getAlerts(limit = 20): CollusionAlert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /** Get summary stats */
  getSummary(): {
    totalAlerts: number;
    criticalCount: number;
    trackedAgents: number;
    patterns: Record<string, number>;
  } {
    const recent = this.alerts.slice(-50);
    const patterns: Record<string, number> = {};
    recent.forEach(a => { patterns[a.pattern] = (patterns[a.pattern] ?? 0) + 1; });
    return {
      totalAlerts: this.alerts.length,
      criticalCount: recent.filter(a => a.severity === "critical").length,
      trackedAgents: this.traces.size,
      patterns,
    };
  }
}
