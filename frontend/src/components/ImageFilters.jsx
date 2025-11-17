import React from 'react';

export const ImageFilters = ({ onInvert, isInverted }) => {
  return (
    <div className="flex items-center space-x-1 bg-slate-700/50 rounded-lg p-1.5">
      <button
        onClick={onInvert}
        className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
          isInverted
            ? 'bg-blue-600 text-white'
            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
        }`}
        title="Invert Colors"
      >
        🔳 Invert
      </button>
    </div>
  );
};

