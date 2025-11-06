import React from 'react';
import { Metric } from '../types';
import { WritingGrid } from './WritingGrid';
import { DailyEntry } from '../types';
import { MetricsChart } from './MetricsChart';
import { DailyJournal } from './DailyJournal';

interface StatsViewProps {
  entries: DailyEntry[];
  metrics: Metric[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ entries, metrics, selectedDate, onDateSelect }) => {
  return (
    <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-4 p-4 relative">
      {/* Writing Journey - spans both rows on LEFT */}
      <div className="col-start-1 row-span-2">
        <WritingGrid entries={entries} metrics={metrics} selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </div>
      
      {/* Metrics Chart - top RIGHT */}
      <div className="col-start-2 row-start-1 h-full">
        <MetricsChart selectedDate={selectedDate} metrics={metrics} />
      </div>
      
      {/* Daily Journal - bottom RIGHT */}
      <div className="col-start-2 row-start-2 h-full">
        <DailyJournal selectedDate={selectedDate} metrics={metrics} />
      </div>
    </div>
  );
};