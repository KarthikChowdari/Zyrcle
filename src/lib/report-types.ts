// Report-related TypeScript interfaces and types

export interface ReportConfig {
  title: string;
  description: string;
  reportType: 'sustainability' | 'lca' | 'circularity' | 'comprehensive';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeMetrics: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'csv';
  projects: string[];
  uploadedFiles?: string[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  material: string;
  productType?: string;
  region?: string;
  lastUpdated: string;
  status: 'completed' | 'in-progress' | 'draft';
  metrics?: {
    gwp?: number;
    circularityIndex?: number;
    recycledContent?: number;
  };
}

export interface ReportData {
  id: string;
  config: ReportConfig;
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  pages?: number;
  size?: string;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'executive-summary' | 'metrics' | 'charts' | 'data-table' | 'recommendations' | 'methodology';
  content: any;
  order: number;
}

export interface ExecutiveSummary {
  projectCount: number;
  totalEmissions: number;
  averageCircularityIndex: number;
  keyFindings: string[];
  recommendations: string[];
  reportPeriod: {
    start: string;
    end: string;
  };
}

export interface MetricsSection {
  totalGWP: number;
  averageGWP: number;
  emissionReduction: number;
  circularityMetrics: {
    averageIndex: number;
    recycledContentAvg: number;
    endOfLifeRecyclingRate: number;
  };
  materialBreakdown: {
    [material: string]: {
      count: number;
      totalEmissions: number;
      averageCircularity: number;
    };
  };
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'sankey' | 'scatter';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  categories?: string[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'material-selection' | 'process-optimization' | 'end-of-life' | 'transport' | 'energy';
  potentialReduction: number; // CO2 equivalent reduction
  confidence: number; // 0-100
}

export interface ReportGenerationRequest {
  config: ReportConfig;
  projectData?: ProjectSummary[];
  uploadedData?: any[];
}

export interface ReportGenerationResponse {
  success: boolean;
  reportId?: string;
  downloadUrl?: string;
  estimatedTime?: number; // minutes
  error?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  defaultConfig: Partial<ReportConfig>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ReportListResponse extends ApiResponse {
  data?: {
    reports: ReportData[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
}

export interface ProjectListResponse extends ApiResponse {
  data?: {
    projects: ProjectSummary[];
    totalCount: number;
  };
}

// Report Export types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeTables: boolean;
  includeCharts: boolean;
  includeRawData: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  chartResolution?: 'standard' | 'high';
}

export interface ReportMetadata {
  title: string;
  author: string;
  organization?: string;
  generatedAt: string;
  version: string;
  confidentiality: 'public' | 'internal' | 'confidential';
  tags: string[];
}

// Chart configuration types
export interface ChartConfig {
  title: string;
  type: ChartData['type'];
  width?: number;
  height?: number;
  showLegend: boolean;
  showGrid: boolean;
  colors?: string[];
  animations: boolean;
}

// File upload types
export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  processed: boolean;
  recordCount?: number;
  columns?: string[];
}

// Report validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}