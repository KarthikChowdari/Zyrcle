"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Eye, 
  Share2, 
  FileText, 
  Calendar,
  Clock,
  Users,
  BarChart3
} from "lucide-react";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { MetricsSectionCard } from "./MetricsSectionCard";
import { RecommendationsCard } from "./RecommendationsCard";
import type { ReportData } from "@/lib/report-types";

interface ReportPreviewProps {
  reportData: ReportData;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

// Helper function to trigger download
const triggerReportDownload = (reportData: ReportData) => {
  if (reportData.downloadUrl) {
    const link = document.createElement('a');
    link.href = reportData.downloadUrl;
    link.download = `zyrcle-report-${reportData.id}.${reportData.config.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export function ReportPreview({ reportData, onDownload, onShare, className = "" }: ReportPreviewProps) {
  const [activeSection, setActiveSection] = useState<string>("executive-summary");

  const getStatusColor = (status: ReportData['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'generating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getActiveSection = () => {
    return reportData.sections.find(section => section.type === activeSection);
  };

  const renderSectionContent = () => {
    const section = getActiveSection();
    if (!section) return <div>Section not found</div>;

    switch (section.type) {
      case 'executive-summary':
        return <ExecutiveSummaryCard data={section.content} />;
      case 'metrics':
        return <MetricsSectionCard data={section.content} />;
      case 'recommendations':
        return <RecommendationsCard recommendations={section.content} />;
      case 'charts':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Data Visualizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.content.map((chart: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{chart.title}</h4>
                    <div className="h-32 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                      {chart.type.toUpperCase()} Chart Preview
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-slate-500">
                Section content not available for preview
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-800">{reportData.config.title}</h1>
                <Badge className={getStatusColor(reportData.status)}>
                  {reportData.status.charAt(0).toUpperCase() + reportData.status.slice(1)}
                </Badge>
              </div>
              
              {reportData.config.description && (
                <p className="text-slate-600">{reportData.config.description}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Generated: {formatDate(reportData.generatedAt)}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Type: {reportData.config.reportType.charAt(0).toUpperCase() + reportData.config.reportType.slice(1)}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Projects: {reportData.config.projects.length}
                </div>
                {reportData.pages && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Pages: {reportData.pages}
                  </div>
                )}
                {reportData.size && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Size: {reportData.size}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={onDownload || (() => triggerReportDownload(reportData))} 
                className="bg-[#122315] hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {reportData.config.format.toUpperCase()}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            {reportData.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.type)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === section.type
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {section.title}
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Section Content */}
      <div className="min-h-[400px]">
        {renderSectionContent()}
      </div>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Format:</span>
              <div className="font-medium mt-1">{reportData.config.format.toUpperCase()}</div>
            </div>
            <div>
              <span className="text-slate-600">Include Charts:</span>
              <div className="font-medium mt-1">{reportData.config.includeCharts ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <span className="text-slate-600">Include Metrics:</span>
              <div className="font-medium mt-1">{reportData.config.includeMetrics ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <span className="text-slate-600">AI Recommendations:</span>
              <div className="font-medium mt-1">{reportData.config.includeRecommendations ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          {reportData.config.dateRange.start && reportData.config.dateRange.end && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-slate-600">Date Range:</span>
              <div className="font-medium mt-1">
                {new Date(reportData.config.dateRange.start).toLocaleDateString()} - {new Date(reportData.config.dateRange.end).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}