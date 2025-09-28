"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, Zap } from "lucide-react"

interface LcaResult {
  gwpBreakdown: {
    materialProduction: number
    transport: number
    gridEnergy: number
  }
}

interface StackedBarProps {
  primaryData: LcaResult
  configuredData: LcaResult
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0)

    return (
      <div className="bg-[#122315] text-white border border-gray-700 rounded-xl shadow-xl p-4 min-w-[220px]">
        <p className="font-semibold text-lg mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold">{entry.value.toFixed(2)} kg CO₂e</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-2 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Total</span>
              <span className="text-sm font-bold text-orange-500">{total.toFixed(2)} kg CO₂e</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function StackedBar({ primaryData, configuredData }: StackedBarProps) {
  const data = [
    {
      pathway: "Primary Pathway",
      "Material Production": primaryData.gwpBreakdown.materialProduction,
      "Grid Energy": primaryData.gwpBreakdown.gridEnergy,
      Transport: primaryData.gwpBreakdown.transport,
    },
    {
      pathway: "Configured Pathway",
      "Material Production": configuredData.gwpBreakdown.materialProduction,
      "Grid Energy": configuredData.gwpBreakdown.gridEnergy,
      Transport: configuredData.gwpBreakdown.transport,
    },
  ]

  return (
    <div className="w-full py-16 px-6">
      <Card className="w-full bg-[#F8F4ED] border border-[#E5E3DD] shadow-md rounded-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-[#0A1F0A] tracking-tight">
            Global Warming Potential (kg CO₂e)
          </CardTitle>
          <CardDescription className="text-[#0A1F0A]/70 text-base font-medium">
            Breakdown by emission source (kg CO₂e)
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Chart */}
          <div className="w-full h-[420px] mb-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 50, bottom: 60 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="2 4" stroke="#D6D3CD" opacity={0.5} />

                <XAxis
                  dataKey="pathway"
                  tick={{ fill: "#0A1F0A", fontSize: 14, fontWeight: 600 }}
                  axisLine={{ stroke: "#C8C6BF" }}
                  tickLine={{ stroke: "#C8C6BF" }}
                  height={60}
                />

                <YAxis
                  label={{
                    value: "kg CO₂e",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fill: "#0A1F0A", fontSize: "13px", fontWeight: 600 },
                  }}
                  tick={{ fill: "#0A1F0A", fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: "#C8C6BF" }}
                  tickLine={{ stroke: "#C8C6BF" }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  wrapperStyle={{
                    paddingTop: "24px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#0A1F0A",
                  }}
                />

                <Bar dataKey="Material Production" stackId="a" fill="#3b82f6" name="Material Production" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Transport" stackId="a" fill="#10b981" name="Transport" />
                <Bar dataKey="Grid Energy" stackId="a" fill="#f59e0b" name="Grid Energy" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.map((pathway, index) => {
              const total = pathway["Material Production"] + pathway["Grid Energy"] + pathway["Transport"]
              return (
                <div
                  key={index}
                  className="bg-[#122315] rounded-2xl p-8 shadow-md hover:shadow-xl transition-all h-[320px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white text-xl">{pathway.pathway}</h4>
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                    </div>
                    <p className="text-5xl font-bold text-orange-500 mb-1">{total.toFixed(1)}</p>
                    <p className="text-sm text-white font-medium">Total CO₂ equivalent</p>
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2 text-white">
                        <Package className="w-4 h-4 text-blue-500" /> Material Production
                      </span>
                      <span className="font-semibold text-blue-500">
                        {((pathway["Material Production"] / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2 text-white">
                        <Truck className="w-4 h-4 text-emerald-500" /> Transport
                      </span>
                      <span className="font-semibold text-emerald-500">
                        {((pathway["Transport"] / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2 text-white">
                        <Zap className="w-4 h-4 text-amber-500" /> Grid Energy
                      </span>
                      <span className="font-semibold text-amber-500">
                        {((pathway["Grid Energy"] / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
