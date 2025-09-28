"use client"

import React, { useState } from "react"
import { Factory, Recycle, Package, Users, Trash2 } from "lucide-react"

// Define the prop types
interface ProjectConfig {
  recycledContent: number
  gridEmissions: number
  transportDistance: number
  recyclingRate: number
}

interface LcaResult {
  totalGwp: number
  gwpBreakdown: {
    materialProduction: number
    transport: number
    gridEnergy: number
  }
  totalEnergy: number
  circularityScore: number
}

interface SankeyProps {
  config: ProjectConfig
  data: LcaResult
}

interface TooltipData {
  x: number
  y: number
  title: string
  value: string
  color: string
  Icon: React.ElementType
}

export function Sankey({ config }: SankeyProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  // Flow values
  const virginInput = 100 - config.recycledContent
  const recycledInput = config.recycledContent
  const product = 100
  const usePhase = 100
  const recycled = config.recyclingRate
  const loss = 100 - recycled

  // Colors
  const colors = {
    virgin: "url(#virginGradient)",
    recycled: "url(#recycledGradient)",
    product: "url(#productGradient)",
    usePhase: "url(#usePhaseGradient)",
    loss: "url(#lossGradient)",
    flow: "#64748b",
  }

  // Chart dims
  const chartWidth = 800
  const chartHeight = 400
  const nodeWidth = 60
  const maxNodeHeight = 200

  // Node positions
  const nodes = {
    virginInput: { x: 50, y: 100, height: (virginInput / 100) * maxNodeHeight },
    recycledInput: { x: 50, y: 250, height: (recycledInput / 100) * maxNodeHeight },
    product: { x: 250, y: 150, height: maxNodeHeight },
    usePhase: { x: 450, y: 150, height: maxNodeHeight },
    recycledOutput: { x: 650, y: 100, height: (recycled / 100) * maxNodeHeight },
    loss: { x: 650, y: 250, height: (loss / 100) * maxNodeHeight },
  }

  nodes.recycledInput.y = 350 - nodes.recycledInput.height
  nodes.loss.y = 350 - nodes.loss.height

  // Tooltip handlers
  const handleMouseEnter = (
    e: React.MouseEvent,
    title: string,
    value: string,
    color: string,
    Icon: React.ElementType
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      title,
      value,
      color,
      Icon,
    })
  }
  const handleMouseLeave = () => setTooltip(null)

  // Curved path generator
  const createFlowPath = (
    x1: number,
    y1: number,
    height1: number,
    x2: number,
    y2: number,
    height2: number,
    sourceRatio: number = 1,
    targetRatio: number = 1
  ) => {
    const sourceY = y1 + (height1 * sourceRatio) / 2
    const targetY = y2 + (height2 * targetRatio) / 2
    const controlX = (x1 + x2) / 2
    return `M ${x1 + nodeWidth} ${sourceY} C ${controlX} ${sourceY}, ${controlX} ${targetY}, ${x2} ${targetY}`
  }

  return (
    <div className="bg-[#122315] rounded-xl shadow-md p-8 border border-gray-200/20">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Recycle className="w-6 h-6 text-emerald-400" />
          Material Flow Analysis
        </h3>
        <p className="text-sm text-gray-300">Circular economy material flows and recycling pathways</p>
      </div>

      {/* Chart */}
      <div className="relative overflow-hidden">
        <svg width="100%" height="400" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
          {/* Gradients */}
          <defs>
            <linearGradient id="virginGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="recycledGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="productGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="usePhaseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="lossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Flow paths */}
          {[
            ["virginInput", "product", 1, virginInput / 100],
            ["recycledInput", "product", 1, recycledInput / 100],
            ["product", "usePhase", 1, 1],
            ["usePhase", "recycledOutput", recycled / 100, 1],
            ["usePhase", "loss", loss / 100, 1],
          ].map(([from, to, sr, tr], i) => (
            <path
              key={i}
              d={createFlowPath(
                nodes[from as keyof typeof nodes].x,
                nodes[from as keyof typeof nodes].y,
                nodes[from as keyof typeof nodes].height,
                nodes[to as keyof typeof nodes].x,
                nodes[to as keyof typeof nodes].y,
                nodes[to as keyof typeof nodes].height,
                sr as number,
                tr as number
              )}
              stroke="#94a3b8"
              strokeWidth="3"
              fill="none"
              className="transition-all duration-300 opacity-60 hover:opacity-100 hover:stroke-emerald-400"
            />
          ))}

          {/* Nodes with icons */}
          {(
            [
              { key: "virginInput", val: virginInput, label: "Virgin Input", Icon: Factory, fill: colors.virgin },
              { key: "recycledInput", val: recycledInput, label: "Recycled Input", Icon: Recycle, fill: colors.recycled },
              { key: "product", val: product, label: "Product", Icon: Package, fill: colors.product },
              { key: "usePhase", val: usePhase, label: "Use Phase", Icon: Users, fill: colors.usePhase },
              { key: "recycledOutput", val: recycled, label: "Recycled", Icon: Recycle, fill: colors.recycled },
              { key: "loss", val: loss, label: "Loss", Icon: Trash2, fill: colors.loss },
            ] as {
              key: keyof typeof nodes
              val: number
              label: string
              Icon: React.ElementType
              fill: string
            }[]
          ).map(({ key, val, label, Icon, fill }, i) => (
            <g key={i}>
              <rect
                x={nodes[key].x}
                y={nodes[key].y}
                width={nodeWidth}
                height={nodes[key].height}
                fill={fill}
                rx="8"
                className="cursor-pointer transition-all duration-300 hover:brightness-110 drop-shadow-lg"
                onMouseEnter={(e) =>
                  handleMouseEnter(e, label, `${val.toFixed(0)}%`, fill, Icon)
                }
                onMouseLeave={handleMouseLeave}
              />
              <Icon
                className="absolute"
                x={nodes[key].x + nodeWidth / 2 - 10}
                y={nodes[key].y + 10}
                width={20}
                height={20}
                color="white"
              />
              <text
                x={nodes[key].x + nodeWidth / 2}
                y={nodes[key].y - 10}
                textAnchor="middle"
                className="text-sm font-semibold fill-white drop-shadow-md"
              >
                {label}
              </text>
              <text
                x={nodes[key].x + nodeWidth / 2}
                y={nodes[key].y + nodes[key].height + 18}
                textAnchor="middle"
                className="text-sm font-bold fill-emerald-300"
              >
                {val.toFixed(0)}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend with icons */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-200">
          {[
            { label: "Virgin Material", Icon: Factory, color: "#ef4444" },
            { label: "Recycled Material", Icon: Recycle, color: "#10b981" },
            { label: "Product", Icon: Package, color: "#3b82f6" },
            { label: "Use Phase", Icon: Users, color: "#8b5cf6" },
            { label: "Material Loss", Icon: Trash2, color: "#f97316" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <item.Icon className="w-4 h-4" style={{ color: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-center gap-2">
            <tooltip.Icon className="w-4 h-4" style={{ color: tooltip.color }} />
            <span className="font-medium">{tooltip.title}</span>
          </div>
          <div className="text-center font-bold">{tooltip.value}</div>
        </div>
      )}
    </div>
  )
}
