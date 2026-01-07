/**
 * Proxy Cluster Hunter - Automated Forensic Detection
 * Based on Bit-CHetG and DBSCAN clustering
 * For hunting stolen assets across blockchain networks
 */

export interface TransactionRecord {
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: number;
  blockNumber: number;
}

export interface ProxyCluster {
  clusterId: string;
  nodes: string[];
  totalVolume: number;
  firstSeen: number;
  lastSeen: number;
  riskScore: number;
  pattern: 'peel_chain' | 'mixer' | 'layering' | 'hopping' | 'unknown';
  connectedExchanges: string[];
}

export interface ForensicAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  involvedAddresses: string[];
  timestamp: number;
  actionRecommended: string;
}

export interface ClusterFingerprint {
  inDegree: number;
  outDegree: number;
  avgVolume: number;
  velocityScore: number;
  ageDays: number;
  mixerExposure: number;
}

// Transaction Graph for analysis
export class TransactionGraph {
  private adjacencyList: Map<string, Map<string, { amount: number; timestamp: number }[]>> = new Map();
  private nodeMetadata: Map<string, { firstSeen: number; lastSeen: number; totalIn: number; totalOut: number }> = new Map();

  addTransaction(tx: TransactionRecord): void {
    // Add to adjacency list
    if (!this.adjacencyList.has(tx.fromAddress)) {
      this.adjacencyList.set(tx.fromAddress, new Map());
    }
    const fromEdges = this.adjacencyList.get(tx.fromAddress)!;
    if (!fromEdges.has(tx.toAddress)) {
      fromEdges.set(tx.toAddress, []);
    }
    fromEdges.get(tx.toAddress)!.push({ amount: tx.amount, timestamp: tx.timestamp });

    // Update metadata
    this.updateNodeMetadata(tx.fromAddress, tx.timestamp, 0, tx.amount);
    this.updateNodeMetadata(tx.toAddress, tx.timestamp, tx.amount, 0);
  }

  private updateNodeMetadata(address: string, timestamp: number, inAmount: number, outAmount: number): void {
    const existing = this.nodeMetadata.get(address) || {
      firstSeen: timestamp,
      lastSeen: timestamp,
      totalIn: 0,
      totalOut: 0
    };
    existing.firstSeen = Math.min(existing.firstSeen, timestamp);
    existing.lastSeen = Math.max(existing.lastSeen, timestamp);
    existing.totalIn += inAmount;
    existing.totalOut += outAmount;
    this.nodeMetadata.set(address, existing);
  }

  getInDegree(address: string): number {
    let count = 0;
    for (const [_, edges] of this.adjacencyList) {
      if (edges.has(address)) count++;
    }
    return count;
  }

  getOutDegree(address: string): number {
    return this.adjacencyList.get(address)?.size || 0;
  }

  getOutEdges(address: string): Array<{ target: string; amount: number; timestamp: number }> {
    const edges: Array<{ target: string; amount: number; timestamp: number }> = [];
    const fromEdges = this.adjacencyList.get(address);
    if (fromEdges) {
      for (const [target, txs] of fromEdges) {
        for (const tx of txs) {
          edges.push({ target, amount: tx.amount, timestamp: tx.timestamp });
        }
      }
    }
    return edges;
  }

  getAllNodes(): string[] {
    const nodes = new Set<string>();
    for (const [from, edges] of this.adjacencyList) {
      nodes.add(from);
      for (const to of edges.keys()) {
        nodes.add(to);
      }
    }
    return Array.from(nodes);
  }

  getNodeMetadata(address: string) {
    return this.nodeMetadata.get(address);
  }
}

export class ProxyClusterHunter {
  private graph: TransactionGraph;
  private alerts: ForensicAlert[] = [];
  private knownMixers = new Set(['tornado.eth', 'blender.io', 'chipmixer.com']);
  private knownExchanges = new Set(['binance', 'coinbase', 'kraken', 'okx', 'bybit']);

