import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import dayjs from 'dayjs';
import _ from 'lodash';
import { DailyEntry } from '../types';

interface WritingGridProps {
  entries: DailyEntry[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

interface GridData {
  date: string;
  dayNumber: number;
  entry: DailyEntry | null;
  wordCount: number;
  level: number; // 0-4 for different color intensities
}

export const WritingGrid: React.FC<WritingGridProps> = ({ entries, selectedDate, onDateSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const CELL_SIZE = 24;
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
      const satisfaction = entry ? entry.satisfaction : 0;
      
      // Calculate intensity level (0-4)
      let level = 0;
      if (satisfaction > 0) {
        if (satisfaction >= 90) level = 4;
        else if (satisfaction >= 70) level = 3;
        else if (satisfaction >= 50) level = 2;
        else level = 1;
      }

      gridData.push({
        date: dateStr,
        dayNumber: i + 1,
        entry,
        level
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

    // Color scale
    const getColorForEntry = (entry: DailyEntry | null) => {
      if (!entry) return '#f3f4f6'; // Light gray for no entry
      return entry.color; // Use the exact stored color
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

    // Create cells
    svg.selectAll('rect')
      .data(gridData)
      .enter()
      .append('rect')
      .attr('x', (d, i) => (i % COLS) * (optimalCellSize + CELL_PADDING))
      .attr('y', (d, i) => Math.floor(i / COLS) * (optimalCellSize + CELL_PADDING))
      .attr('width', optimalCellSize)
      .attr('height', optimalCellSize)
      .attr('rx', 2)
      .attr('fill', d => getColorForEntry(d.entry))
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
      .on('click', function(event, d) {
        onDateSelect(d.date);
      })
      .on('mouseover', function(event, d) {
        const date = dayjs(d.date);
        const dateFormatted = date.format('MMM D, YYYY');
        
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div><strong>Day ${d.dayNumber}</strong></div>
            <div>${dateFormatted}</div>
            <div>Satisfaction: ${d.entry ? d.entry.satisfaction : 0}%</div>
            ${d.entry ? '<div>✓ Entry completed</div>' : '<div>No entry</div>'}
          `);
        
        d3.select(this)
          .attr('stroke', d => {
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
          .attr('stroke', d => {
            if (d.date === selectedDate) return '#3B82F6';
            if (d.date === todayDateString) return '#10B981';
            return '#e1e4e8';
          })
          .attr('stroke-width', d => {
            if (d.date === selectedDate) return 2;
            if (d.date === todayDateString) return 2;
            return 1;
          });
      });

    // Cleanup function
    return () => {
      d3.select('body').selectAll('.writing-grid-tooltip').remove();
    };
  }, [entries, selectedDate, todayDateString, onDateSelect]);

  const today = dayjs();
  const endDate = START_DATE.add(TOTAL_DAYS - 1, 'day');
  const daysRemaining = Math.max(0, endDate.diff(today, 'day'));
  const daysCompleted = Math.max(0, Math.min(TOTAL_DAYS, today.diff(START_DATE, 'day') + 1));
  const completionPercentage = Math.max(0, Math.min(100, (daysCompleted / TOTAL_DAYS) * 100));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full grid grid-rows-[auto_1fr_auto_auto] overflow-hidden">
      <div className="mb-3 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-1">420-Day Writing Journey</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 space-y-1 sm:space-y-0">
          <div>
            Started: {START_DATE.format('MMMM D, YYYY')} • Ends: {endDate.format('MMMM D, YYYY')}
          </div>
          <div className="flex items-center space-x-4">
            <span>{daysCompleted} of {TOTAL_DAYS} days</span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center overflow-hidden">
        <svg ref={svgRef} className="border border-gray-200 w-full h-full" />
      </div>
        
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-2">
        <span>Less</span>
        <div className="flex space-x-1">
          {[
            { satisfaction: 0, color: '#000000', label: 'Terrible' },
            { satisfaction: 25, color: '#404040', label: 'Poor' },
            { satisfaction: 50, color: '#ffffff', label: 'Neutral' },
            { satisfaction: 75, color: '#80bf80', label: 'Good' },
            { satisfaction: 100, color: '#1a5f1a', label: 'Excellent' }
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
  );
};