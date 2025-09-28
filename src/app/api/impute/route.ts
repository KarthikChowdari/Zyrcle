import { NextResponse } from 'next/server';

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
}

interface LcaResult {
    totalGwp: number;
    gwpBreakdown: { materialProduction: number; transport: number; gridEnergy: number; };
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
    const predictedEnergy = (modelCoefficients.coefficients.Aluminium.slope * input.recycledContent) + modelCoefficients.coefficients.Aluminium.intercept;
    const materialGwp = (primaryRatio * primaryProcess.gCO2_per_kg) + (recycledRatio * recycledProcess.gCO2_per_kg);
    const transportGwp = ((primaryRatio * primaryProcess.transport_gCO2_per_kg) + (recycledRatio * recycledProcess.transport_gCO2_per_kg)) * (input.transportDistance / 500);
    const gridGwp = predictedEnergy * input.gridEmissions;
    const totalGwp = (materialGwp + transportGwp + gridGwp) / 1000;
    const circularityScore = 100 * (0.4 * recycledRatio + 0.3 * (input.recyclingRate / 100) + 0.2 * 0.3 + 0.1 * 0.95);
    return {
        totalGwp: parseFloat(totalGwp.toFixed(3)),
        gwpBreakdown: {
            materialProduction: parseFloat((materialGwp / 1000).toFixed(3)),
            transport: parseFloat((transportGwp / 1000).toFixed(3)),
            gridEnergy: parseFloat((gridGwp / 1000).toFixed(3)),
        },
        totalEnergy: parseFloat(predictedEnergy.toFixed(3)),
        circularityScore: parseFloat(circularityScore.toFixed(1)),
    };
}

function calculateCustomProjectLCA(project: CustomProjectInput): LcaResult {
    const { material, product_type, recycledContent, gridEmissions_gCO2_per_kWh, transportDistance_km, end_of_life_recycling_rate, mass_kg } = project;
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
    const recycledRatio = safeRecycledContent / 100;
    const primaryRatio = 1 - recycledRatio;

    const ingotEnergy = (primaryRatio * primaryProcess.energy_kWh_per_kg) + (recycledRatio * recycledProcess.energy_kWh_per_kg);
    const totalManufacturingEnergy = ingotEnergy * modifier.manufacturingEnergyFactor;
    const materialGwp = ((primaryRatio * primaryProcess.gCO2_per_kg) + (recycledRatio * recycledProcess.gCO2_per_kg)) * mass_kg;
    const transportGwp = ((primaryRatio * primaryProcess.transport_gCO2_per_kg) + (recycledRatio * recycledProcess.transport_gCO2_per_kg)) * (safeTransportDistance / 500) * mass_kg;
    const gridGwp = totalManufacturingEnergy * safeGridEmissions * mass_kg;
    const totalGwp = (materialGwp + transportGwp + gridGwp) / 1000;
    const circularityScore = 100 * (0.4 * recycledRatio + 0.3 * (safeEolRecyclingRate / 100) / modifier.wasteFactor + 0.2 * 0.3 + 0.1 * 0.95);

    return {
        totalGwp: parseFloat(totalGwp.toFixed(3)),
        gwpBreakdown: {
            materialProduction: parseFloat((materialGwp / 1000).toFixed(3)),
            transport: parseFloat((transportGwp / 1000).toFixed(3)),
            gridEnergy: parseFloat((gridGwp / 1000).toFixed(3)),
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

