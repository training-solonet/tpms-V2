import React from 'react';

/**
 * Duplicate Handling Modal Component
 * Shows when duplicate data is detected during import
 *
 * @param {boolean} isOpen - Modal open state
 * @param {string} itemName - Name/identifier of duplicate item
 * @param {string} dataType - Type of data (driver, truck, etc)
 * @param {function} onSkip - Called when user clicks Skip
 * @param {function} onOverwrite - Called when user clicks Overwrite
 * @param {function} onCancel - Called when user clicks Cancel
 * @param {boolean} showApplyAll - Show "Apply to all" checkbox
 * @param {boolean} applyToAll - Apply to all state
 * @param {function} onApplyAllChange - Called when apply to all changes
 */
const DuplicateModal = ({
  isOpen,
  itemName,
  dataType = 'data',
  errorMessage = '',
  onSkip,
  onOverwrite,
  onCancel,
  showApplyAll = true,
  applyToAll = false,
  onApplyAllChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden p-6 transform transition-all animate-fade-in-up flex flex-col">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
          {/* Icon */}
          <div className="bg-amber-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 flex-shrink-0">
            <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="#F59E0B" strokeWidth="6" fill="none" />
              <path d="M50 30 L50 55" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="70" r="3" fill="#F59E0B" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800 flex-shrink-0">Data Already Exists</h2>

          {/* Divider */}
          <div className="w-16 h-1 bg-amber-400 rounded mx-auto mb-4 flex-shrink-0" />

          {/* Message */}
          <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">{dataType} with name</p>
          <p className="text-lg font-semibold text-gray-800 bg-amber-50 px-4 py-2 rounded-lg inline-block mb-2">
            "{itemName}"
          </p>
          <p className="text-gray-600">already exists in the database.</p>
          {errorMessage && (
            <p className="text-sm text-gray-500 mt-2 bg-gray-50 px-3 py-2 rounded">
              {errorMessage}
            </p>
          )}
        </div>

          {/* Action Message */}
          <p className="text-center text-sm text-gray-500 mb-4">What would you like to do?</p>
        </div>

        {/* Apply to all checkbox - Fixed at bottom */}
        {showApplyAll && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex-shrink-0">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => onApplyAllChange?.(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Apply this choice to all remaining duplicates
              </span>
            </label>
          </div>
        )}

        {/* Buttons - Fixed at bottom */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          <button
            onClick={onOverwrite}
            className="w-full px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Overwrite (Replace with new data)
          </button>

          <button
            onClick={onSkip}
            className="w-full px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Skip (Keep existing data)
          </button>

          <button
            onClick={onCancel}
            className="w-full px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
          >
            Cancel Import
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DuplicateModal;