  constructor() {
    this.graph = new TransactionGraph();
  }

  loadTransactions(transactions: TransactionRecord[]): void {
    for (const tx of transactions) {
      this.graph.addTransaction(tx);
    }
    console.log(`[HUNTER] Loaded ${transactions.length} transactions`);
  }

  // Detect Peel Chains - common laundering technique
  detectPeelChains(): string[] {
    const suspicious: string[] = [];
    const nodes = this.graph.getAllNodes();

    for (const node of nodes) {
      const outEdges = this.graph.getOutEdges(node);
      if (outEdges.length > 1) {
        const amounts = outEdges.map(e => e.amount);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const std = Math.sqrt(amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length);

        // High variance in outputs indicates peel chain
        if (std > mean * 0.8) {
          suspicious.push(node);
          this.createAlert('high', 'peel_chain', 
            `Peel chain pattern detected: ${outEdges.length} outputs with high variance`,
            [node], 'Flag for exchange notification');
        }
      }
    }

    return suspicious;
  }

  // DBSCAN-style clustering for proxy detection
  clusterProxies(eps: number = 0.5, minSamples: number = 2): ProxyCluster[] {
    const nodes = this.graph.getAllNodes();
    const fingerprints: Map<string, ClusterFingerprint> = new Map();

    // Calculate fingerprint for each node
    for (const node of nodes) {
      const meta = this.graph.getNodeMetadata(node);
      const inDeg = this.graph.getInDegree(node);
      const outDeg = this.graph.getOutDegree(node);
      
      fingerprints.set(node, {
        inDegree: inDeg,
        outDegree: outDeg,
        avgVolume: meta ? (meta.totalIn + meta.totalOut) / (inDeg + outDeg || 1) : 0,
        velocityScore: meta ? (inDeg + outDeg) / ((meta.lastSeen - meta.firstSeen) / 3600000 || 1) : 0,
        ageDays: meta ? (Date.now() - meta.firstSeen) / 86400000 : 0,
        mixerExposure: this.calculateMixerExposure(node)
      });
    }

    // Simple distance-based clustering
    const clusters: ProxyCluster[] = [];
    const visited = new Set<string>();
    let clusterId = 0;

    for (const node of nodes) {
      if (visited.has(node)) continue;
      
      const neighbors = this.findSimilarNodes(node, fingerprints, eps);
      if (neighbors.length >= minSamples) {
        const clusterNodes = [node, ...neighbors];
        clusterNodes.forEach(n => visited.add(n));

        const cluster = this.createCluster(clusterId++, clusterNodes, fingerprints);
        clusters.push(cluster);

        if (clusterNodes.length > 5) {
          this.createAlert('critical', 'proxy_network',
            `Large proxy cluster detected: ${clusterNodes.length} interconnected addresses`,
            clusterNodes, 'Immediate investigation required');
        }
      }
    }

    return clusters;
  }

  private findSimilarNodes(node: string, fingerprints: Map<string, ClusterFingerprint>, eps: number): string[] {
    const nodeFp = fingerprints.get(node)!;
    const similar: string[] = [];

    for (const [other, fp] of fingerprints) {
      if (other === node) continue;
      const distance = this.fingerprintDistance(nodeFp, fp);
      if (distance < eps) {
        similar.push(other);
      }
    }

    return similar;
  }

  private fingerprintDistance(a: ClusterFingerprint, b: ClusterFingerprint): number {
    // Normalized euclidean distance
    const maxVol = Math.max(a.avgVolume, b.avgVolume, 1);
    const maxVel = Math.max(a.velocityScore, b.velocityScore, 1);
    
    return Math.sqrt(
      ((a.inDegree - b.inDegree) / 10) ** 2 +
      ((a.outDegree - b.outDegree) / 10) ** 2 +
      ((a.avgVolume - b.avgVolume) / maxVol) ** 2 +
      ((a.velocityScore - b.velocityScore) / maxVel) ** 2
    );
  }

