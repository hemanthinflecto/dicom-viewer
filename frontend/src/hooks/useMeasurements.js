import { useState, useEffect } from 'react';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { getMeasurementStats, calculateVolume } from '../utils/measurementUtils';
import { getSliceThickness } from '../utils/dicomUtils';

const { Enums: csToolsEnums, annotation } = cornerstoneTools;

/**
 * Custom hook to manage measurements
 */
export const useMeasurements = (
  viewportElement,
  getCurrentImage,
  toolGroupId,
  getCurrentImageIndex
) => {
  const [measurements, setMeasurements] = useState([]);

  useEffect(() => {
    if (!viewportElement) return;

    const handleAnnotationAdded = (evt) => {
      const { annotation: newAnnotation } = evt.detail;
      const image = getCurrentImage();
      const sliceIndex =
        typeof getCurrentImageIndex === 'function'
          ? getCurrentImageIndex()
          : null;

      if (!image) return;

      const stats = getMeasurementStats(newAnnotation, image);
      const sliceThickness = getSliceThickness(image);

      let measurement = {
        id: newAnnotation.annotationUID,
        toolName: newAnnotation.metadata.toolName,
        timestamp: new Date().toISOString(),
        sliceIndex,
      };

      // Add specific data based on tool type
      if (newAnnotation.metadata.toolName === 'Length') {
        measurement = {
          ...measurement,
          type: 'Length',
          value: stats.length,
          unit: 'mm',
          formatted: `${stats.length?.toFixed(2) || 0} mm`,
        };
      } else if (
        newAnnotation.metadata.toolName === 'RectangleROI' ||
        newAnnotation.metadata.toolName === 'EllipticalROI'
      ) {
        const area = stats.area || 0;
        const volume = calculateVolume(area, sliceThickness);

        measurement = {
          ...measurement,
          type: newAnnotation.metadata.toolName === 'RectangleROI' ? 'Rectangle Area' : 'Ellipse Area',
          area: area,
          areaUnit: 'mm²',
          volume: volume,
          volumeUnit: 'mm³',
          mean: stats.mean,
          stdDev: stats.stdDev,
          min: stats.min,
          max: stats.max,
          formatted: `${area.toFixed(2)} mm²`,
          volumeFormatted: `${volume.toFixed(2)} mm³`,
        };
      } else if (newAnnotation.metadata.toolName === 'Angle') {
        // Angle tool - extract angle from annotation data
        const angle = newAnnotation.data?.handles?.angle || 0;
        measurement = {
          ...measurement,
          type: 'Angle',
          value: angle,
          unit: '°',
          formatted: `${angle.toFixed(1)}°`,
        };
      }

      setMeasurements((prev) => [...prev, measurement]);
    };

    const handleAnnotationRemoved = (evt) => {
      const { annotationUID } = evt.detail;
      setMeasurements((prev) => prev.filter((m) => m.id !== annotationUID));
    };

    viewportElement.addEventListener(csToolsEnums.Events.ANNOTATION_ADDED, handleAnnotationAdded);
    viewportElement.addEventListener(csToolsEnums.Events.ANNOTATION_REMOVED, handleAnnotationRemoved);

    return () => {
      viewportElement.removeEventListener(csToolsEnums.Events.ANNOTATION_ADDED, handleAnnotationAdded);
      viewportElement.removeEventListener(csToolsEnums.Events.ANNOTATION_REMOVED, handleAnnotationRemoved);
    };
  }, [viewportElement, getCurrentImage, getCurrentImageIndex]);

  /**
   * Clear all measurements
   */
  const clearMeasurements = (viewportId, renderViewport) => {
    if (!toolGroupId) return;

    const annotations = annotation.state.getAnnotations(viewportId, toolGroupId);
    if (annotations && annotations.length > 0) {
      annotations.forEach((ann) => {
        annotation.state.removeAnnotation(ann.annotationUID);
      });
    }

    if (renderViewport) {
      renderViewport();
    }

    setMeasurements([]);
  };

  /**
   * Remove specific measurement
   */
  const removeMeasurement = (measurementId, viewportId, renderViewport) => {
    annotation.state.removeAnnotation(measurementId);
    
    if (renderViewport) {
      renderViewport();
    }

    setMeasurements((prev) => prev.filter((m) => m.id !== measurementId));
  };

  /**
   * Export measurements as JSON
   */
  const exportMeasurements = () => {
    const data = JSON.stringify(measurements, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    measurements,
    clearMeasurements,
    removeMeasurement,
    exportMeasurements,
  };
};

