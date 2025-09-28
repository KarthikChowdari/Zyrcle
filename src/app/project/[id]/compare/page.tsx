"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import ProtectedPage from "@/components/ProtectedPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StackedBar } from "@/components/StackedBar";
import { Sankey } from "@/components/Sankey";
import { CostAnalysisCard, CostSummary } from "@/components/CostAnalysis";
import { calculatePathwayCosts, PathwayCosts } from "@/lib/cost-calculations";

// --- Types ---
interface LcaResult {
    totalGwp: number;
    gwpBreakdown: { materialProduction: number; transport: number; gridEnergy: number; environmental?: number };
    totalEnergy: number;
    circularityScore: number;
}
interface FullProject {
    [key: string]: any;
    results: LcaResult;
}
interface DeltaMetrics {
    gwp_delta: number;
    gwp_delta_percent: number;
    circularity_score_delta: number;
}

const lciParameters = [
    {
        name: "Energy Consumption",
        value: 15.2,
        unit: "kWh/kg",
        isImputed: false,
        confidence: 95,
    },
    {
        name: "Transport Distance",
        value: 450,
        unit: "km",
        isImputed: true,
        confidence: 78,
    },
    {
        name: "Smelting Energy",
        value: 8.7,
        unit: "kWh/kg",
        isImputed: true,
        confidence: 82,
    },
    {
        name: "Recycling Rate",
        value: 75,
        unit: "%",
        isImputed: false,
        confidence: 90,
    },
    {
        name: "Water Usage",
        value: 2.3,
        unit: "L/kg",
        isImputed: true,
        confidence: 65,
    },
    {
        name: "Waste Generation",
        value: 0.15,
        unit: "kg/kg",
        isImputed: true,
        confidence: 70,
    },
];

