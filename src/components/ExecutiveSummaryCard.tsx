"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import type { ExecutiveSummary } from "@/lib/report-types";

interface ExecutiveSummaryProps {
  data: ExecutiveSummary;
  className?: string;
}

export function ExecutiveSummaryCard({ data, className = "" }: ExecutiveSummaryProps) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.projectCount}</div>
            <div className="text-sm text-slate-600">Projects Analyzed</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{data.totalEmissions}</div>
            <div className="text-sm text-slate-600">Total GWP (kg CO₂ eq)</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.averageCircularityIndex}</div>
            <div className="text-sm text-slate-600">Avg Circularity Index</div>
          </div>
        </div>

        {/* Report Period */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <span>Report Period:</span>
          <Badge variant="outline">
            {new Date(data.reportPeriod.start).toLocaleDateString()} - {new Date(data.reportPeriod.end).toLocaleDateString()}
          </Badge>
        </div>

        {/* Key Findings */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800">Key Findings</h4>
          <ul className="space-y-2">
            {data.keyFindings.map((finding, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-slate-700">{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Recommendations */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800">Priority Recommendations</h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}