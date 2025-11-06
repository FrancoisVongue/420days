import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DailyEntry, Metric } from '../types';

interface AppState {
  entries: DailyEntry[];
  metrics: Metric[];
  selectedDate: string;
}

interface AppContextType {
  state: AppState;
  setState: (updates: Partial<AppState> | ((prev: AppState) => AppState)) => void;
  setEntries: (entries: DailyEntry[]) => void;
  setMetrics: (metrics: Metric[]) => void;
  setSelectedDate: (date: string) => void;
  exportData: () => void;
  importData: (file: File) => Promise<boolean>;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ENTRIES_KEY = 'daily-writing-entries';
const METRICS_KEY = 'daily-writing-metrics';
const SELECTED_DATE_KEY = 'daily-writing-selected-date';

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
  const [state, setState] = useState<AppState>(() => ({
    entries: loadFromStorage<DailyEntry[]>(ENTRIES_KEY, []),
    metrics: loadFromStorage<Metric[]>(METRICS_KEY, []),
    selectedDate: loadFromStorage<string>(SELECTED_DATE_KEY, new Date().toISOString().split('T')[0]),
  }));

  useEffect(() => {
    saveToStorage(ENTRIES_KEY, state.entries);
  }, [state.entries]);

  useEffect(() => {
    saveToStorage(METRICS_KEY, state.metrics);
  }, [state.metrics]);

  useEffect(() => {
    saveToStorage(SELECTED_DATE_KEY, state.selectedDate);
  }, [state.selectedDate]);

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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-writing-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!imported.data || !imported.data.entries) {
        throw new Error('Invalid backup file format');
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

  return (
    <AppContext.Provider value={{
      state,
      setState: updateState,
      setEntries,
      setMetrics,
      setSelectedDate,
      exportData,
      importData,
      clearAllData,
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
