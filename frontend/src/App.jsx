import { useState, useEffect } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

// Hooks
import { useCornerstoneViewport } from './hooks/useCornerstoneViewport';
import { useDicomLoader } from './hooks/useDicomLoader';
import { useToolManager } from './hooks/useToolManager';
import { useMeasurements } from './hooks/useMeasurements';
import { useViewportEvents } from './hooks/useViewportEvents';

// Components
import { Toolbar } from './components/Toolbar';
import { WindowLevelControls } from './components/WindowLevelControls';
import { ImageFilters } from './components/ImageFilters';
import { SliceNavigator } from './components/SliceNavigator';
import { MeasurementsPanel } from './components/MeasurementsPanel';
import { FileUploader } from './components/FileUploader';

function App() {
  const [windowWidth, setWindowWidth] = useState(400);
  const [windowCenter, setWindowCenter] = useState(50);
  const [isInverted, setIsInverted] = useState(false);
  const [error, setError] = useState(null);

  // Custom hooks
  const viewport = useCornerstoneViewport('CT_VIEWPORT');
  const dicomLoader = useDicomLoader();
  const toolManager = useToolManager('myToolGroup');
  const measurements = useMeasurements(
    viewport.viewportRef.current,
    viewport.getCurrentImage,
    toolManager.toolGroupId,
    viewport.getCurrentImageIndex
  );

  // Setup viewport events (pan, scroll, etc.) with slice change callback
  const handleSliceChangeFromViewport = (newIndex) => {
    if (dicomLoader.currentImageIndex !== newIndex) {
      dicomLoader.setCurrentImageIndex(newIndex);
    }
  };

  useViewportEvents(viewport.viewportRef, viewport.getViewport, handleSliceChangeFromViewport);

  // Initialize Cornerstone and tools
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Cornerstone
        await cornerstone.init();

        // Configure DICOM Image Loader
        cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
        cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;

        cornerstoneDICOMImageLoader.configure({
          useWebWorkers: true,
          decodeConfig: {
            convertFloatPixelDataToInt: false,
          },
        });

        // Initialize Cornerstone Tools
        cornerstoneTools.init();

        // Initialize tool group
        toolManager.initializeTools();

        // Initialize viewport
        await viewport.initializeViewport();
      } catch (err) {
        console.error('Error initializing Cornerstone:', err);
        setError('Failed to initialize DICOM viewer');
      }
    };

    initialize();
  }, []);

  // Load images when files are loaded
  useEffect(() => {
    if (dicomLoader.imageIds.length > 0 && viewport.viewportRef.current) {
      loadImages();
    }
  }, [dicomLoader.imageIds, dicomLoader.currentImageIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (dicomLoader.imageIds.length === 0) return;

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        dicomLoader.previousImage();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        dicomLoader.nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dicomLoader.currentImageIndex, dicomLoader.imageIds.length]);

  // Load images into viewport
  const loadImages = async () => {
    try {
      await viewport.loadImageStack(dicomLoader.imageIds, dicomLoader.currentImageIndex);

      // Add viewport to tool group FIRST
      toolManager.addViewport(viewport.viewportId, viewport.renderingEngineId);
      
      // Small delay to ensure tools are initialized
      await new Promise(resolve => setTimeout(resolve, 50));

      // Apply window/level
      viewport.setWindowLevel(windowWidth, windowCenter);

      // Apply invert if active
      if (isInverted) {
        viewport.setInvert(true);
      }

      // Render to apply all changes
      viewport.render();
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Failed to load images');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    setError(null);
    try {
      await dicomLoader.loadFiles(event.target.files);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle window/level change
  const handleWindowLevelChange = (width, center) => {
    setWindowWidth(width);
    setWindowCenter(center);
    viewport.setWindowLevel(width, center);
  };

  // Handle invert
  const handleInvert = () => {
    const newInvertState = !isInverted;
    setIsInverted(newInvertState);
    viewport.setInvert(newInvertState);
    viewport.render();
  };

  // Handle sharpen (placeholder)
  const handleSharpen = () => {
    alert('Sharpen filter coming soon!');
  };

  // Handle clear measurements
  const handleClearMeasurements = () => {
    measurements.clearMeasurements(viewport.viewportId, viewport.render);
  };

  // Handle remove measurement
  const handleRemoveMeasurement = (id) => {
    measurements.removeMeasurement(id, viewport.viewportId, viewport.render);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-white">
            🏥 Advanced DICOM Medical Imaging Viewer
          </h1>
          <p className="text-slate-300 mt-1">
            Professional medical image viewer with advanced measurement tools
          </p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Uploader */}
            <FileUploader
              onFileSelect={handleFileUpload}
              isLoading={dicomLoader.isLoading}
              fileCount={dicomLoader.dicomFiles.length}
              currentIndex={dicomLoader.currentImageIndex}
            />

            {/* Slice Navigator */}
            {dicomLoader.imageIds.length > 0 && (
              <SliceNavigator
                currentIndex={dicomLoader.currentImageIndex}
                totalSlices={dicomLoader.imageIds.length}
                onPrevious={dicomLoader.previousImage}
                onNext={dicomLoader.nextImage}
                onSliceChange={dicomLoader.setCurrentImageIndex}
              />
            )}

            {/* Measurements Panel */}
            <MeasurementsPanel
              measurements={measurements.measurements}
              onClear={handleClearMeasurements}
              onRemove={handleRemoveMeasurement}
              onExport={measurements.exportMeasurements}
              currentSlice={dicomLoader.currentImageIndex}
              totalSlices={dicomLoader.imageIds.length}
            />

            {/* Error Display */}
            {(error || dicomLoader.error) && (
              <div className="bg-red-900/50 backdrop-blur-sm rounded-xl p-4 border border-red-700">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-200 text-sm">{error || dicomLoader.error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Main Viewer Area */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              {/* Toolbar */}
              <div className="mb-4 space-y-3">
                <Toolbar
                  activeTool={toolManager.activeTool}
                  onToolChange={toolManager.setTool}
                  onResetView={viewport.resetCamera}
                />

                {/* Window/Level & Filters */}
                {dicomLoader.imageIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <WindowLevelControls
                      windowWidth={windowWidth}
                      windowCenter={windowCenter}
                      onWindowLevelChange={handleWindowLevelChange}
                      onPresetChange={handleWindowLevelChange}
                    />

                    <ImageFilters
                      onInvert={handleInvert}
                      onSharpen={handleSharpen}
                      isInverted={isInverted}
                    />
                  </div>
                )}
              </div>

              {/* Viewport */}
              <div
                className="bg-black rounded-lg overflow-hidden relative"
                style={{ height: '700px' }}
              >
                <div
                  ref={viewport.viewportRef}
                  className="w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                />

                {/* Empty State */}
                {dicomLoader.imageIds.length === 0 && !dicomLoader.isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 text-slate-600 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-slate-400 text-lg font-medium">
                        No DICOM files loaded
                      </p>
                      <p className="text-slate-500 text-sm mt-2">
                        Upload a ZIP file with .dcm files or a single .dcm file to begin
                      </p>
                      <div className="mt-4 text-xs text-slate-600 space-y-1">
                        <p>✨ Professional measurement tools</p>
                        <p>📏 Length, Area, Volume, Angle calculations</p>
                        <p>🎨 Advanced filters and window presets</p>
                        <p>⚡ Fast navigation with keyboard and mouse</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {dicomLoader.isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-white text-lg">Loading DICOM files...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Bar */}
              {dicomLoader.imageIds.length > 0 && (
                <div className="mt-4 flex justify-between items-center text-sm text-slate-400">
                  <div>
                    Active Tool: <span className="text-blue-400">{toolManager.activeTool}</span>
                  </div>
                  <div>
                    W/L: <span className="text-slate-300">{windowWidth}</span> /{' '}
                    <span className="text-slate-300">{windowCenter}</span>
                  </div>
                  <div>
                    Slice: <span className="text-slate-300">{dicomLoader.currentImageIndex + 1}</span>{' '}
                    / <span className="text-slate-300">{dicomLoader.imageIds.length}</span>
                  </div>
                  {measurements.measurements.length > 0 && (
                    <div>
                      Measurements:{' '}
                      <span className="text-green-400">{measurements.measurements.length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
