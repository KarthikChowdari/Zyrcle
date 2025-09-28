import { NextResponse } from 'next/server';
import { createSupabaseRouteHandler } from '@/lib/supabaseServer';

// Data Imports
import lciAluminiumData from '@/data/lca-aluminium.json';
import lciCopperData from '@/data/lca-copper.json';
import modelCoefficients from '@/models/lr_coefficients.json';
import treeModel from '@/models/tree_model.json';

// Data is embedded to prevent build errors
const productModifiers = {
    "Beverage Can": { "manufacturingEnergyFactor": 1.20, "wasteFactor": 1.05 },
    "Packaging Foil": { "manufacturingEnergyFactor": 1.15, "wasteFactor": 1.10 },
    "Cookware": { "manufacturingEnergyFactor": 1.25, "wasteFactor": 1.02 },
    "Automotive Components": { "manufacturingEnergyFactor": 1.45, "wasteFactor": 1.12 },
    "Building Construction": { "manufacturingEnergyFactor": 1.35, "wasteFactor": 1.15 },
    "Industrial Cable": { "manufacturingEnergyFactor": 1.30, "wasteFactor": 1.08 },
    "Electronics (PCB)": { "manufacturingEnergyFactor": 1.60, "wasteFactor": 1.25 },
    "default": { "manufacturingEnergyFactor": 1.20, "wasteFactor": 1.10 }
};

// --- Type Definitions ---
type Material = 'Aluminium' | 'Copper';

interface QuickCompareInput {
    recycledContent: number;
    gridEmissions: number;
    transportDistance: number;
    recyclingRate: number;
    energyConsumption?: number;
    smeltingEnergy?: number;
    waterUsage?: number;
    wasteGeneration?: number;
}

interface CustomProjectInput {
    name: string;
    material: Material;
    product_type: string;
    region: 'EU' | 'US' | 'CN' | 'Global';
    mass_kg: number;
    recycledContent?: number | null;
    gridEmissions_gCO2_per_kWh?: number | null;
    transportDistance_km?: number | null;
    end_of_life_recycling_rate?: number | null;
    energyConsumption?: number | null;
    smeltingEnergy?: number | null;
    waterUsage?: number | null;
    wasteGeneration?: number | null;
}

interface LcaResult {
    totalGwp: number;
    gwpBreakdown: { materialProduction: number; transport: number; gridEnergy: number; environmental?: number; };
    totalEnergy: number;
    circularityScore: number;
}
type TreeNode = { feature?: string; threshold?: number; left?: TreeNode; right?: TreeNode; value?: number; };
type FeatureInput = { [key: string]: number };

// --- Calculation Logic ---
function calculateQuickCompareLCA(input: QuickCompareInput): LcaResult {
    const primaryProcess = lciAluminiumData.processes.find(p => p.process_id === "AL_INGOT_PRIMARY_ELCD_V1");
    const recycledProcess = lciAluminiumData.processes.find(p => p.process_id === "AL_INGOT_RECYCLED_ELCD_V1");
    if (!primaryProcess || !recycledProcess) throw new Error("Core Aluminium LCI data missing.");
    
    const recycledRatio = input.recycledContent / 100;
    const primaryRatio = 1 - recycledRatio;
    
    // Use new parameters if provided, otherwise use defaults or calculated values
    const energyConsumption = input.energyConsumption ?? 15.2;
    const smeltingEnergy = input.smeltingEnergy ?? 8.7;
    const waterUsage = input.waterUsage ?? 2.3;
    const wasteGeneration = input.wasteGeneration ?? 0.15;
    
    const predictedEnergy = (modelCoefficients.coefficients.Aluminium.slope * input.recycledContent) + modelCoefficients.coefficients.Aluminium.intercept;
    
    // Enhanced material GWP calculation including smelting energy
    const baseMaterialGwp = (primaryRatio * primaryProcess.gCO2_per_kg) + (recycledRatio * recycledProcess.gCO2_per_kg);
    const smeltingGwp = smeltingEnergy * input.gridEmissions * 0.5; // Smelting energy impact
    const materialGwp = baseMaterialGwp + smeltingGwp;
    
    const transportGwp = ((primaryRatio * primaryProcess.transport_gCO2_per_kg) + (recycledRatio * recycledProcess.transport_gCO2_per_kg)) * (input.transportDistance / 500);
    
    // Enhanced grid GWP including energy consumption
    const totalEnergyConsumption = predictedEnergy + energyConsumption;
    const gridGwp = totalEnergyConsumption * input.gridEmissions;
    
    // Water and waste impact on GWP (small multipliers)
    const waterImpact = waterUsage * 50; // 50 gCO2 per L/kg water usage
    const wasteImpact = wasteGeneration * 200; // 200 gCO2 per kg/kg waste generation
    
    const totalGwp = (materialGwp + transportGwp + gridGwp + waterImpact + wasteImpact) / 1000;
    
    // Enhanced circularity score calculation including new parameters
    const wasteEfficiency = Math.max(0, (1 - wasteGeneration) * 100) / 100;
    const waterEfficiency = Math.max(0, (10 - waterUsage) / 10);
    const energyEfficiency = Math.max(0, (50 - energyConsumption) / 50);
    
    const circularityScore = 100 * (
        0.3 * recycledRatio + 
        0.25 * (input.recyclingRate / 100) + 
        0.15 * wasteEfficiency +
        0.15 * waterEfficiency +
        0.1 * energyEfficiency +
        0.05 * 0.95  // baseline sustainability factor
    );
    
    const environmentalImpact = (waterImpact + wasteImpact) / 1000;
    
    return {
        totalGwp: parseFloat(totalGwp.toFixed(3)),
        gwpBreakdown: {
            materialProduction: parseFloat((materialGwp / 1000).toFixed(3)),
            transport: parseFloat((transportGwp / 1000).toFixed(3)),
            gridEnergy: parseFloat((gridGwp / 1000).toFixed(3)),
            environmental: parseFloat(environmentalImpact.toFixed(3)),
        },
        totalEnergy: parseFloat(totalEnergyConsumption.toFixed(3)),
        circularityScore: parseFloat(Math.min(100, circularityScore).toFixed(1)),
    };
}