  private createCluster(id: number, nodes: string[], fingerprints: Map<string, ClusterFingerprint>): ProxyCluster {
    let totalVolume = 0;
    let firstSeen = Date.now();
    let lastSeen = 0;
    let maxMixerExposure = 0;

    for (const node of nodes) {
      const meta = this.graph.getNodeMetadata(node);
      const fp = fingerprints.get(node)!;
      if (meta) {
        totalVolume += meta.totalIn + meta.totalOut;
        firstSeen = Math.min(firstSeen, meta.firstSeen);
        lastSeen = Math.max(lastSeen, meta.lastSeen);
      }
      maxMixerExposure = Math.max(maxMixerExposure, fp.mixerExposure);
    }

    // Determine pattern type
    let pattern: ProxyCluster['pattern'] = 'unknown';
    if (maxMixerExposure > 0.5) pattern = 'mixer';
    else if (nodes.length > 10) pattern = 'layering';
    
    return {
      clusterId: `cluster-${id}`,
      nodes,
      totalVolume,
      firstSeen,
      lastSeen,
      riskScore: Math.min(1, (nodes.length / 20) + maxMixerExposure),
      pattern,
      connectedExchanges: []
    };
  }

  private calculateMixerExposure(node: string): number {
    // Check if node has transactions with known mixers
    const edges = this.graph.getOutEdges(node);
    let mixerTxs = 0;
    for (const edge of edges) {
      for (const mixer of this.knownMixers) {
        if (edge.target.toLowerCase().includes(mixer)) mixerTxs++;
      }
    }
    return edges.length > 0 ? mixerTxs / edges.length : 0;
  }

  private createAlert(severity: ForensicAlert['severity'], type: string, description: string, addresses: string[], action: string): void {
    this.alerts.push({
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      severity,
      type,
      description,
      involvedAddresses: addresses,
      timestamp: Date.now(),
      actionRecommended: action
    });
  }

  getAlerts(): ForensicAlert[] {
    return this.alerts;
  }

  // Taint Analysis - track stolen funds
  taintAnalysis(stolenAddress: string, maxHops: number = 5): Map<string, number> {
    const taintMap = new Map<string, number>();
    taintMap.set(stolenAddress, 1.0); // 100% tainted

    const queue: Array<{ address: string; taint: number; hop: number }> = [
      { address: stolenAddress, taint: 1.0, hop: 0 }
    ];

    while (queue.length > 0) {
      const { address, taint, hop } = queue.shift()!;
      if (hop >= maxHops) continue;

      const edges = this.graph.getOutEdges(address);
      if (edges.length === 0) continue;

      // Distribute taint proportionally
      const totalOut = edges.reduce((s, e) => s + e.amount, 0);
      for (const edge of edges) {
        const propagatedTaint = (taint * edge.amount) / totalOut * 0.9; // 10% decay
        if (propagatedTaint > 0.01) { // Minimum taint threshold
          const existingTaint = taintMap.get(edge.target) || 0;
          taintMap.set(edge.target, Math.max(existingTaint, propagatedTaint));
          queue.push({ address: edge.target, taint: propagatedTaint, hop: hop + 1 });
        }
      }
    }

    return taintMap;
  }

  // Generate quantum-ready fingerprint for IBM Q-MAC
  getQuantumFingerprint(cluster: ProxyCluster): number[] {
    return [
      cluster.nodes.length / 100,
      cluster.totalVolume / 1000000,
      cluster.riskScore,
      cluster.pattern === 'mixer' ? 1 : 0,
      cluster.pattern === 'layering' ? 1 : 0,
      cluster.pattern === 'peel_chain' ? 1 : 0,
      (cluster.lastSeen - cluster.firstSeen) / 86400000,
      cluster.connectedExchanges.length / 10
    ];
  }

