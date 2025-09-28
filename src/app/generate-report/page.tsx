"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Download, Upload, Settings, Calendar, Loader2, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import ProtectedPage from "@/components/ProtectedPage";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { ReportConfig, ProjectSummary, ReportGenerationRequest, ReportGenerationResponse } from "@/lib/report-types";
import { downloadUtils } from "@/lib/download-utils";

// Types are now imported from lib/report-types.ts

export default function GenerateReportPage() {
  const { user } = useAuth()
  const { toast } = useToast();
  
  const [config, setConfig] = useState<ReportConfig>({
    title: "",
    description: "",
    reportType: 'comprehensive',
    dateRange: {
      start: "",
      end: ""
    },
    includeCharts: true,
    includeMetrics: true,
    includeRecommendations: true,
    format: 'pdf',
    projects: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedReport, setGeneratedReport] = useState<{ reportId: string; downloadUrl: string; } | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        if (data.success) {
          setAvailableProjects(data.projects);
        } else {
          toast({
            title: "Error loading projects",
            description: data.message || "Failed to load your projects",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error loading projects",
          description: "Failed to load your projects",
          variant: "destructive",
        });
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user, toast]);

  // Function to trigger file download
  const triggerDownload = (downloadUrl: string, reportId: string, format: string) => {
    try {
      const filename = downloadUtils.generateFilename(reportId, config.title, format);
      const success = downloadUtils.triggerDownload(downloadUrl, filename);
      
      if (success) {
        // Show additional success message
        setTimeout(() => {
          toast({
            title: "Download started!",
            description: `Your ${format.toUpperCase()} report is being downloaded.`,
          });
        }, 1000);
      } else {
        throw new Error('Download trigger failed');
      }
    } catch (error) {
      console.error('Download trigger error:', error);
      toast({
        title: "Download failed",
        description: "Could not start the download. Please try again or check your browser settings.",
        variant: "destructive",
      });
      
      // Fallback: open in new tab
      if (downloadUrl) {
        downloadUtils.previewReport(downloadUrl);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setUploadedFile(file);
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded and will be included in the report.`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file only.",
          variant: "destructive",
        });
      }
    }
  };

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      projects: checked 
        ? [...prev.projects, projectId]
        : prev.projects.filter(id => id !== projectId)
    }));
  };

  const handleGenerateReport = async () => {
    if (!config.title.trim()) {
      toast({
        title: "Report title required",
        description: "Please enter a title for your report.",
        variant: "destructive",
      });
      return;
    }

    if (config.projects.length === 0 && !uploadedFile) {
      toast({
        title: "No data selected",
        description: "Please select at least one project or upload a data file.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const requestData: ReportGenerationRequest = {
        config,
        projectData: availableProjects.filter(p => config.projects.includes(p.id)),
        uploadedData: uploadedFile ? [{ filename: uploadedFile.name, size: uploadedFile.size }] : undefined
      };

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result: ReportGenerationResponse = await response.json();

      if (result.success) {
        toast({
          title: "Report generated successfully!",
          description: `Your ${config.reportType} report "${config.title}" has been generated and is ready for download.`,
        });
        
        // Store report info for manual download
        if (result.downloadUrl && result.reportId) {
          setGeneratedReport({
            reportId: result.reportId,
            downloadUrl: result.downloadUrl
          });
          
          // Automatically trigger download
          triggerDownload(result.downloadUrl, result.reportId, config.format);
        }
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Report generation failed",
        description: error instanceof Error ? error.message : "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-[#f8f3e6]">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Generate Report</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Report
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Page Header */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-800">Generate Custom Report</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Create comprehensive sustainability and LCA reports from your project data. 
                Include charts, metrics, and actionable recommendations.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Report Configuration
                    </CardTitle>
                    <CardDescription>
                      Define the basic parameters for your report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Report Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Q4 2024 Sustainability Report"
                          value={config.title}
                          onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reportType">Report Type</Label>
                        <Select 
                          value={config.reportType} 
                          onValueChange={(value: any) => setConfig(prev => ({ ...prev, reportType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                            <SelectItem value="sustainability">Sustainability Focus</SelectItem>
                            <SelectItem value="lca">LCA Analysis Only</SelectItem>
                            <SelectItem value="circularity">Circularity Metrics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the report purpose and scope..."
                        value={config.description}
                        onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={config.dateRange.start}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, start: e.target.value }
                          }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={config.dateRange.end}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, end: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="format">Export Format</Label>
                        <Select 
                          value={config.format} 
                          onValueChange={(value: any) => setConfig(prev => ({ ...prev, format: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF Report</SelectItem>
                            <SelectItem value="excel">Excel Workbook</SelectItem>
                            <SelectItem value="csv">CSV Data</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Data Sources
                    </CardTitle>
                    <CardDescription>
                      Select projects or upload additional data to include in the report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Project Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Your Projects</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {loadingProjects ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                                  <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : availableProjects.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm">No projects found</p>
                            <p className="text-xs mt-1">Create some projects first to include in your reports</p>
                          </div>
                        ) : (
                          availableProjects.map((project) => (
                            <div key={project.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <Checkbox
                                id={project.id}
                                checked={config.projects.includes(project.id)}
                                onCheckedChange={(checked) => handleProjectSelection(project.id, checked as boolean)}
                              />
                              <div className="flex-1 min-w-0">
                                <label htmlFor={project.id} className="text-sm font-medium cursor-pointer">
                                  {project.name}
                                </label>
                                <p className="text-xs text-slate-500">
                                  {project.material} • Updated {project.lastUpdated} • 
                                  <span className="ml-1 capitalize text-green-600">
                                    {project.status}
                                  </span>
                                  {project.metrics?.gwp && (
                                    <span className="ml-2">
                                      {project.metrics.gwp.toFixed(1)} kg CO₂e
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Upload Additional Data</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 mb-1">
                            Click to upload CSV file or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">CSV files only, up to 10MB</p>
                        </label>
                        
                        {uploadedFile && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm text-green-700">
                              ✓ {uploadedFile.name} uploaded successfully
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Report Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Content Options</CardTitle>
                    <CardDescription>
                      Customize what to include in your generated report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeCharts"
                          checked={config.includeCharts}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeCharts: checked as boolean }))}
                        />
                        <label htmlFor="includeCharts" className="text-sm font-medium cursor-pointer">
                          Charts & Visualizations
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeMetrics"
                          checked={config.includeMetrics}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeMetrics: checked as boolean }))}
                        />
                        <label htmlFor="includeMetrics" className="text-sm font-medium cursor-pointer">
                          Key Metrics & KPIs
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeRecommendations"
                          checked={config.includeRecommendations}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeRecommendations: checked as boolean }))}
                        />
                        <label htmlFor="includeRecommendations" className="text-sm font-medium cursor-pointer">
                          AI Recommendations
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary & Action Panel */}
              <div className="space-y-6">
                
                {/* Report Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Report Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Type:</span>
                        <span className="font-medium capitalize">{config.reportType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Format:</span>
                        <span className="font-medium uppercase">{config.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Projects:</span>
                        <span className="font-medium">{config.projects.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Data Files:</span>
                        <span className="font-medium">{uploadedFile ? 1 : 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Card>
                  <CardContent className="pt-6">
                    {!generatedReport ? (
                      <Button
                        onClick={handleGenerateReport}
                        disabled={isGenerating || !config.title.trim()}
                        className="w-full bg-[#122315] hover:bg-green-700 text-white font-semibold py-3"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={() => triggerDownload(generatedReport.downloadUrl, generatedReport.reportId, config.format)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download {config.format.toUpperCase()} Report
                        </Button>
                        
                        <Button
                          onClick={() => {
                            setGeneratedReport(null);
                            setConfig(prev => ({ ...prev, title: "" }));
                          }}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          Generate New Report
                        </Button>
                      </div>
                    )}
                    
                    {!generatedReport && !config.title.trim() && (
                      <p className="text-xs text-slate-500 text-center mt-2">
                        Enter a report title to continue
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Help Information */}
                {!generatedReport ? (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Report Generation</AlertTitle>
                    <AlertDescription className="text-sm">
                      Reports typically take 2-5 minutes to generate depending on the amount of data and complexity.
                      You'll receive a notification when ready for download.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Report Ready!</AlertTitle>
                    <AlertDescription className="text-sm text-green-700">
                      Your report has been generated successfully. Click the download button above to save it to your device.
                      If the download doesn't start automatically, try the manual download button.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </ProtectedPage>
  );
}