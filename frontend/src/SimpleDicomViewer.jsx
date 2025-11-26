import { useState, useEffect, useRef } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
import Hammer from 'hammerjs';
import dicomParser from 'dicom-parser';

// Simple DICOM Viewer using Cornerstone Legacy (v2)
function SimpleDicomViewer() {
  const [files, setFiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const viewportRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Cornerstone
  useEffect(() => {
    try {
      // Initialize web image loader
      cornerstoneWebImageLoader.external.cornerstone = cornerstone;

      // Initialize cornerstone tools
      cornerstoneTools.external.cornerstone = cornerstone;
      cornerstoneTools.external.Hammer = Hammer;
      cornerstoneTools.init();

      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError('Failed to initialize DICOM viewer');
    }
  }, []);

  // Enable viewport
  useEffect(() => {
    if (!isInitialized || !viewportRef.current) return;

    try {
      cornerstone.enable(viewportRef.current);

      // Add tools
      const WwwcTool = cornerstoneTools.WwwcTool;
      const PanTool = cornerstoneTools.PanTool;
      const ZoomTool = cornerstoneTools.ZoomTool;
      const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;

      cornerstoneTools.addTool(WwwcTool);
      cornerstoneTools.addTool(PanTool);
      cornerstoneTools.addTool(ZoomTool);
      cornerstoneTools.addTool(StackScrollMouseWheelTool);

      // Set active tools
      cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 });
      cornerstoneTools.setToolActive('StackScrollMouseWheel', {});
    } catch (err) {
      console.error('Failed to enable viewport:', err);
    }

    return () => {
      if (viewportRef.current) {
        try {
          cornerstone.disable(viewportRef.current);
        } catch (err) {
          console.error('Error disabling viewport:', err);
        }
      }
    };
  }, [isInitialized]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (uploadedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create image IDs from files
      const imageIds = uploadedFiles.map((file, index) => {
        return `wadouri:${URL.createObjectURL(file)}#${index}`;
      });

      setFiles(imageIds);
      setCurrentIndex(0);

      // Load first image
      if (imageIds.length > 0) {
        await loadImage(imageIds[0]);
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load DICOM files');
    } finally {
      setIsLoading(false);
    }
  };

  // Load image
  const loadImage = async (imageId) => {
    if (!viewportRef.current) return;

    try {
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(viewportRef.current, image);
    } catch (err) {
      console.error('Error displaying image:', err);
      setError('Failed to display image');
    }
  };

  // Navigate images
  const nextImage = () => {
    if (currentIndex < files.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      loadImage(files[newIndex]);
    }
  };

  const previousImage = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      loadImage(files[newIndex]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (files.length === 0) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        previousImage();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [files, currentIndex]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">
          🏥 Simple DICOM Viewer
        </h1>

        {error && (
          <div className="bg-red-950/50 border border-red-700 text-red-100 rounded-lg px-4 py-3 mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* File Upload */}
        <div className="bg-slate-900 rounded-lg p-6 mb-6">
          <label className="block">
            <span className="text-sm font-medium mb-2 block">Upload DICOM Files</span>
            <input
              type="file"
              accept=".dcm,image/*"
              multiple
              onChange={handleFileUpload}
              disabled={isLoading}
              className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                disabled:opacity-50"
            />
          </label>
        </div>

        {/* Viewer */}
        <div className="bg-slate-900 rounded-lg p-4">
          {files.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Image {currentIndex + 1} of {files.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={previousImage}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-sm font-medium transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={nextImage}
                  disabled={currentIndex === files.length - 1}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-sm font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          <div
            ref={viewportRef}
            className="bg-black rounded-lg"
            style={{ width: '100%', height: '600px' }}
          >
            {files.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Upload DICOM files to begin</p>
                  <p className="text-xs mt-2">Use arrow keys to navigate • Left click + drag for window/level</p>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white">Loading...</p>
                </div>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <input
                type="range"
                min="0"
                max={files.length - 1}
                value={currentIndex}
                onChange={(e) => {
                  const newIndex = parseInt(e.target.value);
                  setCurrentIndex(newIndex);
                  loadImage(files[newIndex]);
                }}
                className="w-full accent-blue-600"
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-slate-900 rounded-lg p-4 text-sm text-slate-400">
          <h3 className="font-semibold text-white mb-2">Controls:</h3>
          <ul className="space-y-1">
            <li>• Left Mouse Button: Adjust Window/Level</li>
            <li>• Middle Mouse Button: Pan</li>
            <li>• Right Mouse Button: Zoom</li>
            <li>• Mouse Wheel: Scroll through slices</li>
            <li>• Arrow Keys: Navigate images</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SimpleDicomViewer;
