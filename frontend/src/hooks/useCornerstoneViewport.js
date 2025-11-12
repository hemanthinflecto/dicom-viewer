import { useState, useEffect, useRef } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

const { ToolGroupManager } = cornerstoneTools;

/**
 * Custom hook to manage Cornerstone viewport
 */
export const useCornerstoneViewport = (viewportId = 'CT_VIEWPORT') => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const viewportRef = useRef(null);
  const renderingEngineRef = useRef(null);
  const renderingEngineId = 'myRenderingEngine';

  // Initialize viewport
  const initializeViewport = async () => {
    if (!viewportRef.current) return;

    try {
      if (!renderingEngineRef.current) {
        renderingEngineRef.current = new cornerstone.RenderingEngine(renderingEngineId);
      }

      const renderingEngine = renderingEngineRef.current;

      const viewportInput = {
        viewportId,
        type: cornerstone.Enums.ViewportType.STACK,
        element: viewportRef.current,
      };

      renderingEngine.enableElement(viewportInput);
      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing viewport:', err);
      setError('Failed to initialize viewport');
    }
  };

  // Load image stack
  const loadImageStack = async (imageIds, currentIndex = 0) => {
    if (!renderingEngineRef.current || !viewportRef.current) {
      await initializeViewport();
    }

    try {
      const viewport = renderingEngineRef.current.getViewport(viewportId);
      
      if (!viewport) {
        throw new Error('Viewport not found');
      }

      await viewport.setStack(imageIds, currentIndex);
      
      // Small delay to ensure viewport is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      viewport.render();
      
      return viewport;
    } catch (err) {
      console.error('Error loading image stack:', err);
      setError('Failed to load images');
      throw err;
    }
  };

  // Get current viewport
  const getViewport = () => {
    if (!renderingEngineRef.current) return null;
    return renderingEngineRef.current.getViewport(viewportId);
  };

  // Set viewport properties
  const setViewportProperties = (properties) => {
    const viewport = getViewport();
    if (viewport) {
      viewport.setProperties(properties);
      viewport.render();
    }
  };

  // Reset camera
  const resetCamera = () => {
    const viewport = getViewport();
    if (viewport) {
      viewport.resetCamera();
      viewport.render();
    }
  };

  // Apply window/level
  const setWindowLevel = (windowWidth, windowCenter) => {
    setViewportProperties({
      voiLUT: { windowWidth, windowCenter }
    });
  };

  // Set invert colors
  const setInvert = (invert) => {
    setViewportProperties({ invert });
  };

  // Render viewport
  const render = () => {
    const viewport = getViewport();
    if (viewport) {
      viewport.render();
    }
  };

  // Get current image
  const getCurrentImage = () => {
    const viewport = getViewport();
    if (!viewport) return null;
    
    const imageId = viewport.getCurrentImageId();
    return cornerstone.cache.getImage(imageId);
  };

  // Get current image index
  const getCurrentImageIndex = () => {
    const viewport = getViewport();
    if (!viewport) return 0;
    return viewport.getCurrentImageIdIndex();
  };

  // Get image IDs from viewport
  const getImageIds = () => {
    const viewport = getViewport();
    if (!viewport) return [];
    return viewport.getImageIds ? viewport.getImageIds() : [];
  };

  // Set image index for slice navigation
  const setImageIndex = (index) => {
    const viewport = getViewport();
    if (viewport && viewport.setImageIdIndex) {
      viewport.setImageIdIndex(index);
      viewport.render();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (renderingEngineRef.current) {
        try {
          renderingEngineRef.current.destroy();
        } catch (err) {
          console.error('Error destroying rendering engine:', err);
        }
      }
    };
  }, []);

  return {
    viewportRef,
    renderingEngineRef,
    viewportId,
    renderingEngineId,
    isInitialized,
    error,
    initializeViewport,
    loadImageStack,
    getViewport,
    setViewportProperties,
    setWindowLevel,
    setInvert,
    resetCamera,
    render,
    getCurrentImage,
    getCurrentImageIndex,
    getImageIds,
    setImageIndex,
  };
};

