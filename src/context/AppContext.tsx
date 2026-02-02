import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DailyEntry, Metric, Year, Epoch, Task } from '../types';
import dayjs from 'dayjs';

const EPOCH_COLORS = [
  '#9be9a8', // Light green
  '#40c463', // Medium green  
  '#30a14e', // Dark green
  '#216e39', // Darker green
];

interface AppState {
  entries: DailyEntry[];
  metrics: Metric[];
  tasks: Task[];
  selectedDate: string;
  years: Year[];
  selectedYearId: string;
}

interface AppContextType {
  state: AppState;
  setState: (updates: Partial<AppState> | ((prev: AppState) => AppState)) => void;
  setEntries: (entries: DailyEntry[]) => void;
  setMetrics: (metrics: Metric[]) => void;
  setTasks: (tasks: Task[]) => void;
  setSelectedDate: (date: string) => void;
  exportData: () => void;
  importData: (jsonString: string) => boolean;
  clearAllData: () => void;
  // Year management
  addYear: (year: Omit<Year, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateYear: (yearId: string, updates: Partial<Year>) => void;
  deleteYear: (yearId: string) => void;
  setSelectedYear: (yearId: string) => void;
  // Epoch management
  addEpoch: (yearId: string, epoch: Omit<Epoch, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEpoch: (yearId: string, epochId: string, updates: Partial<Epoch>) => void;
  deleteEpoch: (yearId: string, epochId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ENTRIES_KEY = 'daily-writing-entries';
const METRICS_KEY = 'daily-writing-metrics';
const TASKS_KEY = 'daily-writing-tasks';
const SELECTED_DATE_KEY = 'daily-writing-selected-date';
const YEARS_KEY = 'daily-writing-years';
const SELECTED_YEAR_KEY = 'daily-writing-selected-year';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const loadedYears = loadFromStorage<Year[]>(YEARS_KEY, []);
    const selectedYearId = loadFromStorage<string>(SELECTED_YEAR_KEY, loadedYears.length > 0 ? loadedYears[0].id : '');
    
    // Create default year if none exists
    if (loadedYears.length === 0) {
      const defaultYear: Year = {
        id: 'year-2025',
        name: '2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        epochs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      loadedYears.push(defaultYear);
      saveToStorage(YEARS_KEY, [defaultYear]);
    }
    
    return {
      entries: loadFromStorage<DailyEntry[]>(ENTRIES_KEY, []),
      metrics: loadFromStorage<Metric[]>(METRICS_KEY, []),
      tasks: loadFromStorage<Task[]>(TASKS_KEY, []),
      selectedDate: loadFromStorage<string>(SELECTED_DATE_KEY, new Date().toISOString().split('T')[0]),
      years: loadedYears,
      selectedYearId: selectedYearId || loadedYears[0].id
    };
  });

  useEffect(() => {
    saveToStorage(ENTRIES_KEY, state.entries);
  }, [state.entries]);

  useEffect(() => {
    saveToStorage(METRICS_KEY, state.metrics);
  }, [state.metrics]);

  useEffect(() => {
    saveToStorage(TASKS_KEY, state.tasks);
  }, [state.tasks]);

  useEffect(() => {
    saveToStorage(SELECTED_DATE_KEY, state.selectedDate);
  }, [state.selectedDate]);

  useEffect(() => {
    saveToStorage(YEARS_KEY, state.years);
  }, [state.years]);

  useEffect(() => {
    saveToStorage(SELECTED_YEAR_KEY, state.selectedYearId);
  }, [state.selectedYearId]);

  const updateState = (updates: Partial<AppState> | ((prev: AppState) => AppState)) => {
    setState(prev => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  };

  const setEntries = (entries: DailyEntry[]) => {
    updateState({ entries });
  };

  const setMetrics = (metrics: Metric[]) => {
    updateState({ metrics });
  };

  const setTasks = (tasks: Task[]) => {
    updateState({ tasks });
  };

  const setSelectedDate = (selectedDate: string) => {
    updateState({ selectedDate });
  };

  const exportData = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        entries: state.entries,
        metrics: state.metrics,
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {
      console.log('Data copied to clipboard successfully!');
    }).catch((err) => {
      console.error('Failed to copy data to clipboard:', err);
      // Fallback: create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  };

  const importData = (jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString);

      if (!imported.data || !imported.data.entries) {
        throw new Error('Invalid backup data format');
      }

      const entries = imported.data.entries || [];
      const metrics = imported.data.metrics || [];

      updateState(prev => ({
        ...prev,
        entries,
        metrics
      }));

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  const clearAllData = () => {
    updateState({
      entries: [],
      metrics: [],
      selectedDate: new Date().toISOString().split('T')[0],
    });
  };

  // Year management functions
  const addYear = (yearData: Omit<Year, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Auto-create 21-day epochs
    const totalDays = dayjs(yearData.endDate).diff(dayjs(yearData.startDate), 'day') + 1;
    const numEpochs = Math.ceil(totalDays / 21);
    const defaultEpochs: Epoch[] = [];
    
    for (let i = 0; i < numEpochs; i++) {
      const epochStart = dayjs(yearData.startDate).add(i * 21, 'day');
      const epochEnd = dayjs(yearData.startDate).add((i + 1) * 21 - 1, 'day');
      const actualEnd = epochEnd.isAfter(dayjs(yearData.endDate)) ? dayjs(yearData.endDate) : epochEnd;
      
      defaultEpochs.push({
        id: `epoch-${Date.now()}-${i}`,
        name: `Epoch ${i + 1}`,
        description: '',
        startDate: epochStart.format('YYYY-MM-DD'),
        endDate: actualEnd.format('YYYY-MM-DD'),
        color: '#cccccc', // Neutral gray, not used for display
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    const newYear: Year = {
      ...yearData,
      id: `year-${Date.now()}`,
      epochs: defaultEpochs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateState(prev => ({
      ...prev,
      years: [...prev.years, newYear]
    }));
  };

  const updateYear = (yearId: string, updates: Partial<Year>) => {
    updateState(prev => ({
      ...prev,
      years: prev.years.map(year => 
        year.id === yearId 
          ? { ...year, ...updates, updatedAt: new Date().toISOString() }
          : year
      )
    }));
  };

  const deleteYear = (yearId: string) => {
    updateState(prev => {
      const newYears = prev.years.filter(year => year.id !== yearId);
      const newSelectedYearId = prev.selectedYearId === yearId 
        ? (newYears.length > 0 ? newYears[0].id : '')
        : prev.selectedYearId;
      
      return {
        ...prev,
        years: newYears,
        selectedYearId: newSelectedYearId
      };
    });
  };

  const setSelectedYear = (yearId: string) => {
    updateState({ selectedYearId: yearId });
  };

  // Epoch management functions
  const addEpoch = (yearId: string, epochData: Omit<Epoch, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEpoch: Epoch = {
      ...epochData,
      id: `epoch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateState(prev => ({
      ...prev,
      years: prev.years.map(year => 
        year.id === yearId 
          ? { ...year, epochs: [...year.epochs, newEpoch], updatedAt: new Date().toISOString() }
          : year
      )
    }));
  };

  const updateEpoch = (yearId: string, epochId: string, updates: Partial<Epoch>) => {
    updateState(prev => ({
      ...prev,
      years: prev.years.map(year => 
        year.id === yearId 
          ? {
              ...year,
              epochs: year.epochs.map(epoch =>
                epoch.id === epochId 
                  ? { ...epoch, ...updates, updatedAt: new Date().toISOString() }
                  : epoch
              ),
              updatedAt: new Date().toISOString()
            }
          : year
      )
    }));
  };

  const deleteEpoch = (yearId: string, epochId: string) => {
    updateState(prev => ({
      ...prev,
      years: prev.years.map(year => 
        year.id === yearId 
          ? { 
              ...year, 
              epochs: year.epochs.filter(epoch => epoch.id !== epochId),
              updatedAt: new Date().toISOString()
            }
          : year
      )
    }));
  };

  return (
    <AppContext.Provider value={{
      state,
      setState: updateState,
      setEntries,
      setMetrics,
      setTasks,
      setSelectedDate,
      exportData,
      importData,
      clearAllData,
      addYear,
      updateYear,
      deleteYear,
      setSelectedYear,
      addEpoch,
      updateEpoch,
      deleteEpoch,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
