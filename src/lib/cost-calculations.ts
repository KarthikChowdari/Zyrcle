// Cost calculation utilities for LCA pathway optimization
// This module calculates additional costs for achieving configured pathways
// and provides cost per CO2e saved metrics

export interface CostFactors {
  // Base costs per unit for different improvements
  recycledContentPremium: number; // Rs per kg per % increase
  gridTransitionCost: number; // Rs per kWh per g CO2 reduction
  transportOptimization: number; // Rs per km reduction
  energyEfficiencyUpgrade: number; // Rs per kWh reduction per kg
  recyclingInfrastructure: number; // Rs per % increase in recycling rate
  waterTreatmentUpgrade: number; // Rs per L reduction per kg
  wasteReductionTechnology: number; // Rs per kg waste reduction per kg product
}

export interface PathwayCosts {
  recycledContentCost: number;
  gridTransitionCost: number;
  transportOptimizationCost: number;
  energyEfficiencyCost: number;
  recyclingInfrastructureCost: number;
  waterTreatmentCost: number;
  wasteReductionCost: number;
  totalAdditionalCost: number;
  costPerKgCO2eSaved: number;
  costPerTonneCO2eSaved: number;
}

export interface ProjectConfig {
  recycledContent: number;
  gridEmissions: number;
  transportDistance: number;
  recyclingRate: number;
  energyConsumption: number;
  smeltingEnergy: number;
  waterUsage: number;
  wasteGeneration: number;
}

export interface LcaResult {
  totalGwp: number;
  gwpBreakdown: {
    materialProduction: number;
    transport: number;
    gridEnergy: number;
    environmental?: number;
  };
  totalEnergy: number;
  circularityScore: number;
}

// Default cost factors based on industry data and market research
// These are approximate values in Indian Rupees (Rs)
export const DEFAULT_COST_FACTORS: CostFactors = {
  recycledContentPremium: 2.5, // Rs 2.5 per kg per % increase in recycled content
  gridTransitionCost: 0.003, // Rs 0.003 per kWh per g CO2 reduction (renewable energy premium)
  transportOptimization: 0.8, // Rs 0.8 per km reduction (logistics optimization)
  energyEfficiencyUpgrade: 15, // Rs 15 per kWh reduction per kg (equipment upgrade)
  recyclingInfrastructure: 50, // Rs 50 per % increase in recycling rate (infrastructure investment)
  waterTreatmentUpgrade: 25, // Rs 25 per L reduction per kg (water treatment systems)
  wasteReductionTechnology: 200, // Rs 200 per kg waste reduction per kg product (process optimization)
};

/**
 * Calculates the additional cost required to achieve a configured pathway
 * compared to a baseline configuration
 */
