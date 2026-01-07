/**
 * WireFlux Energy Grid Management System
 * GridFlex AI for Sodium-Ion BESS Arbitrage
 * CATL Naxtra Integration
 */

export interface GridNode {
  id: string;
  mileMarker: number;
  gpsCoords: { lat: number; lng: number };
  solarCapacityMW: number;
  batteryStorageMWh: number;
  inductivePadKW: number;
  currentChargePercent: number;
  status: 'online' | 'maintenance' | 'offline';
  lastUpdate: number;
}

export interface EnergyPrice {
  timestamp: number;
  market: 'ERCOT' | 'CAISO' | 'PJM' | 'MISO';
  pricePerMWh: number;
  forecastNextHour: number;
}

export interface ArbitrageOpportunity {
  buyMarket: string;
  sellMarket: string;
  priceDifferential: number;
  estimatedProfit: number;
  windowDuration: number; // minutes
  riskScore: number;
}

export interface GridCommand {
  nodeId: string;
  action: 'CHARGE_FROM_SOLAR' | 'CHARGE_FROM_GRID' | 'SELL_TO_GRID' | 'POWER_WIRELESS_ROAD' | 'ISLAND_MODE';
  priority: number;
  timestamp: number;
  energyMWh?: number;
}

// Sodium-Ion Battery Specifications (CATL Naxtra)
export const SODIUM_ION_SPECS = {
  energyDensity: 175, // Wh/kg
  tempRangeMin: -40, // °C
  tempRangeMax: 70, // °C
  cycleLife: 3000, // cycles at 80% DoD
  costPerKWh: 19, // USD target
  roundTripEfficiency: 0.92, // 92%
  chargeRate: 2, // C-rate
  dischargeRate: 3, // C-rate
};

// WiTricity Inductive Charging Specs
export const INDUCTIVE_CHARGING_SPECS = {
  maxPowerKW: 300,
  efficiency: 0.93, // 93%
  airgapMm: 200,
  frequencyKHz: 85,
  standardCompliance: 'SAE J2954 / ISO 19363',
};

export class GridFlexAI {
  private nodes: Map<string, GridNode> = new Map();
  private priceHistory: EnergyPrice[] = [];
  private arbitrageTarget = 3.97; // $/kW-month target

  registerNode(node: GridNode): void {
    this.nodes.set(node.id, node);
  }

  updatePrices(prices: EnergyPrice[]): void {
    this.priceHistory = [...this.priceHistory, ...prices].slice(-1000);
  }

  // Core arbitrage decision algorithm
  calculateOptimalAction(
    node: GridNode,
    currentPrice: EnergyPrice
  ): GridCommand {
    const batteryLevel = node.currentChargePercent;
    const price = currentPrice.pricePerMWh;
    const forecast = currentPrice.forecastNextHour;

    // Decision tree based on battery level and price signals
    if (batteryLevel > 80 && price > 50) {
      // High charge + High price = SELL
      return {
        nodeId: node.id,
        action: 'SELL_TO_GRID',
        priority: 1,
        timestamp: Date.now(),
        energyMWh: node.batteryStorageMWh * (batteryLevel - 20) / 100
      };
    } else if (batteryLevel < 40 && price < 20) {
      // Low charge + Low price = BUY
      return {
        nodeId: node.id,
        action: 'CHARGE_FROM_GRID',
        priority: 2,
        timestamp: Date.now(),
        energyMWh: node.batteryStorageMWh * (80 - batteryLevel) / 100
      };
    } else if (batteryLevel < 60) {
      // Mid charge = Solar priority
      return {
        nodeId: node.id,
        action: 'CHARGE_FROM_SOLAR',
        priority: 3,
        timestamp: Date.now()
      };
    } else {
      // Default: Power the wireless road
      return {
        nodeId: node.id,
        action: 'POWER_WIRELESS_ROAD',
        priority: 4,
        timestamp: Date.now()
      };
    }
  }

