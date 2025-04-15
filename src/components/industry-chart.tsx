"use client"

import { useState, useEffect, useMemo, memo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockData } from "@/lib/data-processor";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  TooltipItem
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Performance optimizations for Chart.js
ChartJS.defaults.datasets.pie.animation = false;
ChartJS.defaults.datasets.doughnut.animation = false;
ChartJS.defaults.animation = false;
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

interface IndustryChartProps {
  mappedSymbols: StockData[];
}

// Export chart methods for parent components
export interface ChartRef {
  downloadChart: () => void;
  downloadChartWithData: () => void;
}

export interface IndustryChartRef {
  downloadChart: () => void;
  downloadChartWithData: () => void;
}

export const IndustryChart = forwardRef<IndustryChartRef, IndustryChartProps>(
  ({ mappedSymbols }, ref) => {
    const [activeTab, setActiveTab] = useState("pie");
    const [isClient, setIsClient] = useState(false);

    // Create refs for the charts
    const pieChartRef = useRef<ChartRef>(null);
    const doughnutChartRef = useRef<ChartRef>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      downloadChart: () => {
        if (activeTab === "pie" && pieChartRef.current) {
          pieChartRef.current.downloadChart();
        } else if (activeTab === "doughnut" && doughnutChartRef.current) {
          doughnutChartRef.current.downloadChart();
        }
      },
      downloadChartWithData: () => {
        if (activeTab === "pie" && pieChartRef.current) {
          pieChartRef.current.downloadChartWithData();
        } else if (activeTab === "doughnut" && doughnutChartRef.current) {
          doughnutChartRef.current.downloadChartWithData();
        }
      }
    }));

    // Use useEffect to set isClient to true once component is mounted
    // This prevents hydration errors with chart rendering
    useEffect(() => {
      setIsClient(true);
    }, []);

    // Use useMemo to optimize expensive calculations
    const { industries, chartData, industryPercentages, totalSymbols } = useMemo(() => {
      if (!mappedSymbols.length) {
        return { industries: {}, chartData: null, industryPercentages: [], totalSymbols: 0 };
      }

      // Group symbols by industry and count them
      const industryCount: Record<string, number> = {};

      mappedSymbols.forEach((stock) => {
        const industry = stock.industry || 'Unknown';
        industryCount[industry] = (industryCount[industry] || 0) + 1;
      });

      const totalSymbols = mappedSymbols.length;

      // Generate colors for each industry (using HSL for better distribution)
      const industryNames = Object.keys(industryCount);
      const colorStep = 360 / industryNames.length;

      // Pre-compute colors for better performance
      const backgroundColors = industryNames.map((_, index) =>
        `hsla(${index * colorStep}, 70%, 60%, 0.8)`
      );

      const borderColors = industryNames.map((_, index) =>
        `hsla(${index * colorStep}, 70%, 50%, 1)`
      );

      // Prepare chart data
      const data = {
        labels: industryNames,
        datasets: [
          {
            data: Object.values(industryCount),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      };

      // Calculate percentages for each industry
      const industryPercentages = Object.entries(industryCount).map(([industry, count]) => ({
        industry,
        count,
        percentage: ((count / totalSymbols) * 100).toFixed(1)
      }));

      // Sort industries by count (descending)
      industryPercentages.sort((a, b) => b.count - a.count);

      return {
        industries: industryCount,
        chartData: data,
        industryPercentages,
        totalSymbols
      };
    }, [mappedSymbols]);

    // Options for the charts - using useMemo to prevent unnecessary recalculations
    const options = useMemo(() => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // Disable animation for better performance
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 8,
          cornerRadius: 4,
          caretSize: 5,
          usePointStyle: true,
          boxPadding: 4,
          callbacks: {
            label: function(context: TooltipItem<'pie' | 'doughnut'>) {
              const label = context.label || '';
              const value = context.raw as number || 0;
              const percentage = ((value / totalSymbols) * 100).toFixed(1);
              return `${label}: ${value} symbols (${percentage}%)`;
            }
          }
        }
      },
      // Simplified hover configuration
      hover: {
        mode: 'nearest',
        intersect: true,
      },
      elements: {
        arc: {
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }
      },
      layout: {
        padding: 8
      }
    }), [totalSymbols]);

    if (!mappedSymbols.length || !chartData || !isClient) {
      return null;
    }

    return (
      <div className="will-change-transform">
        <Card className="transition-all duration-150">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Industry Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {mappedSymbols.length} symbols across {Object.keys(industries).length} industries
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger
                  value="pie"
                  className="transition-all duration-100"
                >
                  Pie Chart
                </TabsTrigger>
                <TabsTrigger
                  value="doughnut"
                  className="transition-all duration-100"
                >
                  Doughnut Chart
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pie" className="p-0 transition-all duration-100">
                <PieChart
                  ref={pieChartRef}
                  data={chartData}
                  options={options}
                  industryPercentages={industryPercentages}
                />
              </TabsContent>

              <TabsContent value="doughnut" className="p-0 transition-all duration-100">
                <DoughnutChart
                  ref={doughnutChartRef}
                  data={chartData}
                  options={options}
                  industryPercentages={industryPercentages}
                />
              </TabsContent>
            </Tabs>

            <IndustryBreakdown industryPercentages={industryPercentages} mappedSymbols={mappedSymbols} />
          </CardContent>
        </Card>
      </div>
    );
  }
);
IndustryChart.displayName = 'IndustryChart';

