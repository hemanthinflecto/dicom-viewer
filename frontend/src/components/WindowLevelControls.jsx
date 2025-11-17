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
    <div className="flex flex-wrap items-center gap-2 bg-slate-700/50 rounded-lg p-1.5">
      {/* Manual Controls */}
      <div className="flex items-center space-x-1">
        <label className="text-xs text-slate-300">W:</label>
        <input
          type="number"
          value={windowWidth}
          onChange={(e) => onWindowLevelChange(parseFloat(e.target.value) || 400, windowCenter)}
          className="w-14 px-1.5 py-0.5 bg-slate-600 text-white rounded text-xs"
          min="1"
          max="4000"
        />
      </div>
      <div className="flex items-center space-x-1">
        <label className="text-xs text-slate-300">C:</label>
        <input
          type="number"
          value={windowCenter}
          onChange={(e) => onWindowLevelChange(windowWidth, parseFloat(e.target.value) || 50)}
          className="w-14 px-1.5 py-0.5 bg-slate-600 text-white rounded text-xs"
          min="-1000"
          max="1000"
        />
      </div>

      {/* Preset Selector */}
      <select
        onChange={(e) => {
          const preset = presets.find((p) => p.label === e.target.value);
          if (preset) {
            onPresetChange(preset.width, preset.center);
          }
        }}
        className="px-1.5 py-0.5 bg-slate-600 text-white rounded text-xs"
      >
        <option value="">Presets</option>
        {presets.map((preset) => (
          <option key={preset.label} value={preset.label}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
};

