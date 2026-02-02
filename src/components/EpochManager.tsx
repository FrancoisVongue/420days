import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Target, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Epoch } from '../types';
import dayjs from 'dayjs';

const EPOCH_COLORS = [
  '#9be9a8', // Light green
  '#40c463', // Medium green  
  '#30a14e', // Dark green
  '#216e39', // Darker green
];

export const EpochManager: React.FC = () => {
  const { state, addEpoch, updateEpoch, deleteEpoch } = useApp();
  const { years, selectedYearId } = state;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingEpoch, setIsCreatingEpoch] = useState(false);
  const [editingEpoch, setEditingEpoch] = useState<Epoch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: EPOCH_COLORS[0]
  });

  const selectedYear = years.find(y => y.id === selectedYearId);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      color: EPOCH_COLORS[0]
    });
    setIsCreatingEpoch(false);
    setEditingEpoch(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.startDate || !formData.endDate || !selectedYear) return;

    // Validate dates are within year range
    if (formData.startDate < selectedYear.startDate || formData.endDate > selectedYear.endDate) {
      alert('Epoch dates must be within the year range');
      return;
    }

    // Validate start is before end
    if (formData.startDate > formData.endDate) {
      alert('Start date must be before end date');
      return;
    }

    if (editingEpoch) {
      // When editing, remove overlapping epochs (except the one being edited)
      const overlappingEpochs = selectedYear.epochs.filter(epoch => {
        if (epoch.id === editingEpoch.id) return false;
        return (
          (formData.startDate >= epoch.startDate && formData.startDate <= epoch.endDate) ||
          (formData.endDate >= epoch.startDate && formData.endDate <= epoch.endDate) ||
          (formData.startDate <= epoch.startDate && formData.endDate >= epoch.endDate)
        );
      });

      // Delete overlapping epochs first
      if (overlappingEpochs.length > 0) {
        const epochNames = overlappingEpochs.map(e => e.name).join(', ');
        if (!confirm(`This will remove the following epochs: ${epochNames}. Continue?`)) {
          return;
        }
      }

      overlappingEpochs.forEach(epoch => {
        deleteEpoch(selectedYearId, epoch.id);
      });

      // Then update the epoch
      updateEpoch(selectedYearId, editingEpoch.id, formData);
    } else {
      // When creating new epoch, remove overlapping epochs
      const overlappingEpochs = selectedYear.epochs.filter(epoch => {
        return (
          (formData.startDate >= epoch.startDate && formData.startDate <= epoch.endDate) ||
          (formData.endDate >= epoch.startDate && formData.endDate <= epoch.endDate) ||
          (formData.startDate <= epoch.startDate && formData.endDate >= epoch.endDate)
        );
      });

      // Ask for confirmation if there are overlapping epochs
      if (overlappingEpochs.length > 0) {
        const epochNames = overlappingEpochs.map(e => e.name).join(', ');
        if (!confirm(`This will remove the following epochs: ${epochNames}. Continue?`)) {
          return;
        }
      }

      // Delete overlapping epochs
      overlappingEpochs.forEach(epoch => {
        deleteEpoch(selectedYearId, epoch.id);
      });

      // Add the new epoch
      addEpoch(selectedYearId, formData);
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (epoch: Epoch) => {
    setFormData({
      name: epoch.name,
      description: epoch.description || '',
      startDate: epoch.startDate,
      endDate: epoch.endDate,
      color: epoch.color
    });
    setEditingEpoch(epoch);
    setIsCreatingEpoch(true);
    setIsOpen(false);
  };

  const handleDelete = (epochId: string) => {
    if (confirm('Are you sure you want to delete this epoch?')) {
      deleteEpoch(selectedYearId, epochId);
      setIsOpen(false);
    }
  };

  const getEpochDuration = (epoch: Epoch) => {
    const start = dayjs(epoch.startDate);
    const end = dayjs(epoch.endDate);
    return end.diff(start, 'day') + 1;
  };

  if (!selectedYear) return null;

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Target className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-900">
          Epochs ({selectedYear.epochs.length})
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={() => setIsCreatingEpoch(true)}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Epoch</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
              {selectedYear.epochs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No epochs yet</p>
              ) : (
                selectedYear.epochs
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map(epoch => (
                    <div
                      key={epoch.id}
                      className="p-3 rounded-lg hover:bg-gray-50 transition-all mb-2 last:mb-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: epoch.color }}
                            />
                            <h4 className="font-medium text-gray-900">{epoch.name}</h4>
                          </div>
                          {epoch.description && (
                            <p className="text-sm text-gray-600 mb-2">{epoch.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{epoch.startDate} → {epoch.endDate}</span>
                            </div>
                            <span>{getEpochDuration(epoch)} days</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(epoch)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(epoch.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Epoch Modal */}
      {isCreatingEpoch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingEpoch ? 'Edit Epoch' : 'Create New Epoch'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Epoch Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Running Challenge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Describe your epoch goals..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={selectedYear.startDate}
                    max={selectedYear.endDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || selectedYear.startDate}
                    max={selectedYear.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {EPOCH_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.startDate || !formData.endDate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingEpoch ? 'Update Epoch' : 'Create Epoch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
