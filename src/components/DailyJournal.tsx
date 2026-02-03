import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Trash2, Target, CheckSquare } from 'lucide-react';
import dayjs from 'dayjs';
import { DailyEntry, Metric, Task } from '../types';
import { useApp } from '../context/AppContext';

interface DailyJournalProps {
  selectedDate: string;
  metrics: Metric[];
}

export const DailyJournal: React.FC<DailyJournalProps> = ({ selectedDate, metrics }) => {
  const { state, setEntries, setMetrics, setTasks } = useApp();
  const { entries, years, selectedYearId, tasks } = state;
  
  const [content, setContent] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // State for metric sliders
  const [metricValues, setMetricValues] = useState<{[key: string]: number}>({});

  // Find which epoch the selected date belongs to
  const selectedYear = years.find(y => y.id === selectedYearId);
  const currentEpoch = selectedYear?.epochs.find(epoch => 
    selectedDate >= epoch.startDate && selectedDate <= epoch.endDate
  );

  // Filter metrics: show only metrics for current epoch or metrics without epochId (all year)
  const filteredMetrics = metrics.filter(metric => {
    if (!metric.epochId) return true; // Show metrics without epochId (all year)
    if (!currentEpoch) return false; // If no epoch for this date, don't show epoch-specific metrics
    return metric.epochId === currentEpoch.id; // Show only metrics for current epoch
  });

  // Sort metrics: epoch metrics first, then all-year metrics
  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    const aIsEpoch = a.epochId === currentEpoch?.id;
    const bIsEpoch = b.epochId === currentEpoch?.id;
    if (aIsEpoch && !bIsEpoch) return -1;
    if (!aIsEpoch && bIsEpoch) return 1;
    return 0;
  });

  // Split metrics into epoch and all-year groups
  const epochMetrics = sortedMetrics.filter(m => m.epochId === currentEpoch?.id);
  const allYearMetrics = sortedMetrics.filter(m => !m.epochId);

  // Filter tasks: show tasks with dueDate >= selectedDate AND (not completed OR completed on/after selectedDate)
  // Also filter by epoch like metrics
  const visibleTasks = tasks.filter(task => {
    // Task should be visible if due date hasn't passed yet
    if (task.dueDate < selectedDate) return false;
    
    // If not completed, show it
    if (!task.completedDate) {
      // Filter by epoch
      if (!task.epochId) return true; // Show tasks without epochId (all year)
      if (!currentEpoch) return false; // If no epoch for this date, don't show epoch-specific tasks
      return task.epochId === currentEpoch.id; // Show only tasks for current epoch
    }
    
    // If completed, show if completed on or after selected date (task was still pending on this date OR completed today)
    if (task.completedDate >= selectedDate) {
      // Filter by epoch
      if (!task.epochId) return true;
      if (!currentEpoch) return false;
      return task.epochId === currentEpoch.id;
    }
    
    return false;
  });

  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        // If already completed, uncomplete it; otherwise complete it with current date
        return {
          ...task,
          completedDate: task.completedDate ? undefined : selectedDate,
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    }));
  };

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
      
      // Clear metrics data for this day
      setMetrics(metrics.map(metric => ({
        ...metric,
        entries: metric.entries.filter(entry => entry.date !== selectedDate)
      })));
      
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full grid grid-rows-[auto_1fr_auto_auto] gap-3 overflow-hidden">
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

      {/* Main Content: Journal + Metrics + Tasks */}
      <div className="overflow-hidden min-h-0 flex gap-3">
        {/* Journal Section - 50% */}
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
        <div className="w-1/4 min-w-0 flex flex-col bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2 flex-shrink-0">
            <Target className="w-3 h-3 text-blue-600" />
            <label className="text-xs font-semibold text-gray-700">
              Metrics
            </label>
          </div>
          
          {filteredMetrics.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 text-sm">
              <div>
                <Target className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p>No metrics for this {currentEpoch ? 'epoch' : 'date'}</p>
                <p className="text-xs">Create metrics in the chart view</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
              {/* Epoch Metrics */}
              {epochMetrics.length > 0 && (
                <>
                  {currentEpoch && (
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {currentEpoch.name}
                    </div>
                  )}
                  {epochMetrics.map(metric => {
                    const percentage = metricValues[metric.id] || 0;
                    const actualValue = Math.round((percentage / 100) * metric.targetValue);
                    
                    return (
                      <div key={metric.id} className="space-y-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <label className="text-xs font-medium text-gray-700 truncate leading-tight">
                            {metric.name}
                          </label>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap leading-tight">
                            {actualValue}{metric.unit || ''} / {metric.targetValue}{metric.unit || ''}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={percentage}
                          onChange={(e) => updateMetricValue(metric.id, parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mt-0.5"
                        />
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* Divider between epoch and all-year metrics */}
              {epochMetrics.length > 0 && allYearMetrics.length > 0 && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    All Year
                  </span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
              )}
              
              {/* All Year Metrics */}
              {allYearMetrics.length > 0 && (
                <>
                  {epochMetrics.length === 0 && (
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      All Year
                    </div>
                  )}
                  {allYearMetrics.map(metric => {
                    const percentage = metricValues[metric.id] || 0;
                    const actualValue = Math.round((percentage / 100) * metric.targetValue);
                    
                    return (
                      <div key={metric.id} className="space-y-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <label className="text-xs font-medium text-gray-700 truncate leading-tight">
                            {metric.name}
                          </label>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap leading-tight">
                            {actualValue}{metric.unit || ''} / {metric.targetValue}{metric.unit || ''}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={percentage}
                          onChange={(e) => updateMetricValue(metric.id, parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mt-0.5"
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Tasks Section - 25% */}
        <div className="w-1/4 min-w-0 flex flex-col bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2 flex-shrink-0">
            <CheckSquare className="w-3 h-3 text-blue-600" />
            <label className="text-xs font-semibold text-gray-700">
              Tasks
            </label>
          </div>
          
          {visibleTasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 text-sm">
              <div>
                <CheckSquare className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p>No tasks for today</p>
                <p className="text-xs">Create tasks in the chart view</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
              {/* Active tasks (not completed) */}
              {visibleTasks.filter(task => task.completedDate !== selectedDate).map(task => {
                const isOverdue = dayjs(task.dueDate).isBefore(dayjs(selectedDate), 'day');
                
                return (
                  <div key={task.id} className="space-y-0">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleTaskCompletion(task.id)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium leading-tight cursor-pointer text-gray-700">
                          {task.name}
                        </label>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-[10px] leading-tight ${
                            isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
                          }`}>
                            {dayjs(task.dueDate).format('MMM D')}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] text-red-600 font-semibold">⚠️</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Completed tasks (at the bottom) */}
              {visibleTasks.filter(task => task.completedDate === selectedDate).map(task => {
                return (
                  <div key={task.id} className="space-y-0 opacity-50">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleTaskCompletion(task.id)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium leading-tight cursor-pointer line-through text-gray-400">
                          {task.name}
                        </label>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] leading-tight line-through text-gray-400">
                            {dayjs(task.dueDate).format('MMM D')}
                          </span>
                        </div>
                      </div>
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
                <h3 className="text-lg font-semibold text-gray-900">Clear Day Data</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Delete all data for{' '}
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
                  <li>• Journal entry for this day</li>
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
                <span>{isClearing ? 'Clearing...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin-right: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};