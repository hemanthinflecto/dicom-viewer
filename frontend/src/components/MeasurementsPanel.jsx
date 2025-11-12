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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Measurements ({measurements.length})
          </h2>
          {currentSlice !== null && totalSlices !== null && (
            <p className="text-xs text-slate-400 mt-1">
              Current Slice: {currentSlice + 1} / {totalSlices}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onExport}
            className="text-blue-400 hover:text-blue-300 text-sm"
            title="Export Measurements"
          >
            📥 Export
          </button>
          <button
            onClick={onClear}
            className="text-red-400 hover:text-red-300 text-sm"
            title="Clear All Measurements"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {measurements.map((measurement, idx) => (
          <div
            key={measurement.id || idx}
            className="bg-slate-700/50 rounded p-3 text-sm relative group border-l-2 border-blue-500"
          >
            <button
              onClick={() => onRemove(measurement.id)}
              className="absolute top-2 right-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove measurement"
            >
              ✕
            </button>

            <div className="text-white font-medium mb-1">{measurement.type}</div>

            {typeof measurement.sliceIndex === 'number' && (
              <div className="text-slate-400 text-xs mb-1">
                Slice: {measurement.sliceIndex + 1}
                {typeof totalSlices === 'number' && totalSlices > 0 ? ` / ${totalSlices}` : ''}
              </div>
            )}

            {/* Length measurement */}
            {measurement.type === 'Length' && (
              <div className="text-slate-300">{measurement.formatted}</div>
            )}

            {/* Area measurements */}
            {(measurement.type === 'Rectangle Area' || measurement.type === 'Ellipse Area') && (
              <div className="space-y-1">
                <div className="text-slate-300">Area: {measurement.formatted}</div>
                {measurement.volumeFormatted && (
                  <div className="text-blue-300">
                    Volume: {measurement.volumeFormatted}
                  </div>
                )}
                {measurement.mean !== null && measurement.mean !== undefined && (
                  <div className="text-slate-400 text-xs mt-2 space-y-0.5">
                    <div>Mean: {measurement.mean.toFixed(2)}</div>
                    {measurement.stdDev !== null && (
                      <div>Std Dev: {measurement.stdDev.toFixed(2)}</div>
                    )}
                    {measurement.min !== null && measurement.max !== null && (
                      <div>
                        Range: {measurement.min.toFixed(2)} - {measurement.max.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Angle measurement */}
            {measurement.type === 'Angle' && (
              <div className="text-slate-300">{measurement.formatted}</div>
            )}

            <div className="text-xs text-slate-500 mt-2">
              {new Date(measurement.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

