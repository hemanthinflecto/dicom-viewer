import { useEffect } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

const { Enums: csToolsEnums } = cornerstoneTools;

/**
 * Custom hook to handle viewport mouse and scroll events
 */
export const useViewportEvents = (viewportRef, getViewport, onSliceChange) => {
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    // Handle mouse wheel for slice scrolling
    const handleWheel = (event) => {
      const viewport = getViewport();
      if (!viewport) return;

      // Prevent default scrolling behavior
      event.preventDefault();
      
      // Get current index
      const currentIndex = viewport.getCurrentImageIdIndex();
      const imageIds = viewport.getImageIds();
      
      if (!imageIds || imageIds.length === 0) return;

      // Determine scroll direction
      const direction = event.deltaY > 0 ? 1 : -1;
      const newIndex = currentIndex + direction;

      // Clamp index to valid range
      if (newIndex >= 0 && newIndex < imageIds.length) {
        // Jump to next/previous image
        viewport.setImageIdIndex(newIndex);
        viewport.render();
        
        // Notify parent of slice change
        if (onSliceChange) {
          onSliceChange(newIndex);
        }
      }
    };

    // Handle mouse move for pan tool feedback
    const handleMouseMove = (event) => {
      const viewport = getViewport();
      if (!viewport) return;
      
      // This ensures pan tool works smoothly
      // Cornerstone handles the actual panning, we just ensure viewport is active
      if (element === event.target || element.contains(event.target)) {
        // Viewport is active
      }
    };

    // Handle stack new image event (when image changes)
    const handleStackNewImage = (event) => {
      const viewport = getViewport();
      if (!viewport || !onSliceChange) return;
      
      const currentIndex = viewport.getCurrentImageIdIndex();
      onSliceChange(currentIndex);
    };

    // Add event listeners
    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('contextmenu', handleContextMenu);
    
    // Listen for Cornerstone stack change events
    if (cornerstone && cornerstone.Enums && cornerstone.Enums.Events) {
      element.addEventListener(cornerstone.Enums.Events.STACK_NEW_IMAGE, handleStackNewImage);
    }

    // Cleanup
    return () => {
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('contextmenu', handleContextMenu);
      if (cornerstone && cornerstone.Enums && cornerstone.Enums.Events) {
        element.removeEventListener(cornerstone.Enums.Events.STACK_NEW_IMAGE, handleStackNewImage);
      }
    };
  }, [viewportRef, getViewport, onSliceChange]);
};

