import { useEffect, useState } from 'react';
import * as cornerstoneTools from '@cornerstonejs/tools';

const {
  PanTool,
  ZoomTool,
  WindowLevelTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  AngleTool,
  StackScrollMouseWheelTool,
  StackScrollTool,
  ToolGroupManager,
  Enums: csToolsEnums,
} = cornerstoneTools;

const { MouseBindings } = csToolsEnums;

const TOOL_DEFINITIONS = [
  { id: 'Pan', ToolClass: PanTool, bindings: [{ mouseButton: MouseBindings.Primary }] },
  { id: 'Zoom', ToolClass: ZoomTool, bindings: [{ mouseButton: MouseBindings.Primary }] },
  { id: 'WindowLevel', ToolClass: WindowLevelTool, bindings: [{ mouseButton: MouseBindings.Secondary }] },
  { id: 'Length', ToolClass: LengthTool, bindings: [{ mouseButton: MouseBindings.Primary }] },
  { id: 'RectangleROI', ToolClass: RectangleROITool, bindings: [{ mouseButton: MouseBindings.Primary }] },
  { id: 'EllipticalROI', ToolClass: EllipticalROITool, bindings: [{ mouseButton: MouseBindings.Primary }] },
  { id: 'Angle', ToolClass: AngleTool, bindings: [{ mouseButton: MouseBindings.Primary }] },
];

const registerToolOnce = (ToolClass) => {
  if (!ToolClass?.toolName) {
    console.warn('[useToolManager] Tried to register an invalid tool:', ToolClass);
    return;
  }

  try {
    cornerstoneTools.addTool(ToolClass);
  } catch (error) {
    const message = error?.message || '';
    if (!message.includes('Tool with same name')) {
      console.warn(`[useToolManager] Failed to register tool ${ToolClass.toolName}:`, error);
    }
  }
};

const ensureToolInGroup = (toolGroup, toolName) => {
  if (!toolGroup) return;

  try {
    toolGroup.addTool(toolName);
  } catch (error) {
    const message = error?.message || '';
    if (!message.includes('already been added')) {
      console.warn(`[useToolManager] Unable to add tool ${toolName} to tool group:`, error);
    }
  }
};

const applyToolBindings = (toolGroup, toolId) => {
  if (!toolGroup) return;

  // Keep mouse wheel stack scrolling enabled
  try {
    toolGroup.addTool(StackScrollMouseWheelTool.toolName);
  } catch (error) {
    const message = error?.message || '';
    if (!message.includes('already been added')) {
      console.warn('[useToolManager] Unable to add stack scroll mouse wheel tool:', error);
    }
  }

  toolGroup.setToolEnabled(StackScrollMouseWheelTool.toolName);

  // Deactivate all interactive tools first
  TOOL_DEFINITIONS.forEach(({ ToolClass }) => {
    try {
      toolGroup.setToolPassive(ToolClass.toolName);
    } catch {
      // noop
    }
  });

  // Determine requested tool configuration
  const toolConfig = TOOL_DEFINITIONS.find((tool) => tool.id === toolId) ?? TOOL_DEFINITIONS[0];

  try {
    toolGroup.setToolActive(toolConfig.ToolClass.toolName, {
      bindings: toolConfig.bindings,
    });
  } catch (error) {
    console.error(`[useToolManager] Failed to activate tool ${toolConfig.ToolClass.toolName}:`, error);
  }
};

export const useToolManager = (toolGroupId = 'myToolGroup') => {
  const [activeTool, setActiveTool] = useState('Pan');
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeTools = () => {
    try {
      TOOL_DEFINITIONS.forEach(({ ToolClass }) => registerToolOnce(ToolClass));
      registerToolOnce(StackScrollMouseWheelTool);
      registerToolOnce(StackScrollTool);

      const existingGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (existingGroup) {
        ToolGroupManager.destroyToolGroup(toolGroupId);
      }

      ToolGroupManager.createToolGroup(toolGroupId);
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

      TOOL_DEFINITIONS.forEach(({ ToolClass }) => ensureToolInGroup(toolGroup, ToolClass.toolName));
      ensureToolInGroup(toolGroup, StackScrollMouseWheelTool.toolName);
      ensureToolInGroup(toolGroup, StackScrollTool.toolName);

      applyToolBindings(toolGroup, activeTool);
      setIsInitialized(true);
      return toolGroup;
    } catch (error) {
      console.error('[useToolManager] Error initializing tools:', error);
      throw error;
    }
  };

  const addViewport = (viewportId, renderingEngineId) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) return;

    try {
      toolGroup.addViewport(viewportId, renderingEngineId);
    } catch (error) {
      const message = error?.message || '';
      if (!message.includes('already exists')) {
        console.warn(`[useToolManager] Failed to add viewport ${viewportId} to tool group:`, error);
      }
    }

    applyToolBindings(toolGroup, activeTool);
  };

  const setTool = (toolId) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) return;

    applyToolBindings(toolGroup, toolId);
    setActiveTool(toolId);
  };

  const getToolGroup = () => ToolGroupManager.getToolGroup(toolGroupId);

  useEffect(() => {
    return () => {
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (toolGroup) {
        try {
          ToolGroupManager.destroyToolGroup(toolGroupId);
        } catch (error) {
          console.warn('[useToolManager] Failed to destroy tool group on cleanup:', error);
        }
      }
    };
  }, [toolGroupId]);

  return {
    activeTool,
    isInitialized,
    toolGroupId,
    initializeTools,
    addViewport,
    setTool,
    getToolGroup,
  };
};

