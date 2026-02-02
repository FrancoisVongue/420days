export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  content: string;
  satisfaction: number; // 0-100
  color: string; // hex color based on satisfaction
  createdAt: string;
  updatedAt: string;
}

export interface WritingStats {
  totalEntries: number;
  averageSatisfaction: number;
  currentStreak: number;
  longestStreak: number;
  satisfiedDays: number; // days with satisfaction >= 70
}

export interface MetricEntry {
  date: string; // YYYY-MM-DD format
  value: number;
}

export interface Metric {
  id: string;
  name: string;
  color: string;
  targetValue: number;
  entries: MetricEntry[];
  unit?: string;
  isDefault?: boolean;
  epochId?: string; // Optional: if set, metric belongs to specific epoch
  tags?: string[]; // Optional: tags for filtering and organization
}

export interface Epoch {
  id: string;
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string; // hex color for visualization
  createdAt: string;
  updatedAt: string;
}

export interface Year {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  epochs: Epoch[];
  createdAt: string;
  updatedAt: string;
}