import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { PathwayCosts, formatCostDisplay, getCostEfficiencyRating, getCostBreakdown } from '@/lib/cost-calculations';

interface CostAnalysisCardProps {
  costs: PathwayCosts;
  co2eSaved: number;
  className?: string;
}

export function CostAnalysisCard({ costs, co2eSaved, className = '' }: CostAnalysisCardProps) {
  const efficiency = getCostEfficiencyRating(costs.costPerKgCO2eSaved);
  const breakdown = getCostBreakdown(costs);

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <DollarSign className="w-5 h-5" />
          Cost Analysis
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-purple-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Additional costs required to achieve the configured pathway compared to baseline scenario</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Cost Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Additional Cost</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatCostDisplay(costs.totalAdditionalCost)}
                </p>
                <p className="text-xs text-purple-500 mt-1">Per 1000 kg production</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Cost per CO₂e Saved</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatCostDisplay(costs.costPerKgCO2eSaved)}
                </p>
                <p className="text-xs text-purple-500 mt-1">Per kg CO₂e reduced</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency Rating */}
        <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Cost Efficiency</p>
              <Badge variant="secondary" className={`${efficiency.color} bg-transparent border mt-2`}>
                {efficiency.rating}
              </Badge>
              <p className="text-xs text-purple-500 mt-1">{efficiency.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">{co2eSaved.toFixed(2)} kg</p>
              <p className="text-xs text-purple-500">CO₂e saved annually</p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        {breakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-purple-800">Cost Breakdown</h4>
            <div className="space-y-2">
              {breakdown.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-purple-700">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-purple-800">
                      {formatCostDisplay(item.amount)}
                    </span>
                    <span className="text-xs text-purple-500 ml-2">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-purple-200">
          <div className="text-center">
            <p className="text-lg font-bold text-purple-800">
              {formatCostDisplay(costs.costPerTonneCO2eSaved)}
            </p>
            <p className="text-xs text-purple-600">Per tonne CO₂e</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-800">
              {costs.totalAdditionalCost > 0 ? 
                ((co2eSaved * 1000 * 47) / costs.totalAdditionalCost).toFixed(1) : '∞'}
            </p>
            <p className="text-xs text-purple-600">ROI Years*</p>
          </div>
        </div>
        
        <p className="text-xs text-purple-500 text-center">
          *Based on carbon pricing at ₹47/tonne CO₂e (India's carbon tax equivalent)
        </p>
      </CardContent>
    </Card>
  );
}

interface CostSummaryProps {
  costs: PathwayCosts;
  co2eSaved: number;
  isCompact?: boolean;
}

export function CostSummary({ costs, co2eSaved, isCompact = false }: CostSummaryProps) {
  const efficiency = getCostEfficiencyRating(costs.costPerKgCO2eSaved);

  if (isCompact) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-800">Additional Cost</p>
            <p className="text-lg font-bold text-purple-900">
              {formatCostDisplay(costs.totalAdditionalCost)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-purple-800">Cost/CO₂e</p>
            <p className="text-lg font-bold text-purple-900">
              {formatCostDisplay(costs.costPerKgCO2eSaved)}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Badge variant="secondary" className={`${efficiency.color} bg-transparent border text-xs`}>
            {efficiency.rating}
          </Badge>
          <span className="text-xs text-purple-600">
            {co2eSaved.toFixed(2)} kg CO₂e saved
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-purple-600">Total Cost</p>
          <p className="text-xl font-bold text-purple-800">
            {formatCostDisplay(costs.totalAdditionalCost)}
          </p>
        </div>
        <div>
          <p className="text-sm text-purple-600">Cost per CO₂e</p>
          <p className="text-xl font-bold text-purple-800">
            {formatCostDisplay(costs.costPerKgCO2eSaved)}
          </p>
        </div>
        <div>
          <p className="text-sm text-purple-600">Efficiency</p>
          <Badge variant="secondary" className={`${efficiency.color} bg-transparent border`}>
            {efficiency.rating}
          </Badge>
        </div>
      </div>
    </div>
  );
}