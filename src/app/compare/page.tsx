"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Info, Save } from "lucide-react"
import { createSupabaseClientComponent } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/components/ui/use-toast"
import ProtectedPage from "@/components/ProtectedPage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { StackedBar } from "@/components/StackedBar"
import { Sankey } from "@/components/Sankey"
import { ImputedBadge } from "@/components/ImputedBadge"
import { CostAnalysisCard, CostSummary } from "@/components/CostAnalysis"
import { calculatePathwayCosts, PathwayCosts } from "@/lib/cost-calculations"
import {  Recycle, Battery, Truck, RefreshCcw, Zap, Flame, Droplets, Trash2 } from "lucide-react"

interface ProjectConfig {
  recycledContent: number
  gridEmissions: number
  transportDistance: number
  recyclingRate: number
  energyConsumption: number
  smeltingEnergy: number
  waterUsage: number
  wasteGeneration: number
}

interface LcaResult {
  totalGwp: number
  gwpBreakdown: {
    materialProduction: number
    transport: number
    gridEnergy: number
    environmental?: number
  }
  totalEnergy: number
  circularityScore: number
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

export default function ComparePage() {
  const { user } = useAuth()
  const supabase = createSupabaseClientComponent()
  const [config, setConfig] = useState<ProjectConfig>({
    recycledContent: 60,
    gridEmissions: 75,
    transportDistance: 5000,
    recyclingRate: 40,
    energyConsumption: 15.2,
    smeltingEnergy: 8.7,
    waterUsage: 2.3,
    wasteGeneration: 0.15,
  })

  const [primaryResult, setPrimaryResult] = useState<LcaResult | null>(null)
  const [configuredResult, setConfiguredResult] = useState<LcaResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imputationMeta, setImputationMeta] = useState<any[]>([])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [pathwayCosts, setPathwayCosts] = useState<PathwayCosts | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLcaData = async () => {
      setIsLoading(true)
      try {
        const configuredPayload = { project: config }
        const primaryPayload = { project: { ...config, recycledContent: 0 } }

        const [primaryResponse, configuredResponse] = await Promise.all([
          fetch("/api/impute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(primaryPayload),
          }),
          fetch("/api/impute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(configuredPayload),
          }),
        ])

        if (!primaryResponse.ok || !configuredResponse.ok) throw new Error("API error")

        const primaryData = await primaryResponse.json()
        const configuredData = await configuredResponse.json()

        setPrimaryResult(primaryData.project_imputed.results)
        setConfiguredResult(configuredData.project_imputed.results)
        setImputationMeta(configuredData.imputation_meta)

