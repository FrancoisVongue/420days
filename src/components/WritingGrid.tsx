import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DailyEntry, Metric } from '../types';
import { useApp } from '../context/AppContext';
import { EpochRow } from './EpochRow';

interface WritingGridProps {
  entries: DailyEntry[];
  metrics: Metric[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const WritingGrid: React.FC<WritingGridProps> = ({ entries, metrics, selectedDate, onDateSelect }) => {
  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  const { state } = useApp();
  const { years, selectedYearId } = state;
  
  const selectedYear = years.find(y => y.id === selectedYearId);
  
  // Auto-select default metric or first metric
  useEffect(() => {
    if (metrics.length > 0 && !selectedMetricId) {
      const defaultMetric = metrics.find(m => m.isDefault);
      const metricToSelect = defaultMetric || metrics[0];
      setSelectedMetricId(metricToSelect.id);
    }
  }, [metrics, selectedMetricId]);

  if (!selectedYear || selectedYear.epochs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No epochs created yet. Create epochs to see them here!</p>
        </div>
      </div>
    );
  }

  // Prepare data for each epoch
  const sortedEpochs = [...selectedYear.epochs].sort((a, b) => 
    a.startDate.localeCompare(b.startDate)
  );
  
  const epochsData = sortedEpochs.map(epoch => {
    const days = [];
    const start = dayjs(epoch.startDate);
    const end = dayjs(epoch.endDate);
    
    for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(1, 'day')) {
      const dateStr = d.format('YYYY-MM-DD');
      const entry = entries.find(e => e.date === dateStr) || null;
      
      let percentage = 100; // Default full color
      if (selectedMetricId) {
        const selectedMetric = metrics.find(m => m.id === selectedMetricId);
        if (selectedMetric) {
          const metricEntry = selectedMetric.entries.find(e => e.date === dateStr);
          if (metricEntry && selectedMetric.targetValue > 0) {
            percentage = Math.min(100, (metricEntry.value / selectedMetric.targetValue) * 100);
          } else {
            percentage = 0;
          }
        }
      }
      
      days.push({ date: dateStr, entry, percentage, epoch });
    }
    
    return { epoch, days };
  });

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full flex flex-col overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <div className="flex flex-col space-y-3">
          <h2 className="text-lg font-bold text-gray-900">
            {selectedYear ? `${selectedYear.name} Epochs` : 'Writing Journey'}
          </h2>
          
          {metrics.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-dashed border-blue-400 flex-shrink-0">
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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 flex-shrink-0">
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

      <div className="flex-1 overflow-auto flex flex-col gap-1">
        {epochsData.map((epochData) => {
          const isCurrentEpoch = today >= epochData.epoch.startDate && today <= epochData.epoch.endDate;
          return (
            <EpochRow
              key={epochData.epoch.id}
              epoch={epochData.epoch}
              days={epochData.days}
              selectedDate={selectedDate}
              selectedMetricId={selectedMetricId}
              onDateSelect={onDateSelect}
              isCurrentEpoch={isCurrentEpoch}
            />
          );
        })}
      </div>
    </div>
  );
};