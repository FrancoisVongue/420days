import React from 'react';
import { Metric } from '../types';
import { WritingGrid } from './WritingGrid';
import { DailyEntry } from '../types';
import { MetricsChart } from './MetricsChart';
import { DailyJournal } from './DailyJournal';
import { YearSelector } from './YearSelector';
import { EpochManager } from './EpochManager';

interface StatsViewProps {
  entries: DailyEntry[];
  metrics: Metric[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ entries, metrics, selectedDate, onDateSelect }) => {
  return (
    <div className="h-full w-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* Year/Epoch Controls - top row, full width */}
      <div className="flex space-x-4 flex-shrink-0">
        <YearSelector />
        <EpochManager />
      </div>
      
      {/* Main content area - takes remaining height */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Writing Grid - left side, full height */}
        <div className="min-h-0 overflow-hidden">
          <WritingGrid entries={entries} metrics={metrics} selectedDate={selectedDate} onDateSelect={onDateSelect} />
        </div>
        
        {/* Right column - Metrics and Journal */}
        <div className="grid grid-rows-2 gap-4 min-h-0">
          {/* Metrics Chart - top half */}
          <div className="min-h-0 overflow-hidden">
            <MetricsChart selectedDate={selectedDate} metrics={metrics} />
          </div>
          
          {/* Daily Journal - bottom half */}
          <div className="min-h-0 overflow-hidden">
            <DailyJournal selectedDate={selectedDate} metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
};