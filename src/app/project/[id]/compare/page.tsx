"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StackedBar } from "@/components/StackedBar";
import { Sankey } from "@/components/Sankey";

// --- Types ---
interface LcaResult {
    totalGwp: number;
    gwpBreakdown: { materialProduction: number; transport: number; gridEnergy: number };
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

export default function ComparePathwaysPage({ params }: { params: { id: string } }) {
    const [originalProject, setOriginalProject] = useState<FullProject | null>(null);
    const [comparisonProject, setComparisonProject] = useState<FullProject | null>(null);
    const [deltaMetrics, setDeltaMetrics] = useState<DeltaMetrics | null>(null);
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
            <div className="min-h-screen bg-gradient-to-br from-[#0A1F0A] via-[#122315] to-[#1C2B1C] flex items-center justify-center">
                <Skeleton className="w-64 h-8 bg-white/20" />
            </div>
        );
    }

    if (!originalProject || !comparisonProject || !deltaMetrics) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0A1F0A] via-[#122315] to-[#1C2B1C] text-white flex flex-col items-center justify-center text-center p-4">
                <Card className="max-w-md bg-white/5 border-white/10"><CardHeader><CardTitle>No Comparison Data</CardTitle></CardHeader><CardContent><p className="mb-4 text-white/80">Please start by creating a custom project first.</p><Link href="/"><Button variant="ghost" className="text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Home</Button></Link></CardContent></Card>
            </div>
        );
    }

    const getSankeyConfig = (proj: FullProject) => ({
        recycledContent: proj.recycledContent,
        gridEmissions: proj.gridEmissions_gCO2_per_kWh,
        transportDistance: proj.transportDistance_km,
        recyclingRate: proj.end_of_life_recycling_rate,
    });

    return (
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
            </main>
        </div>
    );
}

