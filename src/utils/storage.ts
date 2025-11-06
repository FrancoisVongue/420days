import { DailyEntry } from '../types';

const STORAGE_KEY = 'daily-writing-entries';

export const saveEntry = (entry: DailyEntry): void => {
  const entries = getAllEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const getAllEntries = (): DailyEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const getEntryByDate = (date: string): DailyEntry | null => {
  const entries = getAllEntries();
  return entries.find(e => e.date === date) || null;
};

export const getTodayEntry = (): DailyEntry | null => {
  const today = new Date().toISOString().split('T')[0];
  return getEntryByDate(today);
};