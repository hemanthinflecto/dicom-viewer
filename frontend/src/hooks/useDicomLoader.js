import { useState } from 'react';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { extractZipFile, sortDicomFiles, isValidDicomFile } from '../utils/dicomUtils';

/**
 * Custom hook to handle DICOM file loading
 */
export const useDicomLoader = () => {
  const [dicomFiles, setDicomFiles] = useState([]);
  const [imageIds, setImageIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  /**
   * Load files from input
   */
  const loadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    
    if (!isValidDicomFile(file)) {
      setError('Please upload a valid DICOM file (.dcm, .dicom) or ZIP archive');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let files = [];
      
      if (file.name.toLowerCase().endsWith('.zip')) {
        files = await extractZipFile(file);
        if (files.length === 0) {
          throw new Error('No DICOM files found in ZIP archive');
        }
      } else {
        files = [file];
      }

      // Sort files for consistent ordering
      const sortedFiles = sortDicomFiles(files);
      setDicomFiles(sortedFiles);

      // Create image IDs for all DICOM files
      const newImageIds = sortedFiles.map((file) => {
        return cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
      });

      setImageIds(newImageIds);
      setCurrentImageIndex(0);
      
      return { files: sortedFiles, imageIds: newImageIds };
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err.message || 'Failed to load DICOM files');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate to specific image index
   */
  const goToImage = (index) => {
    if (index >= 0 && index < imageIds.length) {
      setCurrentImageIndex(index);
    }
  };

  /**
   * Navigate to next image
   */
  const nextImage = () => {
    if (currentImageIndex < imageIds.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  /**
   * Navigate to previous image
   */
  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  /**
   * Clear all loaded files
   */
  const clearFiles = () => {
    setDicomFiles([]);
    setImageIds([]);
    setCurrentImageIndex(0);
    setError(null);
  };

  return {
    dicomFiles,
    imageIds,
    isLoading,
    error,
    currentImageIndex,
    loadFiles,
    goToImage,
    nextImage,
    previousImage,
    clearFiles,
    setCurrentImageIndex,
  };
};