  // Find arbitrage opportunities across markets
  findArbitrageOpportunities(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const markets = ['ERCOT', 'CAISO', 'PJM', 'MISO'];
    
    // Get latest prices per market
    const latestPrices: Record<string, number> = {};
    for (const market of markets) {
      const marketPrices = this.priceHistory
        .filter(p => p.market === market)
        .sort((a, b) => b.timestamp - a.timestamp);
      if (marketPrices.length > 0) {
        latestPrices[market] = marketPrices[0].pricePerMWh;
      }
    }

    // Find price differentials
    for (const buyMarket of markets) {
      for (const sellMarket of markets) {
        if (buyMarket === sellMarket) continue;
        
        const buyPrice = latestPrices[buyMarket] || 30;
        const sellPrice = latestPrices[sellMarket] || 30;
        const differential = sellPrice - buyPrice;

        if (differential > 10) { // Minimum $10/MWh spread
          opportunities.push({
            buyMarket,
            sellMarket,
            priceDifferential: differential,
            estimatedProfit: differential * SODIUM_ION_SPECS.roundTripEfficiency,
            windowDuration: 60, // Assume 1 hour window
            riskScore: Math.max(0, 1 - differential / 100)
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }

  // Emergency island mode - disconnect from grid
  activateIslandMode(nodeId: string, priorityLoads: string[]): GridCommand {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    console.log(`[ISLAND MODE] Node ${nodeId} disconnecting from grid`);
    console.log(`[ISLAND MODE] Priority loads: ${priorityLoads.join(', ')}`);

    return {
      nodeId,
      action: 'ISLAND_MODE',
      priority: 0, // Highest priority
      timestamp: Date.now()
    };
  }

  // Calculate revenue projection
  calculateMonthlyRevenue(node: GridNode): {
    solarRevenue: number;
    arbitrageRevenue: number;
    chargingRevenue: number;
    totalRevenue: number;
    grossMargin: number;
  } {
    // Assumptions
    const avgSolarCapacityFactor = 0.25; // 25% capacity factor
    const avgPricePerMWh = 45;
    const hoursPerMonth = 730;
    const chargingSessionsPerDay = 50;
    const avgSessionKWh = 75;
    const chargingPricePerKWh = 0.35;

    const solarGeneration = node.solarCapacityMW * avgSolarCapacityFactor * hoursPerMonth;
    const solarRevenue = solarGeneration * avgPricePerMWh;

    // Arbitrage: 2 cycles per day at $20/MWh spread
    const arbitrageCycles = 60;
    const arbitrageSpread = 20;
    const arbitrageRevenue = node.batteryStorageMWh * arbitrageCycles * arbitrageSpread * SODIUM_ION_SPECS.roundTripEfficiency;

    // Wireless charging
    const chargingSessions = chargingSessionsPerDay * 30;
    const chargingRevenue = chargingSessions * avgSessionKWh * chargingPricePerKWh;

    const totalRevenue = solarRevenue + arbitrageRevenue + chargingRevenue;

    // Operating costs (simplified)
    const operatingCosts = totalRevenue * 0.20; // 20% OpEx
    const grossMargin = (totalRevenue - operatingCosts) / totalRevenue;

    return {
      solarRevenue,
      arbitrageRevenue,
      chargingRevenue,
      totalRevenue,
      grossMargin
    };
  }

  // Get grid health status
  getGridHealth(): {
    totalNodes: number;
    onlineNodes: number;
    totalCapacityMWh: number;
    avgChargePercent: number;
    status: 'healthy' | 'degraded' | 'critical';
  } {
    const nodes = Array.from(this.nodes.values());
    const onlineNodes = nodes.filter(n => n.status === 'online');
    const totalCapacity = nodes.reduce((sum, n) => sum + n.batteryStorageMWh, 0);
    const avgCharge = nodes.reduce((sum, n) => sum + n.currentChargePercent, 0) / nodes.length || 0;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (onlineNodes.length < nodes.length * 0.9) status = 'degraded';
    if (onlineNodes.length < nodes.length * 0.7) status = 'critical';

    return {
      totalNodes: nodes.length,
      onlineNodes: onlineNodes.length,
      totalCapacityMWh: totalCapacity,
      avgChargePercent: avgCharge,
      status
    };
  }
}

// Generate mock grid nodes for the border corridor
export function generateBorderCorridorNodes(count: number = 100): GridNode[] {
  const nodes: GridNode[] = [];
  
  // US-Mexico border approximate coordinates
  const startLat = 32.7157;
  const startLng = -117.1611;
  const endLat = 25.9017;
  const endLng = -97.4975;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    nodes.push({
      id: `aegis-${i.toString().padStart(4, '0')}`,
      mileMarker: Math.floor(progress * 1954),
      gpsCoords: {
        lat: startLat + (endLat - startLat) * progress,
        lng: startLng + (endLng - startLng) * progress
      },
      solarCapacityMW: 1.5 + Math.random() * 0.5,
      batteryStorageMWh: 4.0 + Math.random() * 1.0,
      inductivePadKW: 300,
      currentChargePercent: 40 + Math.random() * 40,
      status: Math.random() > 0.05 ? 'online' : 'maintenance',
      lastUpdate: Date.now() - Math.floor(Math.random() * 60000)
    });
  }

  return nodes;
}

// Export singleton
export const gridFlexAI = new GridFlexAI();
