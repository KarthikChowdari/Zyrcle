"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, BrainCircuit, Loader2, Upload } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImputedBadge } from "@/components/ImputedBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// --- Types & Defaults ---
type Material = 'Aluminium' | 'Copper';
interface ProjectInput {
    name: string;
    material: Material;
    product_type: string;
    region: 'EU' | 'US' | 'CN' | 'Global';
    mass_kg: number;
    recycledContent: number | null;
    gridEmissions_gCO2_per_kWh: number | null;
    transportDistance_km: number | null;
    end_of_life_recycling_rate: number | null;
}
interface LCIParameter {
    name: string;
    value: number;
    unit: string;
    isImputed: boolean;
    confidence: number;
}
interface ProjectData {
    id: string;
    name: string;
    material: string;
    product_type: string;
    region: string;
    mass_kg: number;
    recycledContent: number | null;
    gridEmissions_gCO2_per_kWh: number | null;
    transportDistance_km: number | null;
    end_of_life_recycling_rate: number | null;
    energyConsumption: number | null;
    smeltingEnergy: number | null;
    waterUsage: number | null;
    wasteGeneration: number | null;
    lciParameters: LCIParameter[];
}
interface ImputationMeta {
    field: keyof ProjectData;
    method: string;
    confidence: number;
}
const aluminiumDefaults = {
    name: "Aluminium Beverage Cans",
    material: "Aluminium" as Material,
    product_type: "Beverage Can",
    mass_kg: 1000,
    recycledContent: 65,
    gridEmissions_gCO2_per_kWh: 450,
    transportDistance_km: 500,
    end_of_life_recycling_rate: null,
};
const copperDefaults = {
    name: "Copper Industrial Cable",
    material: "Copper" as Material,
    product_type: "Industrial Cable",
    mass_kg: 2500,
    recycledContent: 40,
    gridEmissions_gCO2_per_kWh: 450,
    transportDistance_km: 800,
    end_of_life_recycling_rate: null,
};

