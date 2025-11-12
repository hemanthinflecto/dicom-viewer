import React from 'react';
import { WINDOW_LEVEL_PRESETS } from '../utils/dicomUtils';

export const WindowLevelControls = ({
  windowWidth,
  windowCenter,
  onWindowLevelChange,
  onPresetChange,
}) => {
  const presets = Object.values(WINDOW_LEVEL_PRESETS.CT);

  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-700/50 rounded-lg p-2">
      {/* Manual Controls */}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-slate-300">Width:</label>
        <input
          type="number"
          value={windowWidth}
          onChange={(e) => onWindowLevelChange(parseFloat(e.target.value) || 400, windowCenter)}
          className="w-20 px-2 py-1 bg-slate-600 text-white rounded text-sm"
          min="1"
          max="4000"
        />
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm text-slate-300">Center:</label>
        <input
          type="number"
          value={windowCenter}
          onChange={(e) => onWindowLevelChange(windowWidth, parseFloat(e.target.value) || 50)}
          className="w-20 px-2 py-1 bg-slate-600 text-white rounded text-sm"
          min="-1000"
          max="1000"
        />
      </div>

      {/* Preset Selector */}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-slate-300">Preset:</label>
        <select
          onChange={(e) => {
            const preset = presets.find((p) => p.label === e.target.value);
            if (preset) {
              onPresetChange(preset.width, preset.center);
            }
          }}
          className="px-2 py-1 bg-slate-600 text-white rounded text-sm"
        >
          <option value="">Select preset...</option>
          {presets.map((preset) => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

