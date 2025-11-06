import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import dayjs from 'dayjs';
import { DailyEntry, Metric } from '../types';

interface WritingGridProps {
  entries: DailyEntry[];
  metrics: Metric[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

interface GridData {
  date: string;
  dayNumber: number;
  entry: DailyEntry | null;
  percentage: number; // 0-100 for continuous color gradient
}

export const WritingGrid: React.FC<WritingGridProps> = ({ entries, metrics, selectedDate, onDateSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  
  // Auto-select default metric or first metric
  useEffect(() => {
    if (metrics.length > 0 && !selectedMetricId) {
      const defaultMetric = metrics.find(m => m.isDefault);
      const metricToSelect = defaultMetric || metrics[0];
      setSelectedMetricId(metricToSelect.id);
    }
  }, [metrics, selectedMetricId]);
  
  const CELL_PADDING = 3;
  const ROWS = 20;
  const COLS = 21;
  const START_DATE = dayjs('2025-11-01');
  const TOTAL_DAYS = 420;
  const todayDateString = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (!svgRef.current) return;

    const container = svgRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - 24; // Account for padding
    const availableHeight = containerRect.height - 24; // Account for padding

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    // Create grid data for 420 individual days
    const gridData: GridData[] = [];
    
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const currentDate = START_DATE.add(i, 'day');
      const dateStr = currentDate.format('YYYY-MM-DD');
      
      // Find entry for this specific day
      const entry = entries.find(e => e.date === dateStr) || null;
      
      // Calculate intensity percentage based on selected metric
      let percentage = 0;
      if (selectedMetricId) {
        const selectedMetric = metrics.find(m => m.id === selectedMetricId);
        if (selectedMetric) {
          const metricEntry = selectedMetric.entries.find(e => e.date === dateStr);
          if (metricEntry && selectedMetric.targetValue > 0) {
            percentage = Math.min(100, (metricEntry.value / selectedMetric.targetValue) * 100);
          }
        }
      }

      gridData.push({
        date: dateStr,
        dayNumber: i + 1,
        entry,
        percentage
      });
    }

    // Calculate optimal cell size based on available space
    const maxCellWidth = Math.floor((availableWidth - (COLS - 1) * CELL_PADDING) / COLS);
    const maxCellHeight = Math.floor((availableHeight - (ROWS - 1) * CELL_PADDING) / ROWS);
    const optimalCellSize = Math.min(maxCellWidth, maxCellHeight, 32); // Cap at 32px for readability

    const svg = d3.select(svgRef.current);
    const width = COLS * (optimalCellSize + CELL_PADDING) - CELL_PADDING;
    const height = ROWS * (optimalCellSize + CELL_PADDING) - CELL_PADDING;
    
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('max-height', '100%');

    // GitHub-style green gradient for 0-99%, beautiful blue for 100%
    const getColorForPercentage = (percentage: number) => {
      if(!percentage) {
        return '#ebedf0';
      }
      // x y z
      const for_0 = [140, 60, 75];
      const for_80 = [160, 100, 25];
      const for_100 = [210, 100, 66];
      const arr_to_str = (arr: number[]) => `hsl(${arr[0]}, ${arr[1]}%, ${arr[2]}%)`;
      
      if (percentage === 0) return arr_to_str(for_0);
      if (percentage === 100) return arr_to_str(for_100);
      if(percentage <= 80) {
        const move_0 = (for_80[0] - for_0[0]) * (percentage / 80);
        const move_1 = (for_80[1] - for_0[1]) * (percentage / 80);
        const move_2 = (for_80[2] - for_0[2]) * (percentage / 80); 
        const for_percentage = [for_0[0] + move_0, for_0[1] + move_1, for_0[2] + move_2];
        return arr_to_str(for_percentage); 
      } else {
        const move_0 = (for_100[0] - for_80[0]) * ((percentage - 80) / 20);
        const move_1 = (for_100[1] - for_80[1]) * ((percentage - 80) / 20);
        const move_2 = (for_100[2] - for_80[2]) * ((percentage - 80) / 20);
        const for_percentage = [for_80[0] + move_0, for_80[1] + move_1, for_80[2] + move_2];
        return arr_to_str(for_percentage);
      }
    };

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'writing-grid-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Function to get tooltip content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTooltipContent = (d: any) => {
      const dateFormatted = dayjs(d.date).format('MMMM D, YYYY');
      
      if (selectedMetricId) {
        const selectedMetric = metrics.find(m => m.id === selectedMetricId);
        if (selectedMetric) {
          const metricEntry = selectedMetric.entries.find(e => e.date === d.date);
          const value = metricEntry ? metricEntry.value : 0;
          const percentage = selectedMetric.targetValue > 0 ? Math.round((value / selectedMetric.targetValue) * 100) : 0;
          
          return `
            <div><strong>Day ${d.dayNumber}</strong></div>
            <div>${dateFormatted}</div>
            <div><strong>${selectedMetric.name}</strong></div>
            <div>Value: ${value}${selectedMetric.unit || ''}</div>
            <div>Target: ${selectedMetric.targetValue}${selectedMetric.unit || ''}</div>
            <div>Progress: ${percentage}%</div>
            ${d.entry ? '<div>✓ Entry completed</div>' : '<div>No entry</div>'}
          `;
        }
      }
      
      // No metric selected
      return `
        <div><strong>Day ${d.dayNumber}</strong></div>
        <div>${dateFormatted}</div>
        <div>Select a metric to see progress</div>
        ${d.entry ? '<div>✓ Entry completed</div>' : '<div>No entry</div>'}
      `;
    };

    // Create cells
    svg.selectAll('rect')
      .data(gridData)
      .enter()
      .append('rect')
      .attr('x', (_, i) => (i % COLS) * (optimalCellSize + CELL_PADDING))
      .attr('y', (_, i) => Math.floor(i / COLS) * (optimalCellSize + CELL_PADDING))
      .attr('width', optimalCellSize)
      .attr('height', optimalCellSize)
      .attr('rx', 2)
      .attr('fill', d => getColorForPercentage(d.percentage))
      .attr('stroke', d => {
        if (d.date === selectedDate) return '#3B82F6';
        if (d.date === todayDateString) return '#10B981';
        return '#e1e4e8';
      })
      .attr('stroke-width', d => {
        if (d.date === selectedDate) return 2;
        if (d.date === todayDateString) return 2;
        return 1;
      })
      .style('cursor', 'pointer')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('click', function(_event, d: any) {
        onDateSelect(d.date);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('mouseover', function(_event, d: any) {
        tooltip
          .style('visibility', 'visible')
          .html(getTooltipContent(d));
        
        d3.select(this)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('stroke', (d: any) => {
            if (d.date === selectedDate) return '#1E40AF';
            if (d.date === todayDateString) return '#059669';
            return '#1f2937';
          })
          .attr('stroke-width', 3);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('visibility', 'hidden');
        
        d3.select(this)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('stroke', (d: any) => {
            if (d.date === selectedDate) return '#3B82F6';
            if (d.date === todayDateString) return '#10B981';
            return '#e1e4e8';
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('stroke-width', (d: any) => {
            if (d.date === selectedDate) return 2;
            if (d.date === todayDateString) return 2;
            return 1;
          });
      });

    // Cleanup function
    return () => {
      d3.select('body').selectAll('.writing-grid-tooltip').remove();
    };
  }, [entries, metrics, selectedMetricId, selectedDate, todayDateString, onDateSelect, START_DATE]);

  return (
    <>
      <style>{`
        @keyframes borderSpin {
          0% { border-color: #3b82f6; }
          25% { border-color: #8b5cf6; }
          50% { border-color: #06b6d4; }
          75% { border-color: #10b981; }
          100% { border-color: #3b82f6; }
        }
      `}</style>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full grid grid-rows-[auto_1fr_auto] overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <div className="flex flex-col space-y-3">
          <h2 className="text-lg font-bold text-gray-900">420-Day Writing Journey</h2>
          
          {metrics.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-dashed border-blue-400">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <label className="text-base font-bold text-blue-900">
                    📊 Visualize Metric Progress
                  </label>
                  <p className="text-sm text-blue-700 font-medium">
                    Select a metric to see your progress colored across all days
                  </p>
                </div>
                <select
                  value={selectedMetricId}
                  onChange={(e) => setSelectedMetricId(e.target.value)}
                  className="px-4 py-2 text-base font-bold rounded-lg focus:outline-none focus:ring-0 bg-white text-gray-900 shadow-md min-w-[180px]"
                >
                  {metrics.length === 0 ? (
                    <option value="">No metrics available</option>
                  ) : (
                    <>
                      <option value="">Select a metric...</option>
                      {metrics.map(metric => (
                        <option key={metric.id} value={metric.id}>
                          🎯 {metric.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              
              {selectedMetricId && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-100 rounded px-3 py-2 font-medium">
                  💡 Tip: Green squares show days you achieved your target!
                </div>
              )}
            </div>
          )}
          
          {metrics.length === 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    No metrics available yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Create metrics in the chart view to visualize progress here
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center overflow-hidden">
        <svg ref={svgRef} className="border border-gray-200 w-full h-full" />
      </div>
        
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-2">
        <span>Less</span>
        <div className="flex space-x-1">
          {[
            { percentage: 0, color: '#ebedf0', label: 'No data' },
            { percentage: 25, color: '#9be9a8', label: 'Light progress' },
            { percentage: 50, color: '#40c463', label: 'Good progress' },
            { percentage: 75, color: '#30a14e', label: 'Strong progress' },
            { percentage: 99, color: '#216e39', label: 'Almost there' },
            { percentage: 100, color: '#09f', label: 'Target achieved!' }
          ].map((item, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-sm border border-gray-400"
              style={{ backgroundColor: item.color }}
              title={item.label}
            />
          ))}
        </div>
        <span>More</span>
      </div>
        
      <div className="mt-1 text-center text-xs text-gray-600">
        <p>Each square represents one day • Hover for details</p>
      </div>
    </div>
    </>
  );
};