export default function CustomProjectPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [project, setProject] = useState<ProjectInput>({ ...aluminiumDefaults, region: 'EU' });
    const [imputationMeta, setImputationMeta] = useState<ImputationMeta[]>([]);
    const [lcaResults, setLcaResults] = useState<any | null>(null);
    const [project, setProject] = useState<ProjectData>({
        id: params.id,
        name: "Aluminium Extrusion Project",
        material: "Aluminium",
        product_type: "Beverage Can",
        region: "EU",
        mass_kg: 1000,
        recycledContent: 65,
        gridEmissions_gCO2_per_kWh: 450,
        transportDistance_km: 500,
        end_of_life_recycling_rate: null,
        energyConsumption: 15.2,
        smeltingEnergy: 8.7,
        waterUsage: 2.3,
        wasteGeneration: 0.15,
        lciParameters: [
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
        ],
    });
    const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // TODO: Implement CSV upload and parse
            console.log("TODO: Implement CSV upload and parse", file.name);
        }
    };

    const handleSanitizedInputChange = (field: keyof ProjectData, value: string) => {
        const sanitizedValue = value.replace(/[^0-9.]/g, '');
        setProject(prev => ({ ...prev, [field]: sanitizedValue === '' ? null : Number(sanitizedValue) }));
    };

    const handleSelectChange = (field: keyof ProjectData, value: string) => {
        if (field === 'material') {
            const newDefaults = value === 'Aluminium' ? aluminiumDefaults : copperDefaults;
            setProject(prev => ({ ...prev, ...newDefaults, region: prev.region }));
            setLcaResults(null);
            setImputationMeta([]);
        } else {
            setProject(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);
        setLcaResults(null);
        setImputationMeta([]);
        try {
            const response = await fetch('/api/impute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to calculate results.");
            }
            const data = await response.json();
            setProject(data.project_imputed);
            setImputationMeta(data.imputation_meta);
            setLcaResults(data.project_imputed.results);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateComparison = () => {
        if (!lcaResults) {
            setError("Please calculate the project impact before creating a comparison.");
            return;
        }
        const fullProjectState = { ...project, results: lcaResults };
        localStorage.setItem("originalProject", JSON.stringify(fullProjectState));
        router.push(`/project/${params.id}/compare`);
    };

    const getImputationForField = (field: keyof ProjectData) => imputationMeta.find(m => m.field === field);
    const productTypes = [ "Automotive Components", "Beverage Can", "Building Construction", "Cookware", "Electronics (PCB)", "Industrial Cable", "Packaging Foil" ];

    return (
        <div className="min-h-screen bg-[#f8f3e6]">
            <header className="border-b bg-white print:hidden sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 space-y-2">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Custom Project</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-slate-800">Custom Project: {project.name}</h1>
                        <Button onClick={handleCreateComparison} className="bg-blue-600 hover:bg-blue-700" disabled={!lcaResults || isLoading}>
                            <Plus className="w-4 h-4 mr-2" /> Create Comparison
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* INPUTS */}
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>1. Define Your Project</CardTitle>
                                <CardDescription>Enter the core details of your product or component.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2"><Label htmlFor="name">Project Name</Label><Input id="name" value={project.name} onChange={(e) => setProject(p=>({...p, name: e.target.value}))}/></div>
                                <div className="space-y-1"><Label htmlFor="material">Material</Label><Select value={project.material} onValueChange={(v) => handleSelectChange('material', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Aluminium">Aluminium</SelectItem><SelectItem value="Copper">Copper</SelectItem></SelectContent></Select></div>
                                <div className="space-y-1"><Label htmlFor="product_type">Product Type</Label><Select value={project.product_type} onValueChange={(v) => handleSelectChange('product_type', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{productTypes.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-1"><Label htmlFor="region">Region</Label><Select value={project.region} onValueChange={(v) => handleSelectChange('region', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="EU">Europe (EU)</SelectItem><SelectItem value="US">United States</SelectItem><SelectItem value="CN">China</SelectItem></SelectContent></Select></div>
                                <div className="space-y-1"><Label htmlFor="mass_kg">Mass (kg)</Label><Input id="mass_kg" type="text" inputMode="decimal" value={project.mass_kg} onChange={(e) => handleSanitizedInputChange('mass_kg', e.target.value)}/></div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader><CardTitle>2. Provide LCI Parameters</CardTitle><CardDescription>Fill in what you know. We'll use AI to estimate any missing values.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries({
                                    recycledContent: { label: "Recycled Content", unit: "%" },
                                    gridEmissions_gCO2_per_kWh: { label: "Grid Emissions", unit: "gCO2/kWh" },
                                    transportDistance_km: { label: "Transport Distance", unit: "km" },
                                    end_of_life_recycling_rate: { label: "End-of-Life Recycling Rate", unit: "%" },
                                    energyConsumption: { label: "Energy Consumption", unit: "kWh/kg" },
                                    smeltingEnergy: { label: "Smelting Energy", unit: "kWh/kg" },
                                    waterUsage: { label: "Water Usage", unit: "L/kg" },
                                    wasteGeneration: { label: "Waste Generation", unit: "kg/kg" },
                                }).map(([key, { label, unit }]) => {
                                    const fieldKey = key as keyof Pick<ProjectData, 'recycledContent' | 'gridEmissions_gCO2_per_kWh' | 'transportDistance_km' | 'end_of_life_recycling_rate' | 'energyConsumption' | 'smeltingEnergy' | 'waterUsage' | 'wasteGeneration'>;
                                    const imputation = getImputationForField(fieldKey);
                                    const fieldValue = project[fieldKey];
                                    return (
                                        <div key={key} className="flex items-center justify-between">
                                            <div><Label htmlFor={key} className="font-medium">{label}</Label>{imputation && <ImputedBadge confidence={imputation.confidence} />}</div>
                                            <div className="flex items-center gap-2"><Input id={key} type="text" inputMode="decimal" placeholder="Auto" value={fieldValue ?? ''} onChange={(e) => handleSanitizedInputChange(fieldKey, e.target.value)} className="w-32 text-right"/><span className="text-sm text-slate-500 w-16">{unit}</span></div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                        <div className="space-y-6">
                        

                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">Upload BOM CSV</CardTitle>
                                <CardDescription>
                                    Or manually edit parameters on the right.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-slate-300 transition-colors">
                                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-sm text-slate-600 mb-4">
                                        Upload your Bill of Materials (BOM) CSV file
                                    </p>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCSVUpload}
                                        className="hidden"
                                        id="csv-upload"
                                    />
                                    <Button asChild variant="outline">
                                        <label htmlFor="csv-upload" className="cursor-pointer">
                                            Choose CSV File
                                        </label>
                                    </Button>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Supported format: CSV with columns: Material, Quantity, Unit
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                        <div className="flex flex-col items-center"><Button size="lg" onClick={handleCalculate} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">{isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <BrainCircuit className="w-5 h-5 mr-2" />}Calculate Impact</Button>{error && <p className="text-red-600 text-sm mt-2">{error}</p>}</div>
                    </div>

                    {/* RESULTS */}
                    <div className="space-y-6">
                        <Card className="shadow-sm sticky top-24">
                            <CardHeader><CardTitle>Results</CardTitle><CardDescription>The calculated environmental and circularity impact.</CardDescription></CardHeader>
                            <CardContent>{!lcaResults && !isLoading && (<div className="text-center py-12"><p className="text-slate-500">Your results will appear here after calculation.</p></div>)}{isLoading && <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-400" /></div>}{lcaResults && (<div className="space-y-4"><div className="p-4 bg-blue-50 border border-blue-200 rounded-lg"><Label>Total GWP (Carbon Footprint)</Label><p className="text-3xl font-bold text-blue-800">{lcaResults.totalGwp} <span className="text-xl font-normal">kg CO₂e</span></p></div><div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"><Label>Circularity Score</Label><p className="text-3xl font-bold text-emerald-800">{lcaResults.circularityScore} <span className="text-xl font-normal">/ 100</span></p></div><Alert><AlertTitle>Imputation Summary</AlertTitle><AlertDescription>{imputationMeta.length > 0 ? `We used AI to impute ${imputationMeta.length} value(s) to complete the analysis.` : `All values were provided. No imputation was needed.`}</AlertDescription></Alert></div>)}</CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

