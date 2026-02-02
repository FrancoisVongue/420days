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
    <div className="h-full w-full grid grid-cols-2 gap-4 p-4 relative" style={{ gridTemplateRows: 'auto 1fr' }}>
      {/* Year/Epoch Controls - top row, full width */}
      <div className="col-start-1 col-span-2 flex space-x-4">
        <YearSelector />
        <EpochManager />
      </div>
      
      {/* Writing Grid - bottom left */}
      <div className="col-start-1 row-start-2">
        <WritingGrid entries={entries} metrics={metrics} selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </div>
      
      {/* Right column - Metrics and Journal */}
      <div className="col-start-2 row-start-2 grid grid-rows-2 gap-4">
        {/* Metrics Chart - top */}
        <div className="row-start-1">
          <MetricsChart selectedDate={selectedDate} metrics={metrics} />
        </div>
        
        {/* Daily Journal - bottom */}
        <div className="row-start-2">
          <DailyJournal selectedDate={selectedDate} metrics={metrics} />
        </div>
      </div>
    </div>
  );
};