function calculateCustomProjectLCA(project: CustomProjectInput): LcaResult {
    const { material, product_type, recycledContent, gridEmissions_gCO2_per_kWh, transportDistance_km, end_of_life_recycling_rate, mass_kg, energyConsumption, smeltingEnergy, waterUsage, wasteGeneration } = project;
    const lciData = material === 'Aluminium' ? lciAluminiumData : lciCopperData;
    const primaryProcessId = material === 'Aluminium' ? "AL_INGOT_PRIMARY_ELCD_V1" : "CU_CATHODE_PRIMARY_V1";
    const recycledProcessId = material === 'Aluminium' ? "AL_INGOT_RECYCLED_ELCD_V1" : "CU_CATHODE_RECYCLED_V1";
    const primaryProcess = lciData.processes.find(p => p.process_id === primaryProcessId);
    const recycledProcess = lciData.processes.find(p => p.process_id === recycledProcessId);
    if (!primaryProcess || !recycledProcess) throw new Error(`Core LCI data for ${material} is missing.`);

    const modifier = (productModifiers as any)[product_type] || productModifiers.default;
    const safeRecycledContent = recycledContent ?? 10;
    const safeGridEmissions = gridEmissions_gCO2_per_kWh ?? 450;
    const safeTransportDistance = transportDistance_km ?? 500;
    const safeEolRecyclingRate = end_of_life_recycling_rate ?? 60;
    
    // Safe defaults for new parameters
    const safeEnergyConsumption = energyConsumption ?? 15.2;
    const safeSmeltingEnergy = smeltingEnergy ?? 8.7;
    const safeWaterUsage = waterUsage ?? 2.3;
    const safeWasteGeneration = wasteGeneration ?? 0.15;
    
    const recycledRatio = safeRecycledContent / 100;
    const primaryRatio = 1 - recycledRatio;

    const ingotEnergy = (primaryRatio * primaryProcess.energy_kWh_per_kg) + (recycledRatio * recycledProcess.energy_kWh_per_kg);
    const totalManufacturingEnergy = (ingotEnergy + safeEnergyConsumption + safeSmeltingEnergy) * modifier.manufacturingEnergyFactor;
    
    // Enhanced material GWP calculation
    const baseMaterialGwp = ((primaryRatio * primaryProcess.gCO2_per_kg) + (recycledRatio * recycledProcess.gCO2_per_kg)) * mass_kg;
    const smeltingGwp = safeSmeltingEnergy * safeGridEmissions * mass_kg * 0.5;
    const materialGwp = baseMaterialGwp + smeltingGwp;
    
    const transportGwp = ((primaryRatio * primaryProcess.transport_gCO2_per_kg) + (recycledRatio * recycledProcess.transport_gCO2_per_kg)) * (safeTransportDistance / 500) * mass_kg;
    const gridGwp = totalManufacturingEnergy * safeGridEmissions * mass_kg;
    
    // Water and waste impact
    const waterImpact = safeWaterUsage * 50 * mass_kg;
    const wasteImpact = safeWasteGeneration * 200 * mass_kg;
    
    const totalGwp = (materialGwp + transportGwp + gridGwp + waterImpact + wasteImpact) / 1000;
    
    // Enhanced circularity score calculation
    const wasteEfficiency = Math.max(0, (1 - safeWasteGeneration) * 100) / 100;
    const waterEfficiency = Math.max(0, (10 - safeWaterUsage) / 10);
    const energyEfficiency = Math.max(0, (50 - safeEnergyConsumption) / 50);
    
    const circularityScore = 100 * (
        0.3 * recycledRatio + 
        0.25 * (safeEolRecyclingRate / 100) / modifier.wasteFactor +
        0.15 * wasteEfficiency +
        0.15 * waterEfficiency +
        0.1 * energyEfficiency +
        0.05 * 0.95
    );

    const environmentalImpact = (waterImpact + wasteImpact) / 1000;
    
    return {
        totalGwp: parseFloat(totalGwp.toFixed(3)),
        gwpBreakdown: {
            materialProduction: parseFloat((materialGwp / 1000).toFixed(3)),
            transport: parseFloat((transportGwp / 1000).toFixed(3)),
            gridEnergy: parseFloat((gridGwp / 1000).toFixed(3)),
            environmental: parseFloat(environmentalImpact.toFixed(3)),
        },
        totalEnergy: parseFloat((totalManufacturingEnergy * mass_kg).toFixed(3)),
        circularityScore: parseFloat(circularityScore.toFixed(1)),
    };
}

