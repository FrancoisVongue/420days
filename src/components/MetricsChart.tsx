import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import dayjs from 'dayjs';
import { Plus, X, Target, TrendingUp, BarChart3, Settings } from 'lucide-react';
import { Metric } from '../types';
import { useApp } from '../context/AppContext';

interface MetricsChartProps {
  selectedDate: string;
  metrics: Metric[];
}

const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const MetricsChart: React.FC<MetricsChartProps> = ({ selectedDate, metrics }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { setMetrics } = useApp();
  const [activeTab, setActiveTab] = useState<'chart' | 'metrics'>('chart');
  const [showAddForm, setShowAddForm] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<string | null>(null);
  const [newMetric, setNewMetric] = useState({
    name: '',
    targetValue: '',
    unit: ''
  });

  const addMetric = () => {
    if (!newMetric.name || !newMetric.targetValue) return;

    const metric: Metric = {
      id: Date.now().toString(),
      name: newMetric.name,
      color: CHART_COLORS[metrics.length % CHART_COLORS.length],
      targetValue: parseFloat(newMetric.targetValue),
      entries: [],
      unit: newMetric.unit
    };

    setMetrics([...metrics, metric]);
    setNewMetric({ name: '', targetValue: '', unit: '' });
    setShowAddForm(false);
  };

  const removeMetric = (id: string) => {
    const metric = metrics.find(m => m.id === id);
    if (metric) {
      setMetricToDelete(id);
    }
  };

  const confirmDeleteMetric = () => {
    if (metricToDelete) {
      setMetrics(metrics.filter(m => m.id !== metricToDelete));
      setMetricToDelete(null);
    }
  };

  const cancelDeleteMetric = () => {
    setMetricToDelete(null);
  };

  // Function to clear metrics data for a specific date
  const clearMetricsForDate = (date: string) => {
    setMetrics(metrics.map(metric => ({
      ...metric,
      entries: metric.entries.filter(entry => entry.date !== date)
    })));
  };

  // Listen for clear data events from other components
  useEffect(() => {
    const handleClearData = (event: CustomEvent) => {
      if (event.detail.date === selectedDate) {
        clearMetricsForDate(selectedDate);
      }
    };

    window.addEventListener('clearDayData', handleClearData as EventListener);
    return () => {
      window.removeEventListener('clearDayData', handleClearData as EventListener);
    };
  }, [selectedDate]);

  useEffect(() => {
    if (!svgRef.current || metrics.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 60 };
    
    // Get container dimensions
    const container = svgRef.current;
    const containerWidth = container?.clientWidth || 900;
    const containerHeight = container?.clientHeight || 500;
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get date range from all metrics
    const allDates = new Set<string>();
    const allPercentages: number[] = [];
    metrics.forEach(metric => {
      metric.entries.forEach(entry => allDates.add(entry.date));
      metric.entries.forEach(entry => {
        const percentage = (entry.value / metric.targetValue) * 100;
        allPercentages.push(percentage);
      });
    });

    if (allDates.size === 0) return;

    const dateArray = Array.from(allDates).sort();
    const startDate = dayjs(dateArray[0]);
    const endDate = dayjs(dateArray[dateArray.length - 1]);

    // Always start from 0% and ensure 100% target is visible
    const yMin = 0;
    const maxPercentage = allPercentages.length > 0 ? Math.max(...allPercentages) : 100;
    // Ensure we always show at least up to 100% (target line), but go higher if needed
    const yMax = Math.max(100, maxPercentage * 1.1); // Add 10% padding above max value

    // Scales
    const xScale = d3.scaleTime()
      .domain([startDate.toDate(), endDate.toDate()])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));

    // Target line at 100% (always visible since we always include 100% in range)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(100))
      .attr('y2', yScale(100))
      .attr('stroke', '#10B981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.8);

    g.append('text')
      .attr('x', width - 5)
      .attr('y', yScale(100) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#10B981')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Target');

    // Line generator
    const line = d3.line<{ date: Date; percentage: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.percentage))
      .curve(d3.curveMonotoneX);

    // Draw lines for each metric
    metrics.forEach(metric => {
      if (metric.entries.length === 0) return;

      const lineData = metric.entries.map(entry => ({
        date: dayjs(entry.date).toDate(),
        percentage: (entry.value / metric.targetValue) * 100
      }));

      // Line path
      g.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', metric.color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Data points
      g.selectAll(`.dot-${metric.id}`)
        .data(lineData)
        .enter().append('circle')
        .attr('class', `dot-${metric.id}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.percentage))
        .attr('r', 4)
        .attr('fill', metric.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    });

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'metrics-chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
      .style('max-width', '300px');

    // Create invisible overlay for mouse tracking
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const overlay = g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const hoveredDate = xScale.invert(mouseX);
        
        // Find the closest date with data
        let closestDate: Date | null = null;
        let minDistance = Infinity;
        
        metrics.forEach(metric => {
          metric.entries.forEach(entry => {
            const entryDate = dayjs(entry.date).toDate();
            const distance = Math.abs(entryDate.getTime() - hoveredDate.getTime());
            if (distance < minDistance) {
              minDistance = distance;
              closestDate = entryDate;
            }
          });
        });
        
        if (!closestDate || minDistance > 7 * 24 * 60 * 60 * 1000) { // 7 days threshold
          tooltip.style('visibility', 'hidden');
          return;
        }
        
        const closestDateStr = dayjs(closestDate).format('YYYY-MM-DD');
        
        // Collect all metrics data for this date
        const tooltipData: Array<{
          name: string;
          value: number;
          target: number;
          percentage: number;
          color: string;
          unit: string;
        }> = [];
        
        metrics.forEach(metric => {
          const entry = metric.entries.find(e => e.date === closestDateStr);
          if (entry) {
            tooltipData.push({
              name: metric.name,
              value: entry.value,
              target: metric.targetValue,
              percentage: (entry.value / metric.targetValue) * 100,
              color: metric.color,
              unit: metric.unit || ''
            });
          }
        });
        
        if (tooltipData.length === 0) {
          tooltip.style('visibility', 'hidden');
          return;
        }
        
        // Build tooltip content
        const tooltipContent = `
          <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 4px;">
            ${dayjs(closestDate).format('MMM D, YYYY')}
          </div>
          ${tooltipData.map(data => `
            <div style="margin-bottom: 6px; display: flex; align-items: center;">
              <div style="width: 12px; height: 12px; background-color: ${data.color}; border-radius: 50%; margin-right: 8px; flex-shrink: 0;"></div>
              <div style="flex: 1;">
                <div style="font-weight: 500;">${data.name}</div>
                <div style="font-size: 12px; color: #ccc; margin-top: 1px;">
                  ${data.value}${data.unit} / ${data.target}${data.unit} (${data.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          `).join('')}
        `;
        
        tooltip
          .style('visibility', 'visible')
          .html(tooltipContent);
        
        // Position tooltip
        const [pageX, pageY] = d3.pointer(event, document.body);
        tooltip
          .style('top', (pageY - 10) + 'px')
          .style('left', (pageX + 15) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('visibility', 'hidden');
      });

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${width + 10}, 20)`);

    metrics.forEach((metric, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 30})`);

      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', metric.color)
        .attr('stroke-width', 2);

      // Add text with wrapping for long names
      const legendText = legendItem.append('text')
        .attr('x', 20)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .style('max-width', '100px') // Limit width to force wrapping
        .text(metric.name);

      // Simple text wrapping for long metric names
      const text = legendText.node();
      if (text) {
        const textContent = text.textContent || '';
        
        // Simple truncation with ellipsis for very long names
        if (textContent.length > 15) {
          legendText.text(textContent.substring(0, 12) + '...');
        }
        
        // Add title attribute for hover tooltip
        legendText.attr('title', metric.name);
      }
    });

    // Cleanup function
    return () => {
      d3.select('body').selectAll('.metrics-chart-tooltip').remove();
    };

  }, [metrics, selectedDate, activeTab]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Progress Metrics</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-3 flex-shrink-0">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'chart'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Chart</span>
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Metrics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'chart' ? (
          /* Chart View */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chart Area */}
            <div className="flex-1 min-h-0">
            {metrics.length > 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <svg ref={svgRef} width="100%" height="100%" className="border border-gray-200 rounded" />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">No metrics added yet.</p>
                <button
                  onClick={() => setActiveTab('metrics')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Metric
                </button>
              </div>
            )}
          </div>
          </div>
        ) : (
          /* Metrics Management View */
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Add Metric Button */}
            <div className="flex justify-between items-center flex-shrink-0">
              <p className="text-sm text-gray-600">Manage your metrics and add data points</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Metric</span>
              </button>
            </div>

            {/* Add Metric Form */}
            {showAddForm && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Metric name (e.g., Weight)"
                      value={newMetric.name}
                      onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Target value"
                      value={newMetric.targetValue}
                      onChange={(e) => setNewMetric({ ...newMetric, targetValue: e.target.value })}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Unit (optional)"
                      value={newMetric.unit}
                      onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={addMetric}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add Metric
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics List */}
            <div className="overflow-y-auto min-h-0">
              {metrics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {metrics.map(metric => {
                    const selectedEntry = metric.entries.find(e => e.date === selectedDate);
                    const currentValue = selectedEntry?.value || 0;
                    const percentage = metric.targetValue > 0 ? (currentValue / metric.targetValue) * 100 : 0;
                    
                    return (
                      <div key={metric.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: metric.color }}
                            />
                            <span className="text-sm font-semibold text-gray-900">{metric.name}</span>
                          </div>
                          <button
                            onClick={() => removeMetric(metric.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center">
                            <div className="text-xs text-gray-600">Target</div>
                            <div className="text-sm font-bold text-gray-900">{metric.targetValue}{metric.unit}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600">Current</div>
                            <div className="text-sm font-bold text-gray-900">{currentValue}{metric.unit}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600">Progress</div>
                            <div className={`text-sm font-bold ${percentage >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Value for {dayjs(selectedDate).format('MMM D, YYYY')}
                          </label>
                          <div className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700 text-sm">
                            {selectedEntry ? `${selectedEntry.value}${metric.unit}` : 'No data entered'}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Enter daily values using the sliders in the Daily Journal section
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No metrics created yet.</p>
                  <p className="text-sm">Click "Add Metric" to start tracking your progress!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {metricToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Metric</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the metric "
                <span className="font-semibold">
                  {metrics.find(m => m.id === metricToDelete)?.name}
                </span>
                "?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ All historical data for this metric will be permanently lost
                </p>
                <p className="text-red-700 text-sm mt-1">
                  This includes {metrics.find(m => m.id === metricToDelete)?.entries.length || 0} data points
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDeleteMetric}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMetric}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Metric
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};