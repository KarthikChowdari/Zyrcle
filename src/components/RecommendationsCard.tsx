"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Zap,
  Truck,
  Recycle,
  Settings,
  Leaf
} from "lucide-react";
import type { RecommendationItem } from "@/lib/report-types";

interface RecommendationsCardProps {
  recommendations: RecommendationItem[];
  className?: string;
}

export function RecommendationsCard({ recommendations, className = "" }: RecommendationsCardProps) {
  const getImpactConfig = (impact: RecommendationItem['impact']) => {
    switch (impact) {
      case 'high':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'High Impact' };
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Medium Impact' };
      case 'low':
        return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Low Impact' };
    }
  };

  const getDifficultyConfig = (difficulty: RecommendationItem['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return { color: 'text-green-600', bg: 'bg-green-50', label: 'Easy' };
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' };
      case 'hard':
        return { color: 'text-red-600', bg: 'bg-red-50', label: 'Hard' };
    }
  };

  const getCategoryIcon = (category: RecommendationItem['category']) => {
    switch (category) {
      case 'material-selection':
        return <Leaf className="w-4 h-4" />;
      case 'process-optimization':
        return <Settings className="w-4 h-4" />;
      case 'end-of-life':
        return <Recycle className="w-4 h-4" />;
      case 'transport':
        return <Truck className="w-4 h-4" />;
      case 'energy':
        return <Zap className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    // Sort by impact (high first), then by potential reduction
    const impactOrder = { high: 3, medium: 2, low: 1 };
    if (impactOrder[a.impact] !== impactOrder[b.impact]) {
      return impactOrder[b.impact] - impactOrder[a.impact];
    }
    return b.potentialReduction - a.potentialReduction;
  });

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          AI-Generated Recommendations
        </CardTitle>
        <p className="text-sm text-slate-600">
          Actionable insights based on your project data and industry best practices
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {sortedRecommendations.reduce((sum, r) => sum + r.potentialReduction, 0).toFixed(1)}
            </div>
            <div className="text-xs text-slate-600">Total Potential Reduction</div>
            <div className="text-xs text-slate-500">kg CO₂ eq</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {sortedRecommendations.filter(r => r.impact === 'high').length}
            </div>
            <div className="text-xs text-slate-600">High Impact Actions</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {Math.round(sortedRecommendations.reduce((sum, r) => sum + r.confidence, 0) / sortedRecommendations.length)}%
            </div>
            <div className="text-xs text-slate-600">Avg Confidence</div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {sortedRecommendations.map((rec, index) => {
            const impactConfig = getImpactConfig(rec.impact);
            const difficultyConfig = getDifficultyConfig(rec.difficulty);
            const categoryIcon = getCategoryIcon(rec.category);

            return (
              <div
                key={rec.id}
                className={`p-4 border rounded-lg transition-all hover:shadow-md ${impactConfig.border} ${impactConfig.bg}`}
              >
                <div className="flex items-start gap-4">
                  
                  {/* Priority Number */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full ${impactConfig.bg} border-2 ${impactConfig.border} flex items-center justify-center font-bold text-sm ${impactConfig.color}`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                          {categoryIcon}
                          {rec.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                      </div>
                      
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-bold text-green-600">
                          -{rec.potentialReduction} kg
                        </div>
                        <div className="text-xs text-slate-500">CO₂ reduction</div>
                      </div>
                    </div>

                    {/* Badges and Metadata */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`${impactConfig.color} ${impactConfig.border}`}
                      >
                        {impactConfig.label}
                      </Badge>
                      
                      <Badge 
                        variant="outline"
                        className={`${difficultyConfig.color} ${difficultyConfig.bg}`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {difficultyConfig.label}
                      </Badge>
                      
                      <Badge variant="outline" className="text-slate-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {rec.confidence}% confidence
                      </Badge>
                      
                      <Badge variant="outline" className="text-slate-600 capitalize">
                        {rec.category.replace('-', ' ')}
                      </Badge>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        Learn More
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Implementation Priority Guide */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Implementation Priority Guide
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span><strong>High Impact:</strong> Immediate attention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span><strong>Medium Impact:</strong> Next quarter</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span><strong>Low Impact:</strong> Long-term planning</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}