        // Calculate pathway costs
        const baselineConfig = { ...config, recycledContent: 0 }
        const costs = calculatePathwayCosts(
          baselineConfig,
          config,
          primaryData.project_imputed.results,
          configuredData.project_imputed.results,
          undefined, // Use default cost factors
          1000 // 1000 kg production volume
        )
        setPathwayCosts(costs)
      } catch (error) {
        console.error("Failed to fetch LCA data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLcaData()
  }, [config])

  const handleConfigChange = (field: keyof ProjectConfig, value: number) => {
    setConfig((prevConfig) => ({ ...prevConfig, [field]: value }))
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({ title: "Project name cannot be empty.", variant: "destructive" })
      return
    }

    if (!configuredResult) {
      toast({
        title: "Cannot save",
        description: "Please wait for results to be calculated.",
        variant: "destructive",
      })
      return
    }

    console.log("Attempting to save project:", {
      name: projectName,
      user_id: user?.id,
      configLength: Object.keys(config).length,
      hasResult: !!configuredResult
    })

    const { data, error } = await supabase.from("projects").insert([
      {
        name: projectName,
        project_data: {
          inputs: config,
          outputs: configuredResult,
        },
        user_id: user?.id,
      },
    ]).select()

    if (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      })
    } else {
      console.log("Project saved successfully:", data)
      toast({
        title: "Project Saved!",
        description: `"${projectName}" has been saved successfully.`,
      })
      setIsSaveDialogOpen(false)
      setProjectName("")
    }
  }

  const getRecommendation = () => {
    if (!configuredResult) return "Calculating..."
    const { gwpBreakdown } = configuredResult
    if (gwpBreakdown.materialProduction > gwpBreakdown.gridEnergy)
      return "Increasing recycled content has the largest impact on reducing GWP."
    if (gwpBreakdown.gridEnergy > gwpBreakdown.transport)
      return "Switching to a lower-emission energy grid would significantly reduce the carbon footprint."
    return "Consider optimizing transport distances."
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-[#f8f3e6]">
      {/* Header */}
      <header className="border-b bg-[#f8f3e6] print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Quick Compare</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-xl font-semibold text-slate-900">
                Quick Compare: Primary vs Recycled Aluminium
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Save Project Dialog */}
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    Save Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Save Project</DialogTitle>
                    <DialogDescription>
                      Give your project a name. This will save the current slider
                      configuration and results.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., High-Recycled Aluminium Study"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveProject}>Save Project</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Export Button */}
              <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export to PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Left Panel (reserved if needed later) */}
             <Card className="w-full min-h-[600px] bg-[#0A1A0A] py-[80px] border border-[#1F3321] text-white rounded-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold tracking-wide text-[#C6F6D5] flex items-center gap-2">
          <Recycle className="w-6 h-6 text-[#00FF66]" />
          Impact Calculator
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col lg:flex-row justify-between gap-12">
          {/* LEFT: Sliders */}
          <div className="flex-1 space-y-10">
            {/* Recycled Content */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Recycle className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">
                    % Recycled Content
                  </label>
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.recycledContent}%</span>
              </div>
              <Slider
                value={[config.recycledContent]}
                onValueChange={(value) => handleConfigChange("recycledContent", value[0])}
                max={100}
                step={5}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>

            {/* Grid Emissions */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">Grid Emissions</label>
                  {imputationMeta.length > 0 &&
                    imputationMeta[0].field === "energy_kWh_per_kg" && (
                      <ImputedBadge confidence={Math.round(imputationMeta[0].confidence * 100)} />
                    )}
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.gridEmissions} gCO₂/kWh</span>
              </div>
              <Slider
                value={[config.gridEmissions]}
                onValueChange={(value) => handleConfigChange("gridEmissions", value[0])}
                max={1000}
                step={25}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>

            {/* Transport Distance */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">
                    Transport Distance
                  </label>
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.transportDistance} km</span>
              </div>
              <Slider
                value={[config.transportDistance]}
                onValueChange={(value) => handleConfigChange("transportDistance", value[0])}
                max={5000}
                step={100}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>

            {/* Recycling Rate */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">
                    End-of-Life Recycling Rate
                  </label>
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.recyclingRate}%</span>
              </div>
              <Slider
                value={[config.recyclingRate]}
                onValueChange={(value) => handleConfigChange("recyclingRate", value[0])}
                max={100}
                step={5}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>

            {/* Energy Consumption */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">
                    Energy Consumption
                  </label>
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.energyConsumption} kWh/kg</span>
              </div>
              <Slider
                value={[config.energyConsumption]}
                onValueChange={(value) => handleConfigChange("energyConsumption", value[0])}
                max={50}
                step={0.1}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>

            {/* Smelting Energy */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">
                    Smelting Energy
                  </label>
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.smeltingEnergy} kWh/kg</span>
              </div>
              <Slider
                value={[config.smeltingEnergy]}
                onValueChange={(value) => handleConfigChange("smeltingEnergy", value[0])}
                max={20}
                step={0.1}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>

            {/* Water Usage */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">
                    Water Usage
                  </label>
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.waterUsage} L/kg</span>
              </div>
              <Slider
                value={[config.waterUsage]}
                onValueChange={(value) => handleConfigChange("waterUsage", value[0])}
                max={10}
                step={0.1}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>

            {/* Waste Generation */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-[#00FF66]" />
                  <label className="text-base font-semibold text-[#E2E8F0]">
                    Waste Generation
                  </label>
                </div>
                <span className="text-sm text-[#A0AEC0]">{config.wasteGeneration} kg/kg</span>
              </div>
              <Slider
                value={[config.wasteGeneration]}
                onValueChange={(value) => handleConfigChange("wasteGeneration", value[0])}
                max={1}
                step={0.01}
                className="[&_.bg-primary]:bg-[#00FF66]"
              />
            </div>
          </div>

          {/* RIGHT: Summary Panel */}
          <div className="flex-1 border border-[#1F3321] rounded-lg p-6 bg-[#0D1F0D] space-y-6">
            {/* Score + GWP */}
            {isLoading || !configuredResult ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Circularity Score</p>
                  <p className="text-5xl font-extrabold text-[#00FF66]">
                    {configuredResult.circularityScore}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total GWP</p>
                  <p className="text-4xl font-bold text-white">
                    {configuredResult.totalGwp} kg CO₂e
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {isLoading || !configuredResult ? (
              <Skeleton className="h-20 w-full rounded-lg" />
            ) : (
              <div className="p-4 bg-[#142814] border border-[#1F3321] rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#00FF66] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#00FF66]">Recommendation</p>
                    <p className="text-sm text-gray-300">{getRecommendation()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Summary */}
            {isLoading || !pathwayCosts || !primaryResult || !configuredResult ? (
              <Skeleton className="h-20 w-full rounded-lg" />
            ) : (
              <div className="p-4 bg-[#142814] border border-[#1F3321] rounded-lg">
                <CostSummary 
                  costs={pathwayCosts}
                  co2eSaved={Math.max(0, (primaryResult.totalGwp - configuredResult.totalGwp) * 1000)}
                  isCompact={true}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
          <div className="space-y-6"></div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Stacked Bar */}
            <Card>
             
              <CardContent>
                {isLoading || !primaryResult || !configuredResult ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <StackedBar primaryData={primaryResult} configuredData={configuredResult} />
                )}
              </CardContent>
            </Card>

            {/* Sankey Chart */}
            <Card>
              
              <CardContent>
                {isLoading || !configuredResult ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <Sankey config={config} data={configuredResult} />
                )}
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            {isLoading || !pathwayCosts || !primaryResult || !configuredResult ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <CostAnalysisCard 
                costs={pathwayCosts}
                co2eSaved={Math.max(0, (primaryResult.totalGwp - configuredResult.totalGwp) * 1000)}
              />
            )}

          </div>
        </div>
      </div>
    </div>
    </ProtectedPage>
  )
}
