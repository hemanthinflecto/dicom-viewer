/**
 * Calculate distance between two points in 2D space with pixel spacing
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @param {number[]} spacing - Pixel spacing [row, column] in mm
 * @returns {number} Distance in mm
 */
export const calculateDistance = (point1, point2, spacing = [1, 1]) => {
  const dx = (point2.x - point1.x) * spacing[0];
  const dy = (point2.y - point1.y) * spacing[1];
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate area of a rectangle
 * @param {Object[]} points - Array of corner points
 * @param {number[]} spacing - Pixel spacing [row, column] in mm
 * @returns {number} Area in mm²
 */
export const calculateRectangleArea = (points, spacing = [1, 1]) => {
  if (!points || points.length < 4) return 0;
  
  const width = Math.abs(points[2].x - points[0].x) * spacing[0];
  const height = Math.abs(points[2].y - points[0].y) * spacing[1];
  return width * height;
};

/**
 * Calculate area of an ellipse
 * @param {Object} handles - Ellipse handles with major and minor axes
 * @param {number[]} spacing - Pixel spacing [row, column] in mm
 * @returns {number} Area in mm²
 */
export const calculateEllipseArea = (handles, spacing = [1, 1]) => {
  if (!handles || !handles.points || handles.points.length < 4) return 0;
  
  const { points } = handles;
  const width = Math.abs(points[2].x - points[0].x) * spacing[0];
  const height = Math.abs(points[2].y - points[0].y) * spacing[1];
  
  // Area = π * a * b (where a and b are semi-major and semi-minor axes)
  return Math.PI * (width / 2) * (height / 2);
};

/**
 * Calculate volume from area and slice thickness
 * @param {number} area - Area in mm²
 * @param {number} sliceThickness - Slice thickness in mm
 * @returns {number} Volume in mm³
 */
export const calculateVolume = (area, sliceThickness = 1) => {
  return area * sliceThickness;
};

/**
 * Calculate angle between three points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} vertex - Vertex point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Angle in degrees
 */
export const calculateAngle = (point1, vertex, point2) => {
  const v1 = { x: point1.x - vertex.x, y: point1.y - vertex.y };
  const v2 = { x: point2.x - vertex.x, y: point2.y - vertex.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  const cosAngle = dot / (mag1 * mag2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  
  return (angleRad * 180) / Math.PI;
};

/**
 * Format measurement value for display
 * @param {number} value - Measurement value
 * @param {string} unit - Unit of measurement
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
export const formatMeasurement = (value, unit, decimals = 2) => {
  return `${value.toFixed(decimals)} ${unit}`;
};

/**
 * Get measurement statistics from annotation
 * @param {Object} annotation - Cornerstone annotation object
 * @param {Object} image - Cornerstone image object
 * @returns {Object} Statistics object
 */
export const getMeasurementStats = (annotation, image) => {
  const stats = {
    mean: null,
    stdDev: null,
    min: null,
    max: null,
    area: null,
    length: null,
  };
  
  if (annotation.data?.stats) {
    stats.mean = annotation.data.stats.mean;
    stats.stdDev = annotation.data.stats.stdDev;
    stats.min = annotation.data.stats.min;
    stats.max = annotation.data.stats.max;
    stats.area = annotation.data.stats.area;
  }
  
  if (annotation.data?.handles && image?.spacing) {
    const { handles } = annotation.data;
    const spacing = [image.spacing[0], image.spacing[1]];
    
    // Calculate based on tool type
    if (handles.start && handles.end) {
      // Length tool
      stats.length = calculateDistance(handles.start, handles.end, spacing);
    } else if (handles.points && handles.points.length >= 4) {
      // Rectangle/Ellipse tool
      stats.area = calculateRectangleArea(handles.points, spacing);
    }
  }
  
  return stats;
};