// The PieChart component is memoized to prevent unnecessary re-renders
const PieChart = forwardRef<ChartRef, {
  data: any;
  options: any;
  industryPercentages: Array<{industry: string; count: number; percentage: string}>;
}>(({ data, options, industryPercentages }, ref) => {
  const chartRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    downloadChart: () => {
      if (chartRef.current) {
        const canvas = chartRef.current.canvas;
        // Convert canvas to image and download
        if (canvas) {
          const link = document.createElement('a');
          link.download = 'industry-distribution-pie.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      }
    },
    downloadChartWithData: () => {
      if (chartRef.current) {
        // Get the chart canvas and create a composite image with data
        const canvas = chartRef.current.canvas;
        if (!canvas) return;

        // Create a new canvas with extra space for data table
        const compositeCanvas = document.createElement('canvas');
        const maxIndustries = Math.min(industryPercentages.length, 15); // Show top 15 industries max
        const extraHeight = 20 + (maxIndustries * 20); // Extra space for header and industry rows

        compositeCanvas.width = Math.max(800, canvas.width);
        compositeCanvas.height = canvas.height + extraHeight;

        const ctx = compositeCanvas.getContext('2d');
        if (!ctx) return;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

        // Draw the original chart
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

        // Draw a title for the data section
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Industry Distribution Data', 20, canvas.height + 20);

        // Add headers for the table
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Industry', 20, canvas.height + 45);
        ctx.fillText('Count', 400, canvas.height + 45);
        ctx.fillText('Percentage', 500, canvas.height + 45);

        // Add data rows
        ctx.font = '12px Arial';
        const topIndustries = industryPercentages.slice(0, maxIndustries);
        topIndustries.forEach((item, index) => {
          const y = canvas.height + 70 + (index * 20);
          ctx.fillText(item.industry, 20, y);
          ctx.fillText(item.count.toString(), 400, y);
          ctx.fillText(`${item.percentage}%`, 500, y);
        });

        // Add total
        const totalY = canvas.height + 70 + (topIndustries.length * 20);
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Total: ${industryPercentages.reduce((sum, item) => sum + item.count, 0)} symbols`, 20, totalY);

        // Convert the composite canvas to image and download
        const link = document.createElement('a');
        link.download = 'industry-distribution-pie-with-data.jpg';
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.click();
      }
    }
  }));

  return (
    <div className="h-[250px] sm:h-[300px] w-full relative">
      <Pie ref={chartRef} data={data} options={options} />
    </div>
  );
});
PieChart.displayName = 'PieChart';

// The DoughnutChart component is memoized to prevent unnecessary re-renders
const DoughnutChart = forwardRef<ChartRef, {
  data: any;
  options: any;
  industryPercentages: Array<{industry: string; count: number; percentage: string}>;
}>(({ data, options, industryPercentages }, ref) => {
  const chartRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    downloadChart: () => {
      if (chartRef.current) {
        const canvas = chartRef.current.canvas;
        // Convert canvas to image and download
        if (canvas) {
          const link = document.createElement('a');
          link.download = 'industry-distribution-doughnut.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      }
    },
    downloadChartWithData: () => {
      if (chartRef.current) {
        // Get the chart canvas and create a composite image with data
        const canvas = chartRef.current.canvas;
        if (!canvas) return;

        // Create a new canvas with extra space for data table
        const compositeCanvas = document.createElement('canvas');
        const maxIndustries = Math.min(industryPercentages.length, 15); // Show top 15 industries max
        const extraHeight = 20 + (maxIndustries * 20); // Extra space for header and industry rows

        compositeCanvas.width = Math.max(800, canvas.width);
        compositeCanvas.height = canvas.height + extraHeight;

        const ctx = compositeCanvas.getContext('2d');
        if (!ctx) return;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

        // Draw the original chart
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

        // Draw a title for the data section
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Industry Distribution Data', 20, canvas.height + 20);

        // Add headers for the table
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Industry', 20, canvas.height + 45);
        ctx.fillText('Count', 400, canvas.height + 45);
        ctx.fillText('Percentage', 500, canvas.height + 45);

        // Add data rows
        ctx.font = '12px Arial';
        const topIndustries = industryPercentages.slice(0, maxIndustries);
        topIndustries.forEach((item, index) => {
          const y = canvas.height + 70 + (index * 20);
          ctx.fillText(item.industry, 20, y);
          ctx.fillText(item.count.toString(), 400, y);
          ctx.fillText(`${item.percentage}%`, 500, y);
        });

        // Add total
        const totalY = canvas.height + 70 + (topIndustries.length * 20);
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Total: ${industryPercentages.reduce((sum, item) => sum + item.count, 0)} symbols`, 20, totalY);

        // Convert the composite canvas to image and download
        const link = document.createElement('a');
        link.download = 'industry-distribution-doughnut-with-data.jpg';
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.click();
      }
    }
  }));

  return (
    <div className="h-[250px] sm:h-[300px] w-full relative">
      <Doughnut ref={chartRef} data={data} options={options} />
    </div>
  );
});
DoughnutChart.displayName = 'DoughnutChart';

