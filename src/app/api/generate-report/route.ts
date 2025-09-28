import { NextRequest, NextResponse } from "next/server";
import { 
  ReportGenerationRequest, 
  ReportGenerationResponse, 
  ReportData,
  ExecutiveSummary,
  MetricsSection,
  ChartData,
  RecommendationItem
} from "@/lib/report-types";

// Mock data for demonstration - in production, this would connect to your database
const mockProjectsData = [
  {
    id: '1',
    name: 'Aluminium Beverage Can',
    material: 'Aluminium',
    productType: 'Beverage Can',
    region: 'EU',
    lastUpdated: '2024-12-15',
    status: 'completed' as const,
    metrics: {
      gwp: 2.1,
      circularityIndex: 0.75,
      recycledContent: 65
    }
  },
  {
    id: '2',
    name: 'Copper Wire Production',
    material: 'Copper',
    productType: 'Wire',
    region: 'US',
    lastUpdated: '2024-12-10',
    status: 'completed' as const,
    metrics: {
      gwp: 4.2,
      circularityIndex: 0.45,
      recycledContent: 30
    }
  },
  {
    id: '3',
    name: 'Recycled Steel Frame',
    material: 'Steel',
    productType: 'Frame',
    region: 'CN',
    lastUpdated: '2024-12-05',
    status: 'in-progress' as const,
    metrics: {
      gwp: 1.8,
      circularityIndex: 0.80,
      recycledContent: 90
    }
  },
];

// Helper function to generate executive summary
function generateExecutiveSummary(projectIds: string[]): ExecutiveSummary {
  const selectedProjects = mockProjectsData.filter(p => projectIds.includes(p.id));
  const totalEmissions = selectedProjects.reduce((sum, p) => sum + (p.metrics?.gwp || 0), 0);
  const avgCircularity = selectedProjects.reduce((sum, p) => sum + (p.metrics?.circularityIndex || 0), 0) / selectedProjects.length;
  
  return {
    projectCount: selectedProjects.length,
    totalEmissions: Math.round(totalEmissions * 100) / 100,
    averageCircularityIndex: Math.round(avgCircularity * 100) / 100,
    keyFindings: [
      `Analyzed ${selectedProjects.length} projects across different materials`,
      `Average GWP: ${Math.round((totalEmissions / selectedProjects.length) * 100) / 100} kg CO2 eq`,
      `Circularity index ranges from ${Math.min(...selectedProjects.map(p => p.metrics?.circularityIndex || 0))} to ${Math.max(...selectedProjects.map(p => p.metrics?.circularityIndex || 0))}`,
      selectedProjects.some(p => (p.metrics?.recycledContent || 0) > 50) ? 'High recycled content identified in multiple projects' : 'Opportunity for increased recycled content'
    ],
    recommendations: [
      'Focus on increasing recycled content to improve circularity scores',
      'Consider end-of-life optimization strategies',
      'Evaluate transport distance reduction opportunities'
    ],
    reportPeriod: {
      start: '2024-01-01',
      end: '2024-12-31'
    }
  };
}

