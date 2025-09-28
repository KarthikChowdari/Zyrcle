"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Target, Recycle } from "lucide-react";
import type { MetricsSection } from "@/lib/report-types";

interface MetricsSectionProps {
  data: MetricsSection;
  className?: string;
}

export function MetricsSectionCard({ data, className = "" }: MetricsSectionProps) {
  const getEmissionTrend = (reduction: number) => {
    const isPositive = reduction < 0; // Negative reduction means actual reduction in emissions
    return {
      icon: isPositive ? TrendingDown : TrendingUp,
      color: isPositive ? "text-green-600" : "text-red-600",
      bgColor: isPositive ? "bg-green-50" : "bg-red-50",
      label: isPositive ? "Potential Reduction" : "Increase Risk"
    };
  };

  const emissionTrend = getEmissionTrend(data.emissionReduction);
  const EmissionIcon = emissionTrend.icon;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Key Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-xl font-bold text-slate-800">{data.totalGWP}</div>
            <div className="text-xs text-slate-600">Total GWP</div>
            <div className="text-xs text-slate-500">kg CO₂ eq</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{data.averageGWP}</div>
            <div className="text-xs text-slate-600">Average GWP</div>
            <div className="text-xs text-slate-500">per project</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{data.circularityMetrics.averageIndex}</div>
            <div className="text-xs text-slate-600">Circularity Index</div>
            <div className="text-xs text-slate-500">0-1 scale</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{data.circularityMetrics.recycledContentAvg}%</div>
            <div className="text-xs text-slate-600">Recycled Content</div>
            <div className="text-xs text-slate-500">average</div>
          </div>
        </div>

        {/* Emission Reduction Potential */}
        <div className={`p-4 rounded-lg ${emissionTrend.bgColor}`}>
          <div className="flex items-center gap-3">
            <EmissionIcon className={`w-6 h-6 ${emissionTrend.color}`} />
            <div>
              <div className="font-semibold text-slate-800">
                {Math.abs(data.emissionReduction)} kg CO₂ eq {emissionTrend.label}
              </div>
              <div className="text-sm text-slate-600">
                Based on optimization recommendations
              </div>
            </div>
          </div>
        </div>

        {/* Circularity Metrics Detail */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <Recycle className="w-4 h-4" />
            Circularity Breakdown
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-slate-600">Recycled Content</span>
              <Badge variant="outline">{data.circularityMetrics.recycledContentAvg}%</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-slate-600">End-of-Life Rate</span>
              <Badge variant="outline">{data.circularityMetrics.endOfLifeRecyclingRate}%</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm text-slate-600">Circularity Index</span>
              <Badge variant="outline">{data.circularityMetrics.averageIndex}</Badge>
            </div>
          </div>
        </div>

        {/* Material Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Material Performance
          </h4>
          
          <div className="space-y-3">
            {Object.entries(data.materialBreakdown).map(([material, metrics]) => (
              <div key={material} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-slate-800">{material}</h5>
                  <Badge>{metrics.count} project{metrics.count !== 1 ? 's' : ''}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Emissions:</span>
                    <span className="font-medium">{Math.round(metrics.totalEmissions * 100) / 100} kg CO₂</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Avg Circularity:</span>
                    <span className="font-medium">{Math.round(metrics.averageCircularity * 100) / 100}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}