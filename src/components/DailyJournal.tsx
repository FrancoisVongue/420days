import React, { useState, useEffect } from 'react';
import { Save, BookOpen, Smile, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { DailyEntry } from '../types';
import { saveEntry, getEntryByDate, getAllEntries } from '../utils/storage';

// Function to get color based on satisfaction (0-100)
const getSatisfactionColor = (satisfaction: number): string => {
  if (satisfaction <= 50) {
    // Black (0) to White (50)
    const ratio = satisfaction / 50;
    const value = Math.round(255 * ratio);
    const hex = value.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  } else {
    // White (50) to Dark Green (100)
    const ratio = (satisfaction - 50) / 50;
    const r = Math.round(255 - (255 - 26) * ratio);
    const g = Math.round(255 - (255 - 95) * ratio);
    const b = Math.round(255 - (255 - 26) * ratio);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
};

interface DailyJournalProps {
  selectedDate: string;
  onEntryUpdate: () => void;
}

export const DailyJournal: React.FC<DailyJournalProps> = ({ selectedDate, onEntryUpdate }) => {
  const [content, setContent] = useState('');
  const [satisfaction, setSatisfaction] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Load existing entry for selected date
    const existingEntry = getEntryByDate(selectedDate);
    if (existingEntry) {
      setContent(existingEntry.content);
      setSatisfaction(existingEntry.satisfaction);
    } else {
      setContent('');
      setSatisfaction(50);
    }
    setLastSaved(null);
  }, [selectedDate]);

  // Calculate current color based on satisfaction
  const currentColor = getSatisfactionColor(satisfaction);

  const handleSave = async () => {
    setIsSaving(true);
    
    const entry: DailyEntry = {
      id: `${selectedDate}-${Date.now()}`,
      date: selectedDate,
      content: content.trim(),
      satisfaction,
      color: currentColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      saveEntry(entry);
      setLastSaved(new Date().toLocaleTimeString());
      onEntryUpdate();
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    
    try {
      // Clear journal entry
      const allEntries = getAllEntries();
      const filteredEntries = allEntries.filter(entry => entry.date !== selectedDate);
      localStorage.setItem('daily-writing-entries', JSON.stringify(filteredEntries));
      
      // Clear metrics data for this day (stored in localStorage with different keys)
      // Note: This assumes metrics are stored in localStorage. If they're stored differently,
      // this would need to be updated to match the actual storage mechanism.
      
      // Dispatch custom event to clear metrics data
      window.dispatchEvent(new CustomEvent('clearDayData', { 
        detail: { date: selectedDate } 
      }));
      
      // Reset form state
      setContent('');
      setSatisfaction(50);
      setLastSaved(null);
      
      // Trigger update
      onEntryUpdate();
      
      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const getSatisfactionTextColorClass = (value: number) => {
    // Use a neutral color for text since we're showing the actual color in the preview
    return 'text-gray-700';
  };

  const getSatisfactionEmoji = (value: number) => {
    if (value >= 90) return '😄';
    if (value >= 70) return '😊';
    if (value >= 50) return '😐';
    if (value >= 30) return '😕';
    return '😞';
  };

  const today = dayjs().format('YYYY-MM-DD');
  const isToday = selectedDate === today;
  const selectedDateFormatted = dayjs(selectedDate).format('MMMM D, YYYY');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full grid grid-rows-[auto_1fr_auto_auto] gap-3 overflow-hidden">
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
        {lastSaved && (
          <div className="text-sm text-green-600">
            Saved at {lastSaved}
          </div>
        )}
      </div>

      <div className="overflow-hidden min-h-0 flex flex-col">
        <label htmlFor="journal-content" className="block text-sm font-medium text-gray-700 mb-2 flex-shrink-0">
          Your thoughts and reflections
        </label>
        <textarea
          id="journal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isToday ? "What happened today? How are you feeling? What did you learn?" : "What do you remember about this day?"}
          className="w-full flex-1 min-h-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
        />
        <div className="mt-2 text-sm text-gray-500 flex-shrink-0">
          {content.length} characters
        </div>
      </div>

      {/* Satisfaction Slider */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="satisfaction-slider" className="block text-sm font-medium text-gray-700">
            Daily Satisfaction
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getSatisfactionEmoji(satisfaction)}</span>
            <div 
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: currentColor }}
              title={`Color preview: ${currentColor}`}
            />
            <span className={`text-lg font-bold ${getSatisfactionTextColorClass(satisfaction)}`}>
              {satisfaction}%
            </span>
          </div>
        </div>
        
        <div className="relative">
          <input
            id="satisfaction-slider"
            type="range"
            min="0"
            max="100"
            value={satisfaction}
            onChange={(e) => setSatisfaction(parseInt(e.target.value))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #000000 0%,     /* Black */
                #ffffff 50%,    /* White */
                #1a5f1a 100%    /* Dark Green */
              )`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Terrible</span>
            <span>Below Average</span>
            <span>Okay</span>
            <span>Good</span>
            <span>Amazing</span>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          Rate how satisfied you feel about this day overall
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-between items-center flex-shrink-0">
        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Data</span>
        </button>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
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
                <h3 className="text-lg font-semibold text-gray-900">Clear All Data</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to clear all data for{' '}
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
                  <li>• Journal entry and thoughts</li>
                  <li>• Daily satisfaction rating</li>
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
                <span>{isClearing ? 'Clearing...' : 'Clear All Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: none;
        }
      `}</style>
    </div>
  );
};