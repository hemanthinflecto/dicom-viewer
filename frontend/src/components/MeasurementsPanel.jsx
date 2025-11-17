import React from 'react';

export const MeasurementsPanel = ({
  measurements,
  onClear,
  onRemove,
  onExport,
  currentSlice = null,
  totalSlices = null,
}) => {
  if (measurements.length === 0) return null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">📏 Measurements ({measurements.length})</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={onExport}
            className="text-blue-400 hover:text-blue-300 text-xs"
            title="Export"
          >
            📥
          </button>
          <button
            onClick={onClear}
            className="text-red-400 hover:text-red-300 text-xs"
            title="Clear All"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {measurements.map((measurement, idx) => (
          <div
            key={measurement.id || idx}
            className="bg-slate-800/50 rounded p-2 text-xs relative group border-l-2 border-blue-500"
          >
            <button
              onClick={() => onRemove(measurement.id)}
              className="absolute top-1 right-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              title="Remove"
            >
              ✕
            </button>

            <div className="text-white font-medium text-xs">{measurement.type}</div>
            
            {typeof measurement.sliceIndex === 'number' && (
              <div className="text-slate-500 text-xs">
                S{measurement.sliceIndex + 1}
              </div>
            )}

            {measurement.type === 'Length' && (
              <div className="text-slate-300 text-xs">{measurement.formatted}</div>
            )}

            {(measurement.type === 'Rectangle Area' || measurement.type === 'Ellipse Area') && (
              <div className="space-y-0.5 text-xs">
                <div className="text-slate-300">A: {measurement.formatted}</div>
                {measurement.volumeFormatted && (
                  <div className="text-blue-300">V: {measurement.volumeFormatted}</div>
                )}
              </div>
            )}

            {measurement.type === 'Angle' && (
              <div className="text-slate-300 text-xs">{measurement.formatted}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

