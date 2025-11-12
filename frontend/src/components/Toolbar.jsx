import React from 'react';

const ToolButton = ({ active, onClick, children, title, shortcut = null }) => (
  <button
    onClick={onClick}
    title={`${title}${shortcut ? ` (${shortcut})` : ''}`}
    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors relative group ${
      active
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
    }`}
  >
    {children}
    {shortcut && (
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-slate-200 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {shortcut}
      </span>
    )}
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
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center space-x-2 bg-slate-700/50 rounded-lg p-2">
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            active={activeTool === tool.id}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            shortcut={tool.shortcut}
          >
            <span className="mr-1">{tool.icon}</span>
            {tool.label}
          </ToolButton>
        ))}
      </div>

      <button
        onClick={onResetView}
        className="px-3 py-1.5 rounded text-sm font-medium bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors"
        title="Reset View"
      >
        🔄 Reset
      </button>
    </div>
  );
};

