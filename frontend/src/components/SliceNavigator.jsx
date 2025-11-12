import React from 'react';

export const SliceNavigator = ({
  currentIndex,
  totalSlices,
  onPrevious,
  onNext,
  onSliceChange,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-4">Slice Navigation</h2>
      
      <div className="flex items-center justify-between space-x-2 mb-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          ← Previous
        </button>
        
        <span className="text-slate-300 text-sm px-2 whitespace-nowrap">
          {currentIndex + 1} / {totalSlices}
        </span>
        
        <button
          onClick={onNext}
          disabled={currentIndex === totalSlices - 1}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>

      <input
        type="range"
        min="0"
        max={totalSlices - 1}
        value={currentIndex}
        onChange={(e) => onSliceChange(parseInt(e.target.value))}
        className="w-full accent-blue-600"
      />

      <div className="mt-3 text-xs text-slate-400 text-center">
        Use arrow keys (↑↓ or ←→) or mouse wheel to navigate
      </div>
    </div>
  );
};

