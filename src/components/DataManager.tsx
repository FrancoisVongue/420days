import React, { useState } from 'react';
import { Copy, Clipboard, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DataManager: React.FC = () => {
  const { exportData, importData, clearAllData, state } = useApp();
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    exportData();
    alert('Data copied to clipboard! You can paste it anywhere to save your backup.');
  };

  const handleImport = () => {
    if (!importText.trim()) {
      alert('Please paste your backup data first.');
      return;
    }

    const success = importData(importText.trim());
    if (success) {
      alert('Data imported successfully!');
      setImportText('');
      setShowImport(false);
    } else {
      alert('Failed to import data. Please check the JSON format.');
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
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <button
          onClick={handleExport}
          disabled={!hasData}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copy data to clipboard"
        >
          <Copy className="w-3 h-3 mr-1" />
          Export
        </button>

        <button
          onClick={() => setShowImport(!showImport)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Import data from clipboard"
        >
          <Clipboard className="w-3 h-3 mr-1" />
          Import
        </button>

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

      {showImport && (
        <div className="flex flex-col space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <label className="text-xs font-medium text-gray-700">
            Paste your backup JSON data:
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your exported JSON data here..."
            className="w-full h-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Data
            </button>
            <button
              onClick={() => {
                setShowImport(false);
                setImportText('');
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