export default function ComparePathwaysPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const [originalProject, setOriginalProject] = useState<FullProject | null>(null);
    const [comparisonProject, setComparisonProject] = useState<FullProject | null>(null);
    const [deltaMetrics, setDeltaMetrics] = useState<DeltaMetrics | null>(null);
    const [pathwayCosts, setPathwayCosts] = useState<PathwayCosts | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAndCompare = async () => {
            setIsLoading(true);
            const storedProject = localStorage.getItem("originalProject");
            if (!storedProject) {
                setIsLoading(false);
                return;
            }
            const original = JSON.parse(storedProject) as FullProject;
            setOriginalProject(original);

            const { results, ...comparisonInputs } = original;
            comparisonInputs.name = `${original.name} (Optimized)`;
            comparisonInputs.recycledContent = Math.min((original.recycledContent ?? 0) + 25, 95);
            comparisonInputs.gridEmissions_gCO2_per_kWh = Math.max((original.gridEmissions_gCO2_per_kWh ?? 500) - 200, 100);
            comparisonInputs.end_of_life_recycling_rate = Math.min((original.end_of_life_recycling_rate ?? 0) + 15, 95);
            // Optimize additional parameters
            comparisonInputs.energyConsumption = Math.max((original.energyConsumption ?? 15.2) - 3, 5);
            comparisonInputs.smeltingEnergy = Math.max((original.smeltingEnergy ?? 8.7) - 2, 3);
            comparisonInputs.waterUsage = Math.max((original.waterUsage ?? 2.3) - 0.5, 0.5);
            comparisonInputs.wasteGeneration = Math.max((original.wasteGeneration ?? 0.15) - 0.05, 0.05);

            try {
                const response = await fetch('/api/impute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ project: comparisonInputs }),
                });
                if(!response.ok) throw new Error("Failed to calculate comparison project");
                const data = await response.json();
                const comparison = data.project_imputed as FullProject;
                setComparisonProject(comparison);

                const gwp_delta = comparison.results.totalGwp - original.results.totalGwp;
                const gwp_delta_percent = original.results.totalGwp !== 0 ? (gwp_delta / original.results.totalGwp) * 100 : 0;
                const circularity_score_delta = comparison.results.circularityScore - original.results.circularityScore;
                setDeltaMetrics({ gwp_delta, gwp_delta_percent, circularity_score_delta });

                // Calculate pathway costs
                const originalConfig = {
                    recycledContent: original.recycledContent ?? 60,
                    gridEmissions: original.gridEmissions_gCO2_per_kWh ?? 450,
                    transportDistance: original.transportDistance_km ?? 500,
                    recyclingRate: original.end_of_life_recycling_rate ?? 60,
                    energyConsumption: original.energyConsumption ?? 15.2,
                    smeltingEnergy: original.smeltingEnergy ?? 8.7,
                    waterUsage: original.waterUsage ?? 2.3,
                    wasteGeneration: original.wasteGeneration ?? 0.15,
                };
                const optimizedConfig = {
                    recycledContent: comparison.recycledContent ?? 85,
                    gridEmissions: comparison.gridEmissions_gCO2_per_kWh ?? 250,
                    transportDistance: comparison.transportDistance_km ?? 500,
                    recyclingRate: comparison.end_of_life_recycling_rate ?? 75,
                    energyConsumption: comparison.energyConsumption ?? 12.2,
                    smeltingEnergy: comparison.smeltingEnergy ?? 6.7,
                    waterUsage: comparison.waterUsage ?? 1.8,
                    wasteGeneration: comparison.wasteGeneration ?? 0.10,
                };
                const costs = calculatePathwayCosts(
                    originalConfig,
                    optimizedConfig,
                    original.results,
                    comparison.results,
                    undefined, // Use default cost factors
                    1000 // 1000 kg production volume
                );
                setPathwayCosts(costs);

            } catch (error) {
                console.error("Comparison calculation failed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndCompare();
    }, [params.id]);

    const handleExportPDF = () => window.print();

    // Reusable scroll animation wrapper
    const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
        const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay }}
            >
                {children}
            </motion.div>
        )
    }

    if (isLoading) {
        return (
            <ProtectedPage>
                <div className="min-h-screen bg-gradient-to-br from-[#0A1F0A] via-[#122315] to-[#1C2B1C] flex items-center justify-center">
                    <Skeleton className="w-64 h-8 bg-white/20" />
                </div>
            </ProtectedPage>
        );
    }

    if (!originalProject || !comparisonProject || !deltaMetrics) {
        return (
            <ProtectedPage>
                <div className="min-h-screen bg-gradient-to-br from-[#0A1F0A] via-[#122315] to-[#1C2B1C] text-white flex flex-col items-center justify-center text-center p-4">
                    <Card className="max-w-md bg-white/5 border-white/10"><CardHeader><CardTitle>No Comparison Data</CardTitle></CardHeader><CardContent><p className="mb-4 text-white/80">Please start by creating a custom project first.</p><Link href="/"><Button variant="ghost" className="text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Home</Button></Link></CardContent></Card>
                </div>
            </ProtectedPage>
        );
    }

    const getSankeyConfig = (proj: FullProject) => ({
        recycledContent: proj.recycledContent,
        gridEmissions: proj.gridEmissions_gCO2_per_kWh,
        transportDistance: proj.transportDistance_km,
        recyclingRate: proj.end_of_life_recycling_rate,
    });

    return (
        <ProtectedPage>
            <div className="min-h-screen bg-gradient-to-br from-[#0A1F0A] via-[#122315] to-[#1C2B1C] text-white">
            <motion.header
                className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 print:hidden"
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/project/${params.id}`}><Button variant="ghost" size="sm" className="text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Project</Button></Link>
                        <h1 className="text-xl font-semibold">Pathway Comparison</h1>
                    </div>
                    <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
                </div>
            </motion.header>

            <main className="container mx-auto px-4 py-10 space-y-16">
                <ScrollReveal>
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#F8F4ED]">
                        <StackedBar primaryData={originalProject.results} configuredData={comparisonProject.results} />
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <ScrollReveal delay={0.1}>
                        <div className="space-y-6">
                            <h2 className="text-center text-lg font-semibold">{originalProject.name}</h2>
                            <Card className="bg-[#122315] border-white/10 hover:scale-[1.02] transition">
                                <CardContent className="pt-6"><Sankey config={getSankeyConfig(originalProject)} data={originalProject.results} /></CardContent>
                            </Card>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <div className="space-y-6 flex flex-col justify-center">
                            <h2 className="text-center text-lg font-semibold">Impact Comparison</h2>
                            <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 border-blue-600 hover:shadow-lg">
                                <CardContent className="pt-6 text-center">
                                    {deltaMetrics.gwp_delta_percent < 0 ? <TrendingDown className="w-6 h-6 mx-auto text-green-400" /> : <TrendingUp className="w-6 h-6 mx-auto text-red-400" />}
                                    <p className="mt-2 text-sm">GWP Change</p>
                                    <p className={`text-2xl font-bold ${deltaMetrics.gwp_delta_percent < 0 ? "text-green-400" : "text-red-400"}`}>{deltaMetrics.gwp_delta_percent > 0 ? "+" : ""}{deltaMetrics.gwp_delta_percent.toFixed(1)}%</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-emerald-900 to-green-800 border-green-600 hover:shadow-lg">
                                <CardContent className="pt-6 text-center">
                                    {deltaMetrics.circularity_score_delta > 0 ? <TrendingUp className="w-6 h-6 mx-auto text-green-400" /> : <TrendingDown className="w-6 h-6 mx-auto text-red-400" />}
                                    <p className="mt-2 text-sm">Circularity Change</p>
                                    <p className={`text-2xl font-bold ${deltaMetrics.circularity_score_delta > 0 ? "text-green-400" : "text-red-400"}`}>{deltaMetrics.circularity_score_delta > 0 ? "+" : ""}{deltaMetrics.circularity_score_delta.toFixed(1)}</p>
                                </CardContent>
                            </Card>
                            
                            {/* Cost Summary */}
                            {pathwayCosts && originalProject && comparisonProject && (
                                <Card className="bg-gradient-to-br from-purple-900 to-pink-800 border-purple-600 hover:shadow-lg">
                                    <CardContent className="pt-4">
                                        <CostSummary 
                                            costs={pathwayCosts}
                                            co2eSaved={Math.max(0, (originalProject.results.totalGwp - comparisonProject.results.totalGwp) * 1000)}
                                            isCompact={true}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.3}>
                        <div className="space-y-6">
                            <h2 className="text-center text-lg font-semibold">{comparisonProject.name}</h2>
                            <Card className="bg-[#122315] border-white/10 hover:scale-[1.02] transition">
                                <CardContent className="pt-6"><Sankey config={getSankeyConfig(comparisonProject)} data={comparisonProject.results} /></CardContent>
                            </Card>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Parameter Comparison Section */}
                <ScrollReveal delay={0.4}>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-center">LCI Parameters Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Original Project Parameters */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4 text-center">Original</h3>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Recycled Content", value: originalProject.recycledContent ?? 60, unit: "%" },
                                            { name: "Grid Emissions", value: originalProject.gridEmissions_gCO2_per_kWh ?? 450, unit: "gCO₂/kWh" },
                                            { name: "Transport Distance", value: originalProject.transportDistance_km ?? 500, unit: "km" },
                                            { name: "End-of-Life Recycling Rate", value: originalProject.end_of_life_recycling_rate ?? 60, unit: "%" },
                                            { name: "Energy Consumption", value: originalProject.energyConsumption ?? 15.2, unit: "kWh/kg" },
                                            { name: "Smelting Energy", value: originalProject.smeltingEnergy ?? 8.7, unit: "kWh/kg" },
                                            { name: "Water Usage", value: originalProject.waterUsage ?? 2.3, unit: "L/kg" },
                                            { name: "Waste Generation", value: originalProject.wasteGeneration ?? 0.15, unit: "kg/kg" },
                                        ].map((param, index) => (
                                            <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                                                <span className="text-white/80">{param.name}</span>
                                                <span className="text-white font-semibold">{param.value} {param.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Optimized Project Parameters */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4 text-center">Optimized</h3>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Recycled Content", value: comparisonProject.recycledContent ?? 85, unit: "%" },
                                            { name: "Grid Emissions", value: comparisonProject.gridEmissions_gCO2_per_kWh ?? 250, unit: "gCO₂/kWh" },
                                            { name: "Transport Distance", value: comparisonProject.transportDistance_km ?? 500, unit: "km" },
                                            { name: "End-of-Life Recycling Rate", value: comparisonProject.end_of_life_recycling_rate ?? 75, unit: "%" },
                                            { name: "Energy Consumption", value: comparisonProject.energyConsumption ?? 12.2, unit: "kWh/kg" },
                                            { name: "Smelting Energy", value: comparisonProject.smeltingEnergy ?? 6.7, unit: "kWh/kg" },
                                            { name: "Water Usage", value: comparisonProject.waterUsage ?? 1.8, unit: "L/kg" },
                                            { name: "Waste Generation", value: comparisonProject.wasteGeneration ?? 0.10, unit: "kg/kg" },
                                        ].map((param, index) => (
                                            <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                                                <span className="text-white/80">{param.name}</span>
                                                <span className="text-green-400 font-semibold">{param.value} {param.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </ScrollReveal>

                {/* Cost Analysis Section */}
                <ScrollReveal delay={0.5}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Cost Analysis Card */}
                        <div>
                            {isLoading || !pathwayCosts || !originalProject || !comparisonProject ? (
                                <Skeleton className="h-80 w-full bg-white/20" />
                            ) : (
                                <CostAnalysisCard 
                                    costs={pathwayCosts}
                                    co2eSaved={Math.max(0, (originalProject.results.totalGwp - comparisonProject.results.totalGwp) * 1000)}
                                    className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 text-white"
                                />
                            )}
                        </div>
                        
                        {/* Cost Efficiency Metrics */}
                        <div className="space-y-6">
                            <h2 className="text-center text-lg font-semibold text-white">Economic Impact</h2>
                            
                            {isLoading || !pathwayCosts || !deltaMetrics ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-20 w-full bg-white/20" />
                                    <Skeleton className="h-20 w-full bg-white/20" />
                                    <Skeleton className="h-20 w-full bg-white/20" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-600 hover:shadow-lg">
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-sm text-white/80">Additional Investment</p>
                                            <p className="text-2xl font-bold text-purple-300">
                                                {pathwayCosts.totalAdditionalCost >= 10000000 ? 
                                                    `₹${(pathwayCosts.totalAdditionalCost / 10000000).toFixed(2)} Cr` : 
                                                    pathwayCosts.totalAdditionalCost >= 100000 ? 
                                                    `₹${(pathwayCosts.totalAdditionalCost / 100000).toFixed(2)} L` : 
                                                    `₹${(pathwayCosts.totalAdditionalCost / 1000).toFixed(2)} K`
                                                }
                                            </p>
                                            <p className="text-xs text-white/60 mt-1">Per 1000 kg/year</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-gradient-to-br from-green-900 to-emerald-800 border-green-600 hover:shadow-lg">
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-sm text-white/80">Cost per CO₂e Saved</p>
                                            <p className="text-2xl font-bold text-green-300">
                                                {pathwayCosts.costPerKgCO2eSaved >= 1000 ? 
                                                    `₹${(pathwayCosts.costPerKgCO2eSaved / 1000).toFixed(2)} K` : 
                                                    `₹${pathwayCosts.costPerKgCO2eSaved.toFixed(2)}`
                                                }
                                            </p>
                                            <p className="text-xs text-white/60 mt-1">Per kg CO₂e</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-gradient-to-br from-orange-900 to-red-800 border-orange-600 hover:shadow-lg">
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-sm text-white/80">Payback Period</p>
                                            <p className="text-2xl font-bold text-orange-300">
                                                {pathwayCosts.totalAdditionalCost > 0 ? 
                                                    (((originalProject.results.totalGwp - comparisonProject.results.totalGwp) * 1000 * 47) / pathwayCosts.totalAdditionalCost).toFixed(1) : 
                                                    '∞'
                                                }
                                            </p>
                                            <p className="text-xs text-white/60 mt-1">Years at ₹47/tonne CO₂e</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>
            </main>
        </div>
        </ProtectedPage>
    );
}

