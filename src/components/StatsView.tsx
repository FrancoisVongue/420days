import React from 'react';
import { Target, Award, Heart, Calendar } from 'lucide-react';
import { WritingStats } from '../types';
import { WritingGrid } from './WritingGrid';
import { DailyEntry } from '../types';
import { MetricsChart } from './MetricsChart';
import { DailyJournal } from './DailyJournal';

interface StatsViewProps {
  stats: WritingStats;
  entries: DailyEntry[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onEntryUpdate: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ stats, entries, selectedDate, onDateSelect, onEntryUpdate }) => {
  const statItems = [
    {
      label: 'Current Streak',
      value: stats.currentStreak,
      suffix: 'days',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Longest Streak',
      value: stats.longestStreak,
      suffix: 'days',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Satisfied Days',
      value: stats.satisfiedDays,
      suffix: 'days',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      label: 'Total Days',
      value: stats.totalEntries,
      suffix: 'days',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-4 p-4 relative">
      {/* Writing Journey - spans both rows on LEFT */}
      <div className="col-start-1 row-span-2">
        <WritingGrid entries={entries} selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </div>
      
      {/* Metrics Chart - top RIGHT */}
      <div className="col-start-2 row-start-1 h-full">
        <MetricsChart selectedDate={selectedDate} />
      </div>
      
      {/* Daily Journal - bottom RIGHT */}
      <div className="col-start-2 row-start-2 h-full">
        <DailyJournal selectedDate={selectedDate} onEntryUpdate={onEntryUpdate} />
      </div>
      
      {/* Stats Cards - overlaid on bottom of writing grid */}
      <div className="absolute bottom-8 left-8 grid grid-cols-2 gap-2 z-10">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-3 min-w-[120px]">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center justify-center w-6 h-6 ${item.bgColor} rounded-full`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{item.value}</div>
                  <div className="text-sm text-gray-500">{item.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};