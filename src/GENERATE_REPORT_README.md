# Generate Report Feature

## Overview

The Generate Report feature allows users to create comprehensive sustainability and LCA (Life Cycle Assessment) reports from their project data. This feature includes data visualization, AI-powered recommendations, and multiple export formats.

## Components Structure

### Pages
- **`/app/generate-report/page.tsx`** - Main report generation page with configuration form
- **`/app/api/generate-report/route.ts`** - API endpoint for processing report requests

### Components
- **`ExecutiveSummaryCard.tsx`** - Displays key metrics and findings overview
- **`MetricsSectionCard.tsx`** - Shows detailed performance metrics and circularity data
- **`RecommendationsCard.tsx`** - AI-generated actionable recommendations
- **`ReportPreview.tsx`** - Full report preview with tabbed sections

### Types
- **`/lib/report-types.ts`** - Comprehensive TypeScript interfaces for all report-related data

## Features

### 1. Report Configuration
- **Report Types**: Sustainability, LCA, Circularity, or Comprehensive
- **Custom Titles & Descriptions**: Personalized report branding
- **Date Range Selection**: Filter data by specific time periods
- **Export Formats**: PDF, Excel, and CSV options
- **Content Options**: Toggle charts, metrics, and recommendations

### 2. Data Sources
- **Project Selection**: Choose from existing completed projects
- **File Upload**: Support for CSV data uploads
- **Material Filtering**: Automatic categorization by material type
- **Status Filtering**: Include completed, in-progress, or draft projects

### 3. Report Sections

#### Executive Summary
- Project count and total emissions
- Average circularity index
- Key findings with bullet points
- Priority recommendations overview

#### Key Metrics
- Total and average GWP (Global Warming Potential)
- Circularity metrics breakdown
- Material-specific performance
- Emission reduction potential

#### Data Visualizations
- Bar charts for GWP comparison
- Pie charts for material distribution
- Scatter plots for circularity vs emissions
- Sankey diagrams for material flows

#### AI Recommendations
- Impact-based prioritization (High/Medium/Low)
- Confidence scores for each recommendation
- Implementation difficulty assessment
- Potential CO₂ reduction calculations
- Category-based organization

### 4. Export & Sharing
- Multiple format support (PDF, Excel, CSV)
- Shareable report URLs
- Download progress tracking
- Report metadata preservation

## API Endpoints

### POST `/api/generate-report`
Generates a new report based on provided configuration.

**Request Body:**
```typescript
{
  config: ReportConfig,
  projectData?: ProjectSummary[],
  uploadedData?: any[]
}
```

**Response:**
```typescript
{
  success: boolean,
  reportId?: string,
  downloadUrl?: string,
  estimatedTime?: number,
  error?: string
}
```

### GET `/api/generate-report?reportId={id}`
Retrieves the status and details of a specific report.

## Usage Examples

### Basic Report Generation
```typescript
const config: ReportConfig = {
  title: "Q4 2024 Sustainability Report",
  reportType: "comprehensive",
  projects: ["project-1", "project-2"],
  format: "pdf",
  includeCharts: true,
  includeMetrics: true,
  includeRecommendations: true
};
```

### Custom Date Range
```typescript
const config: ReportConfig = {
  // ... other config
  dateRange: {
    start: "2024-01-01",
    end: "2024-12-31"
  }
};
```

## Component Usage

### Executive Summary Card
```tsx
import { ExecutiveSummaryCard } from "@/components/ExecutiveSummaryCard";

<ExecutiveSummaryCard 
  data={executiveSummaryData} 
  className="mb-6" 
/>
```

### Metrics Section Card
```tsx
import { MetricsSectionCard } from "@/components/MetricsSectionCard";

<MetricsSectionCard 
  data={metricsData} 
  className="mb-6" 
/>
```

### Recommendations Card
```tsx
import { RecommendationsCard } from "@/components/RecommendationsCard";

<RecommendationsCard 
  recommendations={recommendationsArray} 
  className="mb-6" 
/>
```

### Full Report Preview
```tsx
import { ReportPreview } from "@/components/ReportPreview";

<ReportPreview 
  reportData={fullReportData}
  onDownload={() => handleDownload()}
  onShare={() => handleShare()}
/>
```

## Data Flow

1. **User Configuration**: User selects report parameters on the generate-report page
2. **Data Collection**: System gathers project data and uploaded files
3. **API Processing**: POST request to `/api/generate-report` with configuration
4. **Report Generation**: Server processes data and generates report sections
5. **Response**: API returns report ID and download URL
6. **Preview/Download**: User can preview or download the generated report

## Styling & Theme

The components follow the existing design system:
- **Primary Colors**: Green theme (`#122315`, `#f8f3e6`)
- **Component Library**: shadcn/ui components
- **Animation**: Framer Motion for smooth transitions
- **Icons**: Lucide React icons throughout
- **Responsive**: Mobile-first responsive design

## File Structure

```
src/
├── app/
│   ├── generate-report/
│   │   └── page.tsx
│   └── api/
│       └── generate-report/
│           └── route.ts
├── components/
│   ├── ExecutiveSummaryCard.tsx
│   ├── MetricsSectionCard.tsx
│   ├── RecommendationsCard.tsx
│   └── ReportPreview.tsx
└── lib/
    └── report-types.ts
```

## Future Enhancements

- **Scheduled Reports**: Automatic report generation on a schedule
- **Template Library**: Pre-built report templates for different industries
- **Advanced Visualizations**: Interactive charts and custom chart builders
- **Collaboration**: Multi-user report editing and commenting
- **Integration**: API integrations with external data sources
- **White-labeling**: Custom branding and styling options

## Testing

The feature includes comprehensive error handling and validation:
- Form validation for required fields
- File upload validation (CSV only, size limits)
- API error handling with user-friendly messages
- Loading states and progress indicators
- Toast notifications for user feedback