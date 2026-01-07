import React from 'react';

/**
 * Modern Alert Modal Component for CRUD Operations
 *
 * Types:
 * - success: Data saved/created successfully
 * - error: Operation failed
 * - warning: Delete confirmation
 * - info: Information message
 *
 * @example
 * <AlertModal
 *   isOpen={showAlert}
 *   type="success"
 *   title="Success!"
 *   message="Data has been saved successfully."
 *   onConfirm={() => setShowAlert(false)}
 *   confirmText="Continue"
 * />
 */

const AlertModal = ({
  isOpen,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  if (!isOpen) return null;

  const configs = {
    success: {
      icon: (
        <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="#4CAF50" strokeWidth="6" fill="none" />
          <path
            d="M30 50 L45 65 L70 35"
            stroke="#4CAF50"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      ),
      iconBg: 'bg-green-50',
      titleColor: 'text-green-600',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      buttonText: 'text-white',
      defaultTitle: 'Success!',
      defaultMessage: 'Operation completed successfully.',
    },
    error: {
      icon: (
        <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="#F44336" strokeWidth="6" fill="none" />
          <path
            d="M35 35 L65 65 M65 35 L35 65"
            stroke="#F44336"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      ),
      iconBg: 'bg-red-50',
      titleColor: 'text-red-600',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      buttonText: 'text-white',
      defaultTitle: 'Oooops!',
      defaultMessage: 'Something went wrong, try again.',
    },
    warning: {
      icon: (
        <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="#FF9800" strokeWidth="6" fill="none" />
          <path d="M50 30 L50 55" stroke="#FF9800" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="70" r="3" fill="#FF9800" />
        </svg>
      ),
      iconBg: 'bg-orange-50',
      titleColor: 'text-orange-600',
      buttonBg: 'bg-orange-500 hover:bg-orange-600',
      buttonText: 'text-white',
      defaultTitle: 'Warning!',
      defaultMessage: 'Are you sure you want to proceed?',
    },
    info: {
      icon: (
        <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="#2196F3" strokeWidth="6" fill="none" />
          <circle cx="50" cy="35" r="3" fill="#2196F3" />
          <path d="M50 45 L50 70" stroke="#2196F3" strokeWidth="6" strokeLinecap="round" />
        </svg>
      ),
      iconBg: 'bg-blue-50',
      titleColor: 'text-blue-600',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      buttonText: 'text-white',
      defaultTitle: 'Information',
      defaultMessage: 'Please note this information.',
    },
  };

  const config = configs[type] || configs.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-md transition-opacity"
        onClick={onCancel || onConfirm}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden p-8 transform transition-all animate-fade-in-up flex flex-col">
        {/* Decorative Wave Background */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden rounded-b-3xl opacity-10 pointer-events-none">
          <svg
            className="absolute bottom-0 w-full"
            viewBox="0 0 1440 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill={
                type === 'success'
                  ? '#4CAF50'
                  : type === 'error'
                    ? '#F44336'
                    : type === 'warning'
                      ? '#FF9800'
                      : '#2196F3'
              }
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,96C1248,75,1344,53,1392,42.7L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        {/* Icon - Fixed */}
        <div
          className={`${config.iconBg} rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 relative z-10 flex-shrink-0`}
        >
          {config.icon}
        </div>

        {/* Title - Fixed */}
        <h2 className={`text-3xl font-bold text-center mb-3 ${config.titleColor} flex-shrink-0`}>
          {title || config.defaultTitle}
        </h2>

        {/* Divider - Fixed */}
        <div className="w-16 h-1 bg-gray-300 rounded mx-auto mb-4 flex-shrink-0" />

        {/* Message - Scrollable */}
        <div className="flex-1 overflow-y-auto mb-8 min-h-0">
          <p className="text-gray-600 text-center text-base leading-relaxed">
            {message || config.defaultMessage}
          </p>
        </div>

        {/* Buttons - Fixed */}
        <div className="flex gap-3 relative z-10 flex-shrink-0">
          {showCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 rounded-xl font-medium ${config.buttonBg} ${config.buttonText} transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg`}
          >
            {confirmText}
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

export default AlertModal;
