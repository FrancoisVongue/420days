import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const YearSelector: React.FC = () => {
  const { state, addYear, deleteYear, setSelectedYear } = useApp();
  const { years, selectedYearId } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingYear, setIsCreatingYear] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');

  const selectedYear = years.find(y => y.id === selectedYearId);

  const handleCreateYear = () => {
    if (!newYearName || !newYearStart || !newYearEnd) return;
    
    addYear({
      name: newYearName,
      startDate: newYearStart,
      endDate: newYearEnd,
      epochs: []
    });

    setNewYearName('');
    setNewYearStart('');
    setNewYearEnd('');
    setIsCreatingYear(false);
    setIsOpen(false);
  };

  const handleDeleteYear = (yearId: string) => {
    if (years.length <= 1) {
      alert('Cannot delete the last year');
      return;
    }
    
    if (confirm('Are you sure you want to delete this year? All epochs will be lost.')) {
      deleteYear(yearId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-900">
          {selectedYear ? selectedYear.name : 'Select Year'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={() => setIsCreatingYear(true)}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Year</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {years.map(year => (
                <div
                  key={year.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    year.id === selectedYearId ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedYear(year.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{year.name}</h4>
                      <p className="text-sm text-gray-500">
                        {year.startDate} → {year.endDate}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {year.epochs.length} epoch{year.epochs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {years.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteYear(year.id);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create Year Modal */}
      {isCreatingYear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Year</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Name
                </label>
                <input
                  type="text"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newYearEnd}
                  onChange={(e) => setNewYearEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setIsCreatingYear(false);
                  setNewYearName('');
                  setNewYearStart('');
                  setNewYearEnd('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateYear}
                disabled={!newYearName || !newYearStart || !newYearEnd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Year
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
