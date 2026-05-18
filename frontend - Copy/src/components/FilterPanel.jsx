import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Filter, RefreshCw } from 'lucide-react';

/**
 * Enterprise-grade Filter Panel Component
 * Provides professional filtering UI with collapsible sections
 */
export default function FilterPanel({ 
  filters = [], 
  onApply, 
  onReset,
  isOpen = false,
  onClose 
}) {
  const [values, setValues] = useState({});
  const [expandedSections, setExpandedSections] = useState(
    filters.reduce((acc, f) => ({ ...acc, [f.id]: true }), {})
  );

  const handleChange = (filterId, value) => {
    setValues(prev => ({ ...prev, [filterId]: value }));
  };

  const handleApply = () => {
    onApply(values);
  };

  const handleReset = () => {
    setValues({});
    onReset();
  };

  const toggleSection = (filterId) => {
    setExpandedSections(prev => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-md bg-white shadow-intense overflow-hidden lg:relative lg:max-w-xs"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-surface-200 bg-surface-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Filter className="h-5 w-5 text-primary-600" />
                  </div>
                  <h2 className="text-lg font-bold text-surface-900">Filters</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-200 transition-colors lg:hidden"
                >
                  <X className="h-5 w-5 text-surface-600" />
                </button>
              </div>

              {/* Filter Groups */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-6">
                {filters.map((filter) => (
                  <div key={filter.id} className="border-b border-surface-200 pb-4 last:border-0">
                    <button
                      onClick={() => toggleSection(filter.id)}
                      className="flex w-full items-center justify-between mb-3 group"
                    >
                      <span className="text-sm font-bold text-surface-900 group-hover:text-primary-600 transition-colors">
                        {filter.label}
                      </span>
                      {expandedSections[filter.id] ? (
                        <ChevronUp className="h-4 w-4 text-surface-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-surface-500" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedSections[filter.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {filter.type === 'select' && (
                            <select
                              value={values[filter.id] || ''}
                              onChange={(e) => handleChange(filter.id, e.target.value)}
                              className="select-field"
                            >
                              <option value="">All</option>
                              {filter.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {filter.type === 'checkbox' && (
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                              {filter.options.map((opt) => (
                                <label
                                  key={opt.value}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={values[filter.id]?.includes(opt.value) || false}
                                    onChange={(e) => {
                                      const current = values[filter.id] || [];
                                      const newValue = e.target.checked
                                        ? [...current, opt.value]
                                        : current.filter(v => v !== opt.value);
                                      handleChange(filter.id, newValue);
                                    }}
                                    className="h-4 w-4 text-primary-600 rounded border-surface-300 focus:ring-2 focus:ring-primary-500/20"
                                  />
                                  <span className="text-sm text-surface-700">{opt.label}</span>
                                  {opt.count && (
                                    <span className="ml-auto text-xs text-surface-500">
                                      {opt.count}
                                    </span>
                                  )}
                                </label>
                              ))}
                            </div>
                          )}

                          {filter.type === 'range' && (
                            <div className="space-y-3">
                              <input
                                type="range"
                                min={filter.min}
                                max={filter.max}
                                step={filter.step || 1}
                                value={values[filter.id] || filter.min}
                                onChange={(e) => handleChange(filter.id, Number(e.target.value))}
                                className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                              />
                              <div className="flex justify-between text-xs text-surface-600">
                                <span>{filter.min}</span>
                                <span className="font-semibold text-primary-600">
                                  {values[filter.id] || filter.min}
                                </span>
                                <span>{filter.max}</span>
                              </div>
                            </div>
                          )}

                          {filter.type === 'text' && (
                            <input
                              type="text"
                              placeholder={filter.placeholder}
                              value={values[filter.id] || ''}
                              onChange={(e) => handleChange(filter.id, e.target.value)}
                              className="input-field"
                            />
                          )}

                          {filter.type === 'date-range' && (
                            <div className="space-y-2">
                              <input
                                type="date"
                                value={values[`${filter.id}_from`] || ''}
                                onChange={(e) => handleChange(`${filter.id}_from`, e.target.value)}
                                className="input-field text-sm"
                                placeholder="From"
                              />
                              <input
                                type="date"
                                value={values[`${filter.id}_to`] || ''}
                                onChange={(e) => handleChange(`${filter.id}_to`, e.target.value)}
                                className="input-field text-sm"
                                placeholder="To"
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-surface-200 bg-surface-50 px-6 py-4 space-y-3">
                <button
                  onClick={handleApply}
                  className="btn-primary w-full"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleReset}
                  className="btn-ghost w-full"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset All
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Filter Button - Trigger for opening filter panel
 */
export function FilterButton({ onClick, activeCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className="relative btn-secondary"
    >
      <Filter className="h-4 w-4" />
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

/**
 * Active Filter Tags - Show applied filters as removable tags
 */
export function ActiveFilters({ filters = [], onRemove, onClearAll }) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-surface-700">Active filters:</span>
      {filters.map((filter, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-200"
        >
          <span>{filter.label}: {filter.value}</span>
          <button
            onClick={() => onRemove(filter.id)}
            className="hover:bg-primary-100 rounded p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm font-medium text-danger-600 hover:text-danger-700 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
