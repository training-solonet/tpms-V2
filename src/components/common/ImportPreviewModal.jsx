import React from 'react';

const ImportPreviewModal = ({ 
  isOpen, 
  data = [], 
  fileName = '', 
  importMode = 'skip',
  onCancel, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000] p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl xl:max-w-4xl max-h-[95vh] md:max-h-[85vh] overflow-hidden flex flex-col border-2 border-gray-300">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Confirm Import</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                Review {data.length} user(s) from <span className="font-semibold break-all">{fileName}</span>
              </p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 min-h-0">
          {/* Import Mode Info */}
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0">
            <p className="text-xs sm:text-sm text-amber-800">
              <span className="font-semibold">
                Mode: {importMode === 'skip' ? '⏭️ Skip Duplicates' : '🔄 Overwrite Duplicates'}
              </span>
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {importMode === 'skip' 
                ? 'Users with existing emails will be skipped.' 
                : 'Users with existing emails will be updated with new data (except password).'}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">#</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Role</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                        No data to import
                      </td>
                    </tr>
                  ) : (
                    data.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-900 max-w-[120px] sm:max-w-none truncate">
                          {user.name || '-'}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-900 font-mono max-w-[150px] sm:max-w-none truncate">
                          {user.email}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : user.role === 'operator'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role || 'admin'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-stretch sm:items-center flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={data.length === 0}
            className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium shadow-sm order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Confirm & Import {data.length} Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
