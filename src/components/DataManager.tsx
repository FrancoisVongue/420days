import React, { useState } from 'react';
import { Copy, Clipboard, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import dayjs from 'dayjs';

export const DataManager: React.FC = () => {
  const { exportData, importData, clearAllData, state, setEntries, setMetrics, setTasks } = useApp();
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'epoch' | 'dateRange' | 'allTime' | null;
    data?: any;
  }>({ type: null });
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const { years, selectedYearId, entries, metrics, tasks } = state;
  const selectedYear = years.find(y => y.id === selectedYearId);

  const handleExport = () => {
    exportData();
    setNotification({
      show: true,
      message: 'Data copied to clipboard! You can paste it anywhere to save your backup.',
      type: 'success'
    });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setNotification({
        show: true,
        message: 'Please paste your backup data first.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    const success = importData(importText.trim());
    if (success) {
      setNotification({
        show: true,
        message: 'Data imported successfully!',
        type: 'success'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
      setImportText('');
      setShowImport(false);
    } else {
      setNotification({
        show: true,
        message: 'Failed to import data. Please check the JSON format.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    }
  };

  const handleClearEpoch = (epochId: string) => {
    const epoch = selectedYear?.epochs.find(e => e.id === epochId);
    if (!epoch) return;

    setEntries(entries.filter(entry => entry.date < epoch.startDate || entry.date > epoch.endDate));
    setMetrics(metrics.map(metric => ({
      ...metric,
      entries: metric.entries.filter(entry => entry.date < epoch.startDate || entry.date > epoch.endDate)
    })));
    setTasks(tasks.map(task => ({
      ...task,
      completedDate: (task.completedDate && task.completedDate >= epoch.startDate && task.completedDate <= epoch.endDate)
        ? undefined
        : task.completedDate
    })));

    setConfirmAction({ type: null });
    setShowClearModal(false);
    setNotification({
      show: true,
      message: `Epoch "${epoch.name}" data has been cleared.`,
      type: 'success'
    });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleClearDateRange = (fromDate: string, toDate: string) => {
    setEntries(entries.filter(entry => entry.date < fromDate || entry.date > toDate));
    setMetrics(metrics.map(metric => ({
      ...metric,
      entries: metric.entries.filter(entry => entry.date < fromDate || entry.date > toDate)
    })));
    setTasks(tasks.map(task => ({
      ...task,
      completedDate: (task.completedDate && task.completedDate >= fromDate && task.completedDate <= toDate)
        ? undefined
        : task.completedDate
    })));

    setConfirmAction({ type: null });
    setShowClearModal(false);
    setNotification({
      show: true,
      message: 'Date range data has been cleared.',
      type: 'success'
    });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleClearAllTime = () => {
    clearAllData();
    setConfirmAction({ type: null });
    setShowClearModal(false);
    setNotification({
      show: true,
      message: 'All data has been cleared.',
      type: 'success'
    });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
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
          onClick={() => setShowClearModal(true)}
          disabled={!hasData}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear data"
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

      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clear Data</h3>
                <p className="text-sm text-gray-600">Choose what to delete</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {selectedYear && selectedYear.epochs.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-900 mb-3">Specific Epoch</div>
                  <div className="space-y-2">
                    {selectedYear.epochs.map(epoch => (
                      <button
                        key={epoch.id}
                        onClick={() => setConfirmAction({ type: 'epoch', data: epoch })}
                        className="w-full text-left px-3 py-2 border border-gray-200 rounded-md hover:border-red-500 hover:bg-red-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{epoch.name}</div>
                            <div className="text-xs text-gray-500">
                              {dayjs(epoch.startDate).format('MMM D')} - {dayjs(epoch.endDate).format('MMM D, YYYY')}
                            </div>
                          </div>
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-2 border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-3">Date Range</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">From</label>
                    <input
                      type="date"
                      id="clearFromDate"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">To</label>
                    <input
                      type="date"
                      id="clearToDate"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const fromDate = (document.getElementById('clearFromDate') as HTMLInputElement)?.value;
                    const toDate = (document.getElementById('clearToDate') as HTMLInputElement)?.value;
                    if (fromDate && toDate) {
                      setConfirmAction({ type: 'dateRange', data: { fromDate, toDate } });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Clear Date Range
                </button>
              </div>

              <button
                onClick={() => setConfirmAction({ type: 'allTime' })}
                className="w-full text-left p-4 border-2 border-red-300 bg-red-50 rounded-lg hover:border-red-600 hover:bg-red-100 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-red-900 mb-1">⚠️ All Time</div>
                    <div className="text-sm text-red-700">
                      Delete ALL data permanently
                    </div>
                    <div className="text-xs text-red-600 mt-2 font-medium">
                      This action cannot be undone!
                    </div>
                  </div>
                  <div className="ml-3 text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                </div>
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              {confirmAction.type === 'epoch' && confirmAction.data && (
                <>
                  <p className="text-gray-700 mb-3">
                    Delete all data for epoch <span className="font-semibold">&quot;{confirmAction.data.name}&quot;</span>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-800 text-sm font-medium mb-2">⚠️ This will delete:</p>
                    <ul className="text-red-700 text-sm space-y-1 ml-4">
                      <li>• All journal entries</li>
                      <li>• All metric values</li>
                      <li>• All task completions</li>
                    </ul>
                    <p className="text-red-600 text-xs mt-2">
                      For dates: {dayjs(confirmAction.data.startDate).format('MMM D')} - {dayjs(confirmAction.data.endDate).format('MMM D, YYYY')}
                    </p>
                  </div>
                </>
              )}
              
              {confirmAction.type === 'dateRange' && confirmAction.data && (
                <>
                  <p className="text-gray-700 mb-3">
                    Delete all data from <span className="font-semibold">{dayjs(confirmAction.data.fromDate).format('MMM D, YYYY')}</span> to <span className="font-semibold">{dayjs(confirmAction.data.toDate).format('MMM D, YYYY')}</span>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-800 text-sm font-medium mb-2">⚠️ This will delete:</p>
                    <ul className="text-red-700 text-sm space-y-1 ml-4">
                      <li>• All journal entries in this range</li>
                      <li>• All metric values in this range</li>
                      <li>• All task completions in this range</li>
                    </ul>
                  </div>
                </>
              )}
              
              {confirmAction.type === 'allTime' && (
                <>
                  <p className="text-gray-700 mb-3 font-semibold text-red-900">
                    ⚠️ DELETE ALL DATA?
                  </p>
                  <div className="bg-red-100 border-2 border-red-300 rounded-md p-4">
                    <p className="text-red-900 text-sm font-bold mb-3">This will permanently delete:</p>
                    <ul className="text-red-800 text-sm space-y-1 ml-4 font-medium">
                      <li>• ALL journal entries</li>
                      <li>• ALL metric values</li>
                      <li>• ALL task completions</li>
                      <li>• ALL years and epochs</li>
                    </ul>
                    <p className="text-red-900 text-sm font-bold mt-3">
                      This action CANNOT be undone!
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setConfirmAction({ type: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'epoch' && confirmAction.data) {
                    handleClearEpoch(confirmAction.data.id);
                  } else if (confirmAction.type === 'dateRange' && confirmAction.data) {
                    handleClearDateRange(confirmAction.data.fromDate, confirmAction.data.toDate);
                  } else if (confirmAction.type === 'allTime') {
                    handleClearAllTime();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={notification.type === 'success' ? 'bg-green-50 border border-green-200 rounded-lg shadow-lg p-4' : 'bg-red-50 border border-red-200 rounded-lg shadow-lg p-4'}>
            <p className={notification.type === 'success' ? 'text-sm font-medium text-green-800' : 'text-sm font-medium text-red-800'}>
              {notification.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
