import React from 'react';

const ToolButton = ({ active, onClick, children, title, shortcut = null }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors relative group ${
      active
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
    }`}
  >
    {children}
  </button>
);

export const Toolbar = ({ activeTool, onToolChange, onResetView }) => {
  const tools = [
    { id: 'Pan', label: 'Pan', icon: '✋', shortcut: 'Left-click & drag' },
    { id: 'Zoom', label: 'Zoom', icon: '🔍', shortcut: 'Left-drag ↑/↓' },
    { id: 'WindowLevel', label: 'W/L', icon: '☀️', shortcut: 'Right-click & drag' },
    { id: 'Length', label: 'Length', icon: '📏', shortcut: 'Left-click start/end' },
    { id: 'RectangleROI', label: 'Rectangle', icon: '◻️', shortcut: 'Left-click & drag' },
    { id: 'EllipticalROI', label: 'Ellipse', icon: '⭕', shortcut: 'Left-click & drag' },
    { id: 'Angle', label: 'Angle', icon: '📐', shortcut: 'Left-click 3 points' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1">
      <div className="flex items-center space-x-1 bg-slate-700/50 rounded-lg p-1">
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            active={activeTool === tool.id}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            shortcut={tool.shortcut}
          >
            <span>{tool.icon}</span>
          </ToolButton>
        ))}
      </div>

      <button
        onClick={onResetView}
        className="px-2 py-0.5 rounded text-xs font-medium bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors"
        title="Reset View"
      >
        🔄
      </button>
    </div>
  );
};

