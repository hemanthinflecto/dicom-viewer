import React from 'react';

export const ImageFilters = ({ onInvert, onSharpen, isInverted }) => {
  return (
    <div className="flex items-center space-x-2 bg-slate-700/50 rounded-lg p-2">
      <span className="text-sm text-slate-300 font-medium">Filters:</span>
      
      <button
        onClick={onInvert}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          isInverted
            ? 'bg-blue-600 text-white'
            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
        }`}
        title="Invert Colors"
      >
        🔳 Invert
      </button>

      <button
        onClick={onSharpen}
        className="px-3 py-1.5 rounded text-sm font-medium bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors"
        title="Sharpen (Coming Soon)"
      >
        🔪 Sharpen
      </button>
    </div>
  );
};