  // Advanced chain analysis for stolen funds recovery
  traceChainHopping(originAddress: string, targetChains: string[] = ['ethereum', 'polygon', 'bsc']): Map<string, string[]> {
    const crossChainTraces = new Map<string, string[]>();
    
    for (const chain of targetChains) {
      // Simulate cross-chain detection
      const relatedAddresses: string[] = [];
      const edges = this.graph.getOutEdges(originAddress);
      
      for (const edge of edges) {
        // Check for bridge patterns
        if (edge.amount > 10000) {
          relatedAddresses.push(edge.target);
        }
      }
      
      if (relatedAddresses.length > 0) {
        crossChainTraces.set(chain, relatedAddresses);
        this.createAlert('high', 'chain_hopping',
          `Potential chain-hopping detected to ${chain}`,
          relatedAddresses, 'Monitor target chain for funds');
      }
    }
    
    return crossChainTraces;
  }

  // Common Input Ownership Heuristic (CIOH)
  applyCIOH(): Map<string, Set<string>> {
    const entityClusters = new Map<string, Set<string>>();
    let entityId = 0;
    
    // Find addresses used as inputs together
    const nodes = this.graph.getAllNodes();
    const processed = new Set<string>();
    
    for (const node of nodes) {
      if (processed.has(node)) continue;
      
      const outEdges = this.graph.getOutEdges(node);
      if (outEdges.length === 0) continue;
      
      // Find co-spent addresses
      const coSpenders = new Set<string>([node]);
      
      for (const edge of outEdges) {
        const incomingToSameTarget = this.getIncomingAddresses(edge.target);
        for (const addr of incomingToSameTarget) {
          if (!processed.has(addr)) {
            coSpenders.add(addr);
          }
        }
      }
      
      if (coSpenders.size > 1) {
        entityClusters.set(`entity-${entityId++}`, coSpenders);
        for (const addr of coSpenders) {
          processed.add(addr);
        }
      }
    }
    
    console.log(`[CIOH] Identified ${entityClusters.size} entities from ${nodes.length} addresses`);
    return entityClusters;
  }

  private getIncomingAddresses(target: string): string[] {
    const incoming: string[] = [];
    const nodes = this.graph.getAllNodes();
    
    for (const node of nodes) {
      const edges = this.graph.getOutEdges(node);
      if (edges.some(e => e.target === target)) {
        incoming.push(node);
      }
    }
    
    return incoming;
  }

  // Generate forensic report for legal proceedings
  generateForensicReport(targetAddress: string): {
    summary: string;
    riskAssessment: string;
    taintedFunds: Map<string, number>;
    relatedClusters: ProxyCluster[];
    recommendedActions: string[];
    timestamp: number;
  } {
    const taintMap = this.taintAnalysis(targetAddress);
    const clusters = this.clusterProxies();
    const peelChains = this.detectPeelChains();
    
    const relatedClusters = clusters.filter(c => 
      c.nodes.some(n => taintMap.has(n))
    );
    
    const isPeelChain = peelChains.includes(targetAddress);
    const maxTaint = Math.max(...Array.from(taintMap.values()));
    
    let riskLevel = 'LOW';
    if (maxTaint > 0.7) riskLevel = 'CRITICAL';
    else if (maxTaint > 0.4) riskLevel = 'HIGH';
    else if (maxTaint > 0.1) riskLevel = 'MEDIUM';
    
    return {
      summary: `Analysis of address ${targetAddress}: ${taintMap.size} connected addresses, ${relatedClusters.length} related clusters`,
      riskAssessment: riskLevel,
      taintedFunds: taintMap,
      relatedClusters,
      recommendedActions: [
        maxTaint > 0.5 ? 'FREEZE: Notify exchanges immediately' : 'MONITOR: Continue surveillance',
        isPeelChain ? 'ALERT: Peel chain detected - track all outputs' : 'Standard monitoring',
        relatedClusters.length > 0 ? 'EXPAND: Investigate related clusters' : 'No cluster expansion needed',
        'DOCUMENT: Preserve all evidence for legal proceedings'
      ],
      timestamp: Date.now()
    };
  }
}

// Export singleton
export const proxyHunter = new ProxyClusterHunter();