// IndustryBreakdown component is memoized for better performance
const IndustryBreakdown = memo(({ industryPercentages, mappedSymbols }: {
  industryPercentages: Array<{industry: string; count: number; percentage: string}>;
  mappedSymbols: StockData[];
}) => {
  const [hoveredIndustry, setHoveredIndustry] = useState<string | null>(null);

  // Only show top industries on mobile to avoid excessive scrolling
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const displayCount = isMobile ? 10 : industryPercentages.length;
  const displayedIndustries = industryPercentages.slice(0, displayCount);
  const hiddenCount = industryPercentages.length - displayedIndustries.length;

  // Get symbols for the hovered industry
  const industrySymbols = useMemo(() => {
    if (!hoveredIndustry) return [];

    return mappedSymbols
      .filter(stock => stock.industry === hoveredIndustry)
      .map(stock => stock.symbol)
      .sort();
  }, [hoveredIndustry, mappedSymbols]);

  // Handle mouse enter for industry
  const handleMouseEnter = (industry: string) => {
    setHoveredIndustry(industry);
  };

  // Handle mouse leave for industry
  const handleMouseLeave = () => {
    setHoveredIndustry(null);
  };

  return (
    <div className="mt-3 sm:mt-4 border rounded-md">
      <h4 className="text-sm font-medium p-2 pb-1 sm:pb-2">Industry Breakdown</h4>

      <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto p-2 pt-0">
        <div className="space-y-1 sm:space-y-1.5">
          {displayedIndustries.map(({ industry, count, percentage }) => (
            <div
              key={industry}
              className={`flex justify-between text-xs relative cursor-pointer transition-all duration-150 ${
                hoveredIndustry === industry ? 'bg-muted rounded-md px-1.5 py-1' : ''
              }`}
              onMouseEnter={() => handleMouseEnter(industry)}
              onMouseLeave={handleMouseLeave}
            >
              <span className="truncate max-w-[65%] sm:max-w-[70%] font-medium" title={industry}>
                {industry}
              </span>
              <span className="text-muted-foreground">{count} ({percentage}%)</span>

              {/* Symbols tooltip */}
              {hoveredIndustry === industry && industrySymbols.length > 0 && (
                <div
                  className="absolute top-8 left-0 z-50 bg-background border rounded-md p-2 shadow-md w-[250px] industry-tooltip-animation"
                  style={{ maxHeight: '150px', overflowY: 'auto' }}
                >
                  <div className="text-xs font-medium mb-1.5">Symbols in {industry}:</div>
                  <div className="flex flex-wrap gap-1">
                    {industrySymbols.map(symbol => (
                      <div
                        key={symbol}
                        className="bg-muted text-xs px-1.5 py-0.5 rounded-sm font-mono"
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {hiddenCount > 0 && (
          <div className="text-xs text-center text-muted-foreground pt-1">
            + {hiddenCount} more industries
          </div>
        )}
      </div>
    </div>
  );
});
IndustryBreakdown.displayName = 'IndustryBreakdown';
