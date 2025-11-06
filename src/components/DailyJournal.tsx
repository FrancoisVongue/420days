import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Trash2, Target } from 'lucide-react';
import dayjs from 'dayjs';
import { DailyEntry, Metric } from '../types';
import { useApp } from '../context/AppContext';

interface DailyJournalProps {
  selectedDate: string;
  metrics: Metric[];
}

export const DailyJournal: React.FC<DailyJournalProps> = ({ selectedDate, metrics }) => {
  const { state, setEntries, setMetrics } = useApp();
  const { entries } = state;
  
  const [content, setContent] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // State for metric sliders
  const [metricValues, setMetricValues] = useState<{[key: string]: number}>({});

  // Load metric values for the selected date
  const loadMetricValues = useCallback(() => {
    const values: {[key: string]: number} = {};
    metrics.forEach(metric => {
      const entry = metric.entries.find(e => e.date === selectedDate);
      if (entry) {
        // Convert actual value to percentage
        const percentage = metric.targetValue > 0 ? Math.round((entry.value / metric.targetValue) * 100) : 0;
        values[metric.id] = percentage;
      } else {
        values[metric.id] = 0;
      }
    });
    setMetricValues(values);
  }, [metrics, selectedDate]);

  // Update metric value
  const updateMetricValue = (metricId: string, percentage: number) => {
    setMetricValues(prev => ({ ...prev, [metricId]: percentage }));
    
    // Update the metric in the global state
    setMetrics(metrics.map(metric => {
      if (metric.id === metricId) {
        const actualValue = Math.round((percentage / 100) * metric.targetValue);
        const existingEntry = metric.entries.find(e => e.date === selectedDate);
        let updatedEntries;
        
        if (existingEntry) {
          updatedEntries = metric.entries.map(e => 
            e.date === selectedDate ? { ...e, value: actualValue } : e
          );
        } else {
          updatedEntries = [...metric.entries, { date: selectedDate, value: actualValue }];
        }
        
        return { ...metric, entries: updatedEntries };
      }
      return metric;
    }));
  };

  const getEntryByDate = useCallback((date: string): DailyEntry | null => {
    return entries.find(e => e.date === date) || null;
  }, [entries]);

  const saveEntry = (entry: DailyEntry): void => {
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    let updatedEntries;
    if (existingIndex >= 0) {
      updatedEntries = [...entries];
      updatedEntries[existingIndex] = entry;
    } else {
      updatedEntries = [...entries, entry];
    }
    
    setEntries(updatedEntries);
  };

  useEffect(() => {
    // Load existing entry for selected date
    const existingEntry = getEntryByDate(selectedDate);
    if (existingEntry) {
      setContent(existingEntry.content);
    } else {
      setContent('');
    }
    
    // Load metric values for the selected date
    loadMetricValues();
  }, [selectedDate, entries, getEntryByDate, loadMetricValues]);

  // Auto-save entry when content changes
  const autoSaveEntry = useCallback((newContent: string) => {
    const entry: DailyEntry = {
      id: `${selectedDate}-${Date.now()}`,
      date: selectedDate,
      content: newContent,
      satisfaction: 50, // Default satisfaction for compatibility
      color: '#3B82F6', // Default color
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveEntry(entry);
  }, [selectedDate, saveEntry]);

  const handleClearData = async () => {
    setIsClearing(true);
    
    try {
      // Clear journal entry
      const filteredEntries = entries.filter((entry: DailyEntry) => entry.date !== selectedDate);
      setEntries(filteredEntries);
      
      // Clear metrics data for this day (stored in localStorage with different keys)
      // Note: This assumes metrics are stored in localStorage. If they're stored differently,
      // this would need to be updated to match the actual storage mechanism.
      
      // Dispatch custom event to clear metrics data
      window.dispatchEvent(new CustomEvent('clearDayData', { 
        detail: { date: selectedDate } 
      }));
      
      // Reset form state
      setContent('');
      
      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const today = dayjs().format('YYYY-MM-DD');
  const isToday = selectedDate === today;
  const selectedDateFormatted = dayjs(selectedDate).format('MMMM D, YYYY');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full grid grid-rows-[auto_1fr_auto_auto] gap-3 overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daily Journal</h2>
            <p className="text-sm text-gray-600">
              {isToday ? 'How was your day today?' : `Reflecting on ${selectedDateFormatted}`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: 75% Journal + 25% Metrics */}
      <div className="overflow-hidden min-h-0 flex gap-3">
        {/* Journal Section - 75% */}
        <div className="flex-1 flex flex-col min-w-0">
          <label htmlFor="journal-content" className="block text-sm font-medium text-gray-700 mb-2 flex-shrink-0">
            Your thoughts and reflections
          </label>
          <textarea
            id="journal-content"
            value={content}
            onChange={(e) => {
              const newContent = e.target.value;
              setContent(newContent);
              autoSaveEntry(newContent);
            }}
            placeholder={isToday ? "What happened today? How are you feeling? What did you learn?" : "What do you remember about this day?"}
            className="w-full flex-1 min-h-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
          />
          <div className="mt-2 text-sm text-gray-500 flex-shrink-0">
            {content.length} characters
          </div>
        </div>

        {/* Metrics Section - 25% */}
        <div className="w-1/4 min-w-0 flex flex-col">
          <div className="flex items-center space-x-2 mb-2 flex-shrink-0">
            <Target className="w-4 h-4 text-blue-600" />
            <label className="text-sm font-medium text-gray-700">
              Daily Metrics
            </label>
          </div>
          
          {metrics.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 text-sm">
              <div>
                <Target className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p>No metrics yet</p>
                <p className="text-xs">Create metrics in the chart view</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3">
              {metrics.map(metric => {
                const percentage = metricValues[metric.id] || 0;
                const actualValue = Math.round((percentage / 100) * metric.targetValue);
                
                return (
                  <div key={metric.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-gray-700 truncate">
                        {metric.name}
                      </label>
                      <span className="text-xs text-gray-500 min-w-0 text-right">
                        {actualValue}{metric.unit || ''} ({percentage}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => updateMetricValue(metric.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-xs text-gray-400 text-right">
                      Target: {metric.targetValue}{metric.unit || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center flex-shrink-0">
        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Data</span>
        </button>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clear All Data</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to clear all data for{' '}
                <span className="font-semibold">
                  {dayjs(selectedDate).format('MMMM D, YYYY')}
                </span>
                ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm font-medium mb-2">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-red-700 text-sm space-y-1 ml-4">
                  <li>• Journal entry and thoughts</li>
                  <li>• All metric values for this day</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearing ? 'Clearing...' : 'Clear All Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: none;
        }
      `}</style>
    </div>
  );
};