// Helper function to generate metrics section
function generateMetricsSection(projectIds: string[]): MetricsSection {
  const selectedProjects = mockProjectsData.filter(p => projectIds.includes(p.id));
  const totalGWP = selectedProjects.reduce((sum, p) => sum + (p.metrics?.gwp || 0), 0);
  const avgGWP = totalGWP / selectedProjects.length;
  
  // Group by material
  const materialBreakdown = selectedProjects.reduce((acc, project) => {
    const material = project.material;
    if (!acc[material]) {
      acc[material] = {
        count: 0,
        totalEmissions: 0,
        averageCircularity: 0
      };
    }
    acc[material].count += 1;
    acc[material].totalEmissions += project.metrics?.gwp || 0;
    acc[material].averageCircularity += project.metrics?.circularityIndex || 0;
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages for each material
  Object.keys(materialBreakdown).forEach(material => {
    materialBreakdown[material].averageCircularity = 
      materialBreakdown[material].averageCircularity / materialBreakdown[material].count;
  });

  return {
    totalGWP: Math.round(totalGWP * 100) / 100,
    averageGWP: Math.round(avgGWP * 100) / 100,
    emissionReduction: Math.round(((avgGWP * 0.85) - avgGWP) * 100) / 100, // Mock 15% reduction potential
    circularityMetrics: {
      averageIndex: Math.round((selectedProjects.reduce((sum, p) => sum + (p.metrics?.circularityIndex || 0), 0) / selectedProjects.length) * 100) / 100,
      recycledContentAvg: Math.round((selectedProjects.reduce((sum, p) => sum + (p.metrics?.recycledContent || 0), 0) / selectedProjects.length) * 100) / 100,
      endOfLifeRecyclingRate: 75 // Mock value
    },
    materialBreakdown
  };
}

// Helper function to generate chart data
function generateChartData(projectIds: string[]): ChartData[] {
  const selectedProjects = mockProjectsData.filter(p => projectIds.includes(p.id));
  
  return [
    {
      type: 'bar',
      title: 'GWP by Project',
      data: selectedProjects.map(p => ({
        name: p.name,
        value: p.metrics?.gwp || 0,
        material: p.material
      })),
      xAxis: 'Project',
      yAxis: 'GWP (kg CO2 eq)'
    },
    {
      type: 'pie',
      title: 'Material Distribution',
      data: Object.entries(
        selectedProjects.reduce((acc, p) => {
          acc[p.material] = (acc[p.material] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([material, count]) => ({
        name: material,
        value: count
      }))
    },
    {
      type: 'scatter',
      title: 'Circularity Index vs GWP',
      data: selectedProjects.map(p => ({
        x: p.metrics?.circularityIndex || 0,
        y: p.metrics?.gwp || 0,
        name: p.name,
        material: p.material
      })),
      xAxis: 'Circularity Index',
      yAxis: 'GWP (kg CO2 eq)'
    }
  ];
}

// Helper function to generate recommendations
function generateRecommendations(projectIds: string[]): RecommendationItem[] {
  const selectedProjects = mockProjectsData.filter(p => projectIds.includes(p.id));
  const avgRecycledContent = selectedProjects.reduce((sum, p) => sum + (p.metrics?.recycledContent || 0), 0) / selectedProjects.length;
  
  const recommendations: RecommendationItem[] = [];
  
  if (avgRecycledContent < 70) {
    recommendations.push({
      id: 'rec-1',
      title: 'Increase Recycled Content',
      description: 'Current average recycled content is below optimal levels. Increasing to 70%+ can significantly improve circularity scores.',
      impact: 'high',
      difficulty: 'medium',
      category: 'material-selection',
      potentialReduction: 1.2,
      confidence: 85
    });
  }
  
  recommendations.push(
    {
      id: 'rec-2',
      title: 'Optimize Transport Distances',
      description: 'Evaluate supplier proximity and logistics optimization to reduce transport-related emissions.',
      impact: 'medium',
      difficulty: 'easy',
      category: 'transport',
      potentialReduction: 0.3,
      confidence: 75
    },
    {
      id: 'rec-3',
      title: 'Implement End-of-Life Strategy',
      description: 'Develop comprehensive take-back programs and design for disassembly to improve end-of-life outcomes.',
      impact: 'high',
      difficulty: 'hard',
      category: 'end-of-life',
      potentialReduction: 0.8,
      confidence: 70
    }
  );
  
  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportGenerationRequest = await request.json();
    const { config } = body;
    
    // Validate request
    if (!config.title || !config.reportType) {
      return NextResponse.json<ReportGenerationResponse>({
        success: false,
        error: "Missing required fields: title and reportType"
      }, { status: 400 });
    }
    
    if (config.projects.length === 0) {
      return NextResponse.json<ReportGenerationResponse>({
        success: false,
        error: "At least one project must be selected"
      }, { status: 400 });
    }
    
    // Simulate report generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate report data
    const reportId = `report-${Date.now()}`;
    const executiveSummary = generateExecutiveSummary(config.projects);
    const metricsSection = generateMetricsSection(config.projects);
    const chartData = generateChartData(config.projects);
    const recommendations = generateRecommendations(config.projects);
    
    const reportData: ReportData = {
      id: reportId,
      config,
      generatedAt: new Date().toISOString(),
      status: 'completed',
      downloadUrl: `/api/reports/${reportId}/download`,
      pages: 12,
      size: '2.4 MB',
      sections: [
        {
          id: 'exec-summary',
          title: 'Executive Summary',
          type: 'executive-summary',
          content: executiveSummary,
          order: 1
        },
        {
          id: 'metrics',
          title: 'Key Metrics',
          type: 'metrics',
          content: metricsSection,
          order: 2
        },
        {
          id: 'charts',
          title: 'Data Visualizations',
          type: 'charts',
          content: chartData,
          order: 3
        },
        {
          id: 'recommendations',
          title: 'AI Recommendations',
          type: 'recommendations',
          content: recommendations,
          order: 4
        }
      ]
    };
    
    // In production, save reportData to database
    console.log('Generated report:', reportData);
    
    return NextResponse.json<ReportGenerationResponse>({
      success: true,
      reportId: reportData.id,
      downloadUrl: reportData.downloadUrl,
      estimatedTime: 0 // Report is ready immediately in this mock
    });
    
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json<ReportGenerationResponse>({
      success: false,
      error: "Internal server error during report generation"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint could be used to get report status or list existing reports
    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');
    
    if (reportId) {
      // Return specific report status
      return NextResponse.json({
        success: true,
        data: {
          id: reportId,
          status: 'completed',
          downloadUrl: `/api/reports/${reportId}/download`
        }
      });
    }
    
    // Return list of recent reports (mock data)
    return NextResponse.json({
      success: true,
      data: {
        reports: [
          {
            id: 'report-1',
            config: { title: 'Q4 2024 Sustainability Report', reportType: 'comprehensive' },
            generatedAt: '2024-12-15T10:30:00Z',
            status: 'completed'
          }
        ],
        totalCount: 1
      }
    });
    
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}