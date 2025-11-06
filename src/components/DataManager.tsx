import React, { useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DataManager: React.FC = () => {
  const { exportData, importData, clearAllData, state } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await importData(file);
    if (success) {
      alert('Data imported successfully!');
    } else {
      alert('Failed to import data. Please check the file format.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      clearAllData();
      alert('All data has been cleared.');
    }
  };

  const hasData = state.entries.length > 0 || state.metrics.length > 0;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={exportData}
        disabled={!hasData}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export data to JSON file"
      >
        <Download className="w-3 h-3 mr-1" />
        Export
      </button>

      <label className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-blue-500">
        <Upload className="w-3 h-3 mr-1" />
        Import
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>

      <button
        onClick={handleClear}
        disabled={!hasData}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Clear all data"
      >
        <Trash2 className="w-3 h-3 mr-1" />
        Clear
      </button>
    </div>
  );
};