export function calculatePathwayCosts(
  baselineConfig: ProjectConfig,
  configuredConfig: ProjectConfig,
  baselineResult: LcaResult | null,
  configuredResult: LcaResult | null,
  costFactors: CostFactors = DEFAULT_COST_FACTORS,
  productionVolume: number = 1000 // kg per year
): PathwayCosts {
  const costs: PathwayCosts = {
    recycledContentCost: 0,
    gridTransitionCost: 0,
    transportOptimizationCost: 0,
    energyEfficiencyCost: 0,
    recyclingInfrastructureCost: 0,
    waterTreatmentCost: 0,
    wasteReductionCost: 0,
    totalAdditionalCost: 0,
    costPerKgCO2eSaved: 0,
    costPerTonneCO2eSaved: 0,
  };

  // Calculate individual cost components
  
  // 1. Recycled content increase cost
  const recycledContentIncrease = Math.max(0, configuredConfig.recycledContent - baselineConfig.recycledContent);
  costs.recycledContentCost = recycledContentIncrease * costFactors.recycledContentPremium * productionVolume;

  // 2. Grid transition cost (cleaner energy)
  const gridEmissionReduction = Math.max(0, baselineConfig.gridEmissions - configuredConfig.gridEmissions);
  const totalEnergyUse = configuredConfig.energyConsumption + configuredConfig.smeltingEnergy;
  costs.gridTransitionCost = gridEmissionReduction * totalEnergyUse * costFactors.gridTransitionCost * productionVolume;

  // 3. Transport optimization cost
  const transportReduction = Math.max(0, baselineConfig.transportDistance - configuredConfig.transportDistance);
  costs.transportOptimizationCost = transportReduction * costFactors.transportOptimization * productionVolume;

  // 4. Energy efficiency upgrade cost
  const energyReduction = Math.max(0, 
    (baselineConfig.energyConsumption + baselineConfig.smeltingEnergy) - 
    (configuredConfig.energyConsumption + configuredConfig.smeltingEnergy)
  );
  costs.energyEfficiencyCost = energyReduction * costFactors.energyEfficiencyUpgrade * productionVolume;

  // 5. Recycling infrastructure cost
  const recyclingRateIncrease = Math.max(0, configuredConfig.recyclingRate - baselineConfig.recyclingRate);
  costs.recyclingInfrastructureCost = recyclingRateIncrease * costFactors.recyclingInfrastructure * productionVolume;

  // 6. Water treatment upgrade cost
  const waterReduction = Math.max(0, baselineConfig.waterUsage - configuredConfig.waterUsage);
  costs.waterTreatmentCost = waterReduction * costFactors.waterTreatmentUpgrade * productionVolume;

  // 7. Waste reduction technology cost
  const wasteReduction = Math.max(0, baselineConfig.wasteGeneration - configuredConfig.wasteGeneration);
  costs.wasteReductionCost = wasteReduction * costFactors.wasteReductionTechnology * productionVolume;

  // Calculate total additional cost
  costs.totalAdditionalCost = 
    costs.recycledContentCost +
    costs.gridTransitionCost +
    costs.transportOptimizationCost +
    costs.energyEfficiencyCost +
    costs.recyclingInfrastructureCost +
    costs.waterTreatmentCost +
    costs.wasteReductionCost;

  // Calculate cost per CO2e saved
  if (baselineResult && configuredResult && baselineResult.totalGwp > configuredResult.totalGwp) {
    const co2eSaved = (baselineResult.totalGwp - configuredResult.totalGwp) * productionVolume;
    if (co2eSaved > 0) {
      costs.costPerKgCO2eSaved = costs.totalAdditionalCost / co2eSaved;
      costs.costPerTonneCO2eSaved = costs.costPerKgCO2eSaved * 1000;
    }
  }

  return costs;
}

/**
 * Formats cost values for display in Indian Rupees
 */
export function formatCostDisplay(amount: number): string {
  if (amount >= 10000000) { // 1 crore or more
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) { // 1 lakh or more
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) { // 1 thousand or more
    return `₹${(amount / 1000).toFixed(2)} K`;
  } else {
    return `₹${amount.toFixed(2)}`;
  }
}

/**
 * Calculates cost efficiency rating based on cost per CO2e saved
 */
export function getCostEfficiencyRating(costPerKgCO2e: number): {
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  color: string;
  description: string;
} {
  if (costPerKgCO2e <= 500) {
    return {
      rating: 'Excellent',
      color: 'text-green-600',
      description: 'Highly cost-effective carbon reduction'
    };
  } else if (costPerKgCO2e <= 1500) {
    return {
      rating: 'Good',
      color: 'text-blue-600',
      description: 'Cost-effective carbon reduction'
    };
  } else if (costPerKgCO2e <= 3000) {
    return {
      rating: 'Fair',
      color: 'text-yellow-600',
      description: 'Moderately cost-effective'
    };
  } else {
    return {
      rating: 'Poor',
      color: 'text-red-600',
      description: 'High cost per unit carbon reduction'
    };
  }
}

/**
 * Gets cost breakdown for visualization
 */
export function getCostBreakdown(costs: PathwayCosts): Array<{
  category: string;
  amount: number;
  percentage: number;
  color: string;
}> {
  const breakdown = [
    { category: 'Recycled Content Premium', amount: costs.recycledContentCost, color: '#10B981' },
    { category: 'Grid Transition', amount: costs.gridTransitionCost, color: '#3B82F6' },
    { category: 'Transport Optimization', amount: costs.transportOptimizationCost, color: '#8B5CF6' },
    { category: 'Energy Efficiency', amount: costs.energyEfficiencyCost, color: '#F59E0B' },
    { category: 'Recycling Infrastructure', amount: costs.recyclingInfrastructureCost, color: '#EF4444' },
    { category: 'Water Treatment', amount: costs.waterTreatmentCost, color: '#06B6D4' },
    { category: 'Waste Reduction', amount: costs.wasteReductionCost, color: '#84CC16' },
  ];

  return breakdown
    .filter(item => item.amount > 0)
    .map(item => ({
      ...item,
      percentage: costs.totalAdditionalCost > 0 ? (item.amount / costs.totalAdditionalCost) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);
}