// --- Decision Tree Helpers ---
function predictRecyclingRate(input: FeatureInput): number | null {
    let node: TreeNode = treeModel;
    while (node.value === undefined) {
        if (!node.feature || input[node.feature] === undefined || node.threshold === undefined) return null;
        node = input[node.feature] <= node.threshold ? (node.left as TreeNode) : (node.right as TreeNode);
    }
    return node.value;
}
function createModelInput(material: string, productType: string, region: string): FeatureInput {
    const all_features = ['material_Aluminium', 'material_Copper','product_type_Automotive Components', 'product_type_Beverage Can','product_type_Building Construction', 'product_type_Cookware','product_type_Electronics (PCB)', 'product_type_Industrial Cable','product_type_Packaging Foil','region_EU', 'region_IN', 'region_NA', 'region_SEA'];
    const input: FeatureInput = {};
    all_features.forEach(f => input[f] = 0);
    const material_key = `material_${material}`;
    const product_type_key = `product_type_${productType}`;
    const region_key = `region_${region}`;
    if (input.hasOwnProperty(material_key)) input[material_key] = 1;
    if (input.hasOwnProperty(product_type_key)) input[product_type_key] = 1;
    if (input.hasOwnProperty(region_key)) input[region_key] = 1;
    return input;
}

// --- API Endpoint Handler ---
export async function POST(request: Request) {
    try {
        // Check authentication
        const supabase = createSupabaseRouteHandler();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const userId = session.user.id;
        const body = await request.json();
        const project = body.project;

        if (project && typeof project.recycledContent !== 'undefined' && project.material === undefined) {
            const lcaResult = calculateQuickCompareLCA(project as QuickCompareInput);
            const imputation_meta = [{ field: "totalEnergy", method: "AI (Linear Regression)", confidence: 0.85, source: modelCoefficients.model_name }];
            return NextResponse.json({ project_imputed: { ...project, results: lcaResult }, imputation_meta });
        }

        else if (project && typeof project.material !== 'undefined') {
            const customProject = project as CustomProjectInput;
            const project_imputed = { ...customProject };
            const imputation_meta: any[] = [];

            if (project_imputed.end_of_life_recycling_rate === null || project_imputed.end_of_life_recycling_rate === undefined) {
                const modelInput = createModelInput(customProject.material, customProject.product_type, customProject.region);
                const prediction = predictRecyclingRate(modelInput);
                if (prediction !== null) {
                    project_imputed.end_of_life_recycling_rate = parseFloat((prediction * 100).toFixed(1));
                    imputation_meta.push({ field: "end_of_life_recycling_rate", method: "AI (Decision Tree)", confidence: 0.75 });
                }
            }

            const lcaResults = calculateCustomProjectLCA(project_imputed);
            return NextResponse.json({ project_imputed: { ...project_imputed, results: lcaResults }, imputation_meta });
        }

        return NextResponse.json({ message: 'Invalid project data format.' }, { status: 400 });

    } catch (error: any) {
        console.error('API Error in /api/impute:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

