import { NextResponse } from 'next/server';

// --- TYPE DEFINITIONS ---
interface ProjectConfig {
    recycledContent: number;
    gridEmissions: number;
    transportDistance: number;
    recyclingRate: number;
}

interface LcaResult {
    totalGwp: number;
    gwpBreakdown: {
        materialProduction: number;
        transport: number;
        gridEnergy: number;
    };
    totalEnergy: number;
    circularityScore: number;
}

// The structure of a complete, saved project
interface SavedProject {
    inputs: ProjectConfig;
    outputs: LcaResult;
}

// The expected structure of the request body
interface CompareRequestBody {
    projectA: SavedProject;
    projectB: SavedProject;
}

// --- API ENDPOINT HANDLER ---
export async function POST(request: Request) {
    try {
        const body: CompareRequestBody = await request.json();
        const { projectA, projectB } = body;

        // --- Validation ---
        if (!projectA?.outputs || !projectB?.outputs) {
            return NextResponse.json({ message: 'Request body must include projectA and projectB with their calculated outputs.' }, { status: 400 });
        }

        const leftMetrics = projectA.outputs;
        const rightMetrics = projectB.outputs;

        // --- Delta Calculation ---
        const gwpDifference = rightMetrics.totalGwp - leftMetrics.totalGwp;
        const circularityScoreDifference = rightMetrics.circularityScore - leftMetrics.circularityScore;

        const deltas = {
            gwp_difference: parseFloat(gwpDifference.toFixed(3)),
            circularity_score_difference: parseFloat(circularityScoreDifference.toFixed(1)),
        };

        // --- Response ---
        return NextResponse.json({
            left_metrics: leftMetrics,
            right_metrics: rightMetrics,
            deltas: deltas,
        });

    } catch (error: any) {
        console.error('API Error in /api/compare:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

