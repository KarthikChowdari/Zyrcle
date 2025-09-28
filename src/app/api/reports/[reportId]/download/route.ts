import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const reportId = params.reportId;
    
    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Fetch report data from database using reportId
    // 2. Generate actual PDF/Excel/CSV file
    // 3. Return the file as a download

    // For now, we'll generate a mock CSV file as an example
    const mockReportData = generateMockReportCSV(reportId);
    
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="report-${reportId}.csv"`);
    
    return new NextResponse(mockReportData, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}

function generateMockReportCSV(reportId: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const csvContent = `Zyrcle LCA Report - ${reportId}
Generated: ${currentDate}

Executive Summary
Metric,Value,Unit
Total Projects,3,count
Total GWP,8.1,kg CO2 eq
Average Circularity Index,0.67,0-1 scale
Average Recycled Content,61.7,%

Project Details
Project Name,Material,GWP,Circularity Index,Recycled Content,%
Aluminium Beverage Can,Aluminium,2.1,0.75,65
Copper Wire Production,Copper,4.2,0.45,30
Recycled Steel Frame,Steel,1.8,0.80,90

Material Performance
Material,Project Count,Total Emissions,Average Circularity
Aluminium,1,2.1,0.75
Copper,1,4.2,0.45
Steel,1,1.8,0.80

Recommendations
Priority,Title,Impact,Potential Reduction (kg CO2),Confidence %
1,Increase Recycled Content,High,1.2,85
2,Optimize Transport Distances,Medium,0.3,75
3,Implement End-of-Life Strategy,High,0.8,70

Report Configuration
Setting,Value
Report Type,Comprehensive
Format,CSV
Include Charts,True
Include Metrics,True
Include Recommendations,True
Projects Selected,3

Footer
© 2025 Zyrcle - AI-Assisted LCA & Circularity Analysis
Generated at: ${new Date().toISOString()}
Report ID: ${reportId}`;

  return csvContent;
}