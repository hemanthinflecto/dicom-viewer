import JSZip from 'jszip';

/**
 * Extract DICOM files from a ZIP archive
 * @param {File} file - ZIP file to extract
 * @returns {Promise<File[]>} Array of DICOM files
 */
export const extractZipFile = async (file) => {
  try {
    const zip = await JSZip.loadAsync(file);
    const files = [];
    
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir && (filename.toLowerCase().endsWith('.dcm') || filename.toLowerCase().endsWith('.dicom'))) {
        const arrayBuffer = await zipEntry.async('arraybuffer');
        const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
        const fileObj = new File([blob], filename, { type: 'application/dicom' });
        files.push(fileObj);
      }
    }
    
    return files;
  } catch (err) {
    console.error('Error extracting ZIP:', err);
    throw new Error('Failed to extract ZIP file');
  }
};

/**
 * Sort DICOM files by instance number or filename
 * @param {File[]} files - Array of DICOM files
 * @returns {File[]} Sorted array of files
 */
export const sortDicomFiles = (files) => {
  return files.sort((a, b) => {
    // Try to extract numbers from filenames for natural sorting
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
    
    if (numA !== numB) {
      return numA - numB;
    }
    
    // Fallback to alphabetical sorting
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get slice thickness from DICOM image metadata
 * @param {Object} image - Cornerstone image object
 * @returns {number} Slice thickness in mm
 */
export const getSliceThickness = (image) => {
  if (!image) return 1;
  
  return image.metadata?.SliceThickness || 
         image.metadata?.['00180050']?.value || 
         image.spacing?.[2] || 
         1;
};

/**
 * Get pixel spacing from DICOM image
 * @param {Object} image - Cornerstone image object
 * @returns {number[]} [rowSpacing, columnSpacing] in mm
 */
export const getPixelSpacing = (image) => {
  if (!image || !image.spacing) {
    return [1, 1];
  }
  
  return [image.spacing[0], image.spacing[1]];
};

/**
 * Validate if file is a valid DICOM file type
 * @param {File} file - File to validate
 * @returns {boolean} True if valid DICOM or ZIP
 */
export const isValidDicomFile = (file) => {
  const name = file.name.toLowerCase();
  return name.endsWith('.dcm') || 
         name.endsWith('.dicom') || 
         name.endsWith('.zip');
};

/**
 * Window/Level presets for different tissue types
 */
export const WINDOW_LEVEL_PRESETS = {
  CT: {
    ABDOMEN: { width: 400, center: 50, label: 'Abdomen' },
    BONE: { width: 2000, center: 300, label: 'Bone' },
    BRAIN: { width: 80, center: 40, label: 'Brain' },
    LUNG: { width: 1500, center: -600, label: 'Lung' },
    MEDIASTINUM: { width: 350, center: 50, label: 'Mediastinum' },
    SOFT_TISSUE: { width: 400, center: 40, label: 'Soft Tissue' },
  },
  DEFAULT: { width: 400, center: 50, label: 'Default' },
};

/**
 * Get appropriate window/level preset based on image type
 * @param {string} modality - DICOM modality (CT, MR, etc.)
 * @returns {Object} Window/level preset
 */
export const getDefaultWindowLevel = (modality = 'CT') => {
  if (modality === 'CT') {
    return WINDOW_LEVEL_PRESETS.CT.ABDOMEN;
  }
  return WINDOW_LEVEL_PRESETS.DEFAULT;
};

