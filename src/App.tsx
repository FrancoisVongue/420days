import React, { useState, useEffect } from 'react';
import { PenTool, CalendarDays } from 'lucide-react';
import { StatsView } from './components/StatsView';
import { getAllEntries } from './utils/storage';
import { calculateStats } from './utils/stats';
import { DailyEntry } from './types';
import dayjs from 'dayjs';

function App() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    const allEntries = getAllEntries();
    setEntries(allEntries);
  };

  const stats = calculateStats(entries);
  const today = dayjs().format('YYYY-MM-DD');
  const isToday = selectedDate === today;
  const selectedDateFormatted = dayjs(selectedDate).format('MMMM D, YYYY');
  const selectedDayName = dayjs(selectedDate).format('dddd');

  return (
    <div className="fixed inset-0 bg-gray-50 grid grid-rows-[auto_auto_1fr] overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Daily Journal</h1>
          </div>
        </div>
      </header>

      {/* Selected Date Header */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="px-6 py-2">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-gray-900">
                  {selectedDayName}, {selectedDateFormatted}
                </h2>
                {isToday && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Today
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="overflow-hidden min-h-0">
        <StatsView 
          stats={stats} 
          entries={entries} 
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate}
          onEntryUpdate={loadEntries}
        />
      </main>
    </div>
  );
}

export default App;