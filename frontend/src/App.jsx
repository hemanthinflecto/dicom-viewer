import { useState, useEffect, useRef } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneMath from 'cornerstone-math';
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import Hammer from 'hammerjs';
import dicomParser from 'dicom-parser';

// Components
import { Toolbar } from './components/Toolbar';
import { WindowLevelControls } from './components/WindowLevelControls';
import { ImageFilters } from './components/ImageFilters';
import { MeasurementsPanel } from './components/MeasurementsPanel';
import { FileUploader } from './components/FileUploader';

// Utils
import { extractZipFile, sortDicomFiles, isValidDicomFile } from './utils/dicomUtils';

function App() {
  const [windowWidth, setWindowWidth] = useState(400);
  const [windowCenter, setWindowCenter] = useState(50);
  const [isInverted, setIsInverted] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchAnalysisResults, setBatchAnalysisResults] = useState(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchAnalysisError, setBatchAnalysisError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('single');

  const [dicomFiles, setDicomFiles] = useState([]);
  const [imageIds, setImageIds] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState('Pan');
  const [measurements, setMeasurements] = useState([]);

  const viewportRef = useRef(null);
  const isInitialized = useRef(false);

  // Initialize Cornerstone
  useEffect(() => {
    if (isInitialized.current) return;

    try {
      // Initialize web image loader
      cornerstoneWebImageLoader.external.cornerstone = cornerstone;

      // Initialize WADO image loader
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

      cornerstoneWADOImageLoader.configure({
        useWebWorkers: false,
        decodeConfig: {
          convertFloatPixelDataToInt: false,
          use16BitDataType: false
        }
      });

      // Initialize cornerstone tools
      cornerstoneTools.external.cornerstone = cornerstone;
      cornerstoneTools.external.Hammer = Hammer;
      cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

      // Initialize tools with proper configuration
      cornerstoneTools.init({
        mouseEnabled: true,
        touchEnabled: true,
        globalToolSyncEnabled: false,
        showSVGCursors: true
      });

      isInitialized.current = true;
      console.log('✅ Cornerstone initialized successfully');
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError('Failed to initialize DICOM viewer');
    }
  }, []);

  // Enable viewport
  useEffect(() => {
    if (!isInitialized.current || !viewportRef.current) return;

    const element = viewportRef.current;

    try {
      // Make sure element has dimensions before enabling
      element.style.width = '100%';
      element.style.height = '100%';

      // Enable cornerstone on the element
      cornerstone.enable(element);

      // Add tools globally
      const WwwcTool = cornerstoneTools.WwwcTool;
      const PanTool = cornerstoneTools.PanTool;
      const ZoomTool = cornerstoneTools.ZoomTool;
      const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;
      const LengthTool = cornerstoneTools.LengthTool;
      const RectangleRoiTool = cornerstoneTools.RectangleRoiTool;
      const EllipticalRoiTool = cornerstoneTools.EllipticalRoiTool;

      cornerstoneTools.addTool(WwwcTool);
      cornerstoneTools.addTool(PanTool);
      cornerstoneTools.addTool(ZoomTool);
      cornerstoneTools.addTool(StackScrollMouseWheelTool);
      cornerstoneTools.addTool(LengthTool);
      cornerstoneTools.addTool(RectangleRoiTool);
      cornerstoneTools.addTool(EllipticalRoiTool);

      // Activate mouse wheel scroll
      cornerstoneTools.setToolActive('StackScrollMouseWheel', {});

      // Set default tool to Pan on left mouse button
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });

      // Set all other tools to passive initially
      cornerstoneTools.setToolPassive('Wwwc');
      cornerstoneTools.setToolPassive('Zoom');
      cornerstoneTools.setToolPassive('Length');
      cornerstoneTools.setToolPassive('RectangleRoi');
      cornerstoneTools.setToolPassive('EllipticalRoi');

      console.log('✅ Viewport enabled and tools activated');
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
  }, []);

  // Load image when index changes
  useEffect(() => {
    if (imageIds.length > 0 && viewportRef.current && currentImageIndex >= 0 && currentImageIndex < imageIds.length) {
      loadImageAtIndex(currentImageIndex);
    }
  }, [currentImageIndex, imageIds.length]);

  // Listen for stack scroll events
  useEffect(() => {
    if (!viewportRef.current || imageIds.length === 0) return;

    const element = viewportRef.current;

    const handleStackScroll = (evt) => {
      const eventData = evt.detail;
      const newImageIdIndex = eventData.newImageIdIndex;

      console.log('[Stack Scroll] Event fired:', {
        newImageIdIndex,
        currentImageIndex,
        totalImages: imageIds.length
      });

      if (newImageIdIndex !== undefined && newImageIdIndex !== currentImageIndex) {
        setCurrentImageIndex(newImageIdIndex);
      }
    };

    element.addEventListener('cornerstonenewimage', handleStackScroll);

    return () => {
      element.removeEventListener('cornerstonenewimage', handleStackScroll);
    };
  }, [currentImageIndex, imageIds.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (imageIds.length === 0) return;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        previousImage();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        nextImage();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentImageIndex, imageIds.length]);

  // Track measurements when tools complete
  useEffect(() => {
    if (!viewportRef.current || imageIds.length === 0) return;

    const element = viewportRef.current;

    const handleMeasurementCompleted = (evt) => {
      console.log('[Measurement] Tool completed:', evt.detail);

      try {
        const toolState = cornerstoneTools.getToolState(element, evt.detail.toolType);

        if (toolState && toolState.data && toolState.data.length > 0) {
          const latestMeasurement = toolState.data[toolState.data.length - 1];

          const measurementData = {
            id: `${evt.detail.toolType}-${Date.now()}`,
            type: evt.detail.toolType === 'Length' ? 'Length' :
                  evt.detail.toolType === 'RectangleRoi' ? 'Rectangle Area' :
                  evt.detail.toolType === 'EllipticalRoi' ? 'Ellipse Area' : evt.detail.toolType,
            sliceIndex: currentImageIndex,
            toolType: evt.detail.toolType,
            data: latestMeasurement
          };

          // Format the measurement based on type
          if (evt.detail.toolType === 'Length' && latestMeasurement.length) {
            measurementData.value = latestMeasurement.length;
            measurementData.formatted = `${latestMeasurement.length.toFixed(2)} mm`;
          } else if (evt.detail.toolType === 'RectangleRoi' || evt.detail.toolType === 'EllipticalRoi') {
            if (latestMeasurement.cachedStats && latestMeasurement.cachedStats.area) {
              measurementData.value = latestMeasurement.cachedStats.area;
              measurementData.formatted = `${latestMeasurement.cachedStats.area.toFixed(2)} mm²`;
            }
          }

          setMeasurements(prev => [...prev, measurementData]);
          console.log('[Measurement] Added:', measurementData);
        }
      } catch (err) {
        console.error('[Measurement] Error tracking:', err);
      }
    };

    element.addEventListener('cornerstonetoolsmeasurementcompleted', handleMeasurementCompleted);

    return () => {
      element.removeEventListener('cornerstonetoolsmeasurementcompleted', handleMeasurementCompleted);
    };
  }, [currentImageIndex, imageIds.length]);

  const loadImageAtIndex = async (index) => {
    if (!viewportRef.current || index < 0 || index >= imageIds.length) {
      console.log('[loadImageAtIndex] Skipping - invalid conditions:', {
        hasViewport: !!viewportRef.current,
        index,
        imageIdsLength: imageIds.length
      });
      return;
    }

    try {
      const imageId = imageIds[index];
      if (!imageId) {
        console.error('[loadImageAtIndex] imageId is undefined at index:', index);
        setError('Invalid image ID');
        return;
      }

      console.log('[loadImageAtIndex] Loading image:', { index, imageId });
      const image = await cornerstone.loadImage(imageId);

      // Display image and let cornerstone set default viewport
      cornerstone.displayImage(viewportRef.current, image);

      // Enable drawing of tools on this element (first time only)
      if (index === 0) {
        const element = viewportRef.current;
        element.addEventListener('cornerstoneimagerendered', (e) => {
          // This event fires whenever the image is rendered, allowing tools to draw
        });
      }

      // Set up or update stack for scrolling
      const existingStack = cornerstoneTools.getToolState(viewportRef.current, 'stack');

      if (!existingStack || !existingStack.data || existingStack.data.length === 0) {
        // First time: create stack state
        console.log('[loadImageAtIndex] Creating new stack state');
        cornerstoneTools.addStackStateManager(viewportRef.current, ['stack']);
        cornerstoneTools.addToolState(viewportRef.current, 'stack', {
          currentImageIdIndex: index,
          imageIds: imageIds
        });
      } else {
        // Update existing stack state
        console.log('[loadImageAtIndex] Updating existing stack state');
        existingStack.data[0].currentImageIdIndex = index;
        existingStack.data[0].imageIds = imageIds;
      }

      // Get viewport and use image's default window/level if available
      const viewport = cornerstone.getViewport(viewportRef.current);

      // Use image's default window/level if this is the first load
      if (index === 0 && image.windowWidth && image.windowCenter) {
        setWindowWidth(image.windowWidth);
        setWindowCenter(image.windowCenter);
        viewport.voi.windowWidth = image.windowWidth;
        viewport.voi.windowCenter = image.windowCenter;
      } else {
        viewport.voi.windowWidth = windowWidth;
        viewport.voi.windowCenter = windowCenter;
      }

      viewport.invert = isInverted;
      cornerstone.setViewport(viewportRef.current, viewport);

      // Reset zoom and pan to fit image properly
      cornerstone.reset(viewportRef.current);

      // Re-activate the current tool after image loads to ensure it's still active
      if (activeTool) {
        try {
          cornerstoneTools.setToolPassive('Wwwc');
          cornerstoneTools.setToolPassive('Pan');
          cornerstoneTools.setToolPassive('Zoom');
          cornerstoneTools.setToolPassive('Length');
          cornerstoneTools.setToolPassive('RectangleRoi');
          cornerstoneTools.setToolPassive('EllipticalRoi');
          cornerstoneTools.setToolActive(activeTool, { mouseButtonMask: 1 });
        } catch (err) {
          console.warn('[loadImageAtIndex] Error re-activating tool:', err);
        }
      }
    } catch (err) {
      console.error('Error loading image:', err);
      setError('Failed to load DICOM image');
    }
  };

  const handleFileUpload = async (event) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const fileList = event.target.files;
    const file = fileList[0];

    if (!isValidDicomFile(file)) {
      setError('Please upload a valid DICOM file (.dcm, .dicom) or ZIP archive');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      let files = [];

      if (file.name.toLowerCase().endsWith('.zip')) {
        files = await extractZipFile(file);
        if (files.length === 0) {
          throw new Error('No DICOM files found in ZIP archive');
        }
      } else {
        files = Array.from(fileList);
      }

      const sortedFiles = sortDicomFiles(files);
      setDicomFiles(sortedFiles);

      // Create image IDs
      const newImageIds = sortedFiles.map((f, index) => {
        return cornerstoneWADOImageLoader.wadouri.fileManager.add(f);
      });

      setImageIds(newImageIds);
      setCurrentImageIndex(0);

      console.log(`✅ Loaded ${newImageIds.length} DICOM files`);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err.message || 'Failed to load DICOM files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolChange = (toolName) => {
    if (!viewportRef.current) {
      console.log('[handleToolChange] Skipping - no viewport');
      return;
    }

    // Check if image is loaded for measurement tools
    const isMeasurementTool = ['Length', 'RectangleRoi', 'EllipticalRoi'].includes(toolName);
    if (isMeasurementTool && imageIds.length === 0) {
      console.log('[handleToolChange] Cannot activate measurement tool - no image loaded');
      setError('Please load a DICOM image first before using measurement tools');
      return;
    }

    try {
      console.log('[handleToolChange] Changing tool to:', toolName);

      const element = viewportRef.current;

      // Set all tools to passive first
      cornerstoneTools.setToolPassive('Wwwc');
      cornerstoneTools.setToolPassive('Pan');
      cornerstoneTools.setToolPassive('Zoom');
      cornerstoneTools.setToolPassive('Length');
      cornerstoneTools.setToolPassive('RectangleRoi');
      cornerstoneTools.setToolPassive('EllipticalRoi');

      // Activate the selected tool on left mouse button
      cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });

      // Update the viewport to reflect tool changes
      if (imageIds.length > 0) {
        cornerstone.updateImage(element);
      }

      setActiveTool(toolName);
      setError(null); // Clear any previous errors
      console.log('[handleToolChange] Tool changed successfully to:', toolName);
    } catch (err) {
      console.error('[handleToolChange] Error changing tool:', err);
      setError(`Failed to activate ${toolName} tool: ${err.message}`);
    }
  };

  const handleWindowLevelChange = (width, center) => {
    setWindowWidth(width);
    setWindowCenter(center);

    if (viewportRef.current && imageIds.length > 0) {
      const viewport = cornerstone.getViewport(viewportRef.current);
      viewport.voi.windowWidth = width;
      viewport.voi.windowCenter = center;
      cornerstone.setViewport(viewportRef.current, viewport);
    }
  };

  const handleInvert = () => {
    const newInvertState = !isInverted;
    setIsInverted(newInvertState);

    if (viewportRef.current && imageIds.length > 0) {
      const viewport = cornerstone.getViewport(viewportRef.current);
      viewport.invert = newInvertState;
      cornerstone.setViewport(viewportRef.current, viewport);
    }
  };

  const handleResetView = () => {
    if (viewportRef.current && imageIds.length > 0) {
      cornerstone.reset(viewportRef.current);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < imageIds.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const captureCurrentSliceAsBase64 = async () => {
    try {
      if (!viewportRef.current) throw new Error('Viewport is not ready.');

      const canvas = viewportRef.current.querySelector('canvas');
      if (!canvas) throw new Error('Unable to capture the current slice.');

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has no dimensions. Make sure the image is fully loaded.');
      }

      let dataUrl;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      } catch (err) {
        console.warn('[Canvas] JPEG conversion failed, trying PNG');
        dataUrl = canvas.toDataURL('image/png');
      }

      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Canvas appears to be empty. Image data not rendered.');
      }

      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        throw new Error('Failed to parse data URL from canvas.');
      }

      const base64Data = parts[1];

      if (base64Data.length < 1000) {
        throw new Error('Image data too small - canvas may be empty or not fully rendered.');
      }

      console.log('[Canvas] Successfully captured image. Size:', base64Data.length, 'bytes');
      return base64Data;
    } catch (err) {
      console.error('[Canvas] Capture error:', err);
      throw err;
    }
  };

  const handleAnalyze = async () => {
    if (imageIds.length === 0) {
      setAnalysisError('Please upload a DICOM file first.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('[Analysis] Starting image capture...');
      const base64Slice = await captureCurrentSliceAsBase64();
      const currentFileName = dicomFiles[currentImageIndex]?.name || 'Unknown';

      console.log('[Analysis] Captured image, sending to server...');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        throw new Error('API base URL not configured. Please set VITE_API_BASE_URL in .env file');
      }
      const response = await fetch(`${baseUrl}/api/openai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Slice,
          sliceIndex: currentImageIndex,
          totalSlices: imageIds.length,
          fileName: currentFileName
        })
      });

      const payload = await response.json();
      console.log('[Analysis] Server response received:', payload);

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Analysis failed.');
      }

      setAnalysisResult(payload);
      setReportType('single');
      setShowReportModal(true);
    } catch (err) {
      console.error('[Analysis] Error:', err);
      setAnalysisError(err.message || 'Unexpected error during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchAnalyze = async () => {
    if (imageIds.length === 0) {
      setBatchAnalysisError('Please upload a DICOM file first.');
      return;
    }
    setIsBatchAnalyzing(true);
    setBatchAnalysisError(null);
    const results = [];
    const totalSlices = imageIds.length;
    try {
      const step = Math.max(1, Math.floor(totalSlices / 15));
      const slicesToAnalyze = Array.from({ length: totalSlices }, (_, i) => i)
        .filter((i) => i % step === 0 || i === totalSlices - 1);

      console.log('[Batch] Starting analysis of', slicesToAnalyze.length, 'slices');

      for (let i = 0; i < slicesToAnalyze.length; i++) {
        const sliceIndex = slicesToAnalyze[i];
        console.log(`[Batch] Processing slice ${i + 1}/${slicesToAnalyze.length} (index: ${sliceIndex})`);

        setCurrentImageIndex(sliceIndex);
        await new Promise((resolve) => setTimeout(resolve, 800));

        let base64Slice;
        try {
          base64Slice = await captureCurrentSliceAsBase64();
        } catch (captureErr) {
          console.error(`[Batch] Failed to capture slice ${sliceIndex}:`, captureErr.message);
          setBatchAnalysisError(`Failed to capture image for slice ${sliceIndex + 1}: ${captureErr.message}`);
          return;
        }

        const currentFileName = dicomFiles[sliceIndex]?.name || 'Unknown';

        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL;
          if (!baseUrl) {
            throw new Error('API base URL not configured. Please set VITE_API_BASE_URL in .env file');
          }
          const response = await fetch(`${baseUrl}/api/openai/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Slice,
              sliceIndex: sliceIndex,
              totalSlices: totalSlices,
              fileName: currentFileName
            })
          });

          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload?.message || payload?.error || 'Analysis failed for slice ' + (sliceIndex + 1));
          }

          results.push({ slice_number: sliceIndex + 1, ...payload });
          console.log(`[Batch] Completed slice ${sliceIndex + 1}`);
        } catch (err) {
          console.error(`[Batch] Error analyzing slice ${sliceIndex}:`, err);
          throw new Error(`Slice ${sliceIndex + 1}: ${err.message}`);
        }
      }

      console.log('[Batch] All slices analyzed, generating report');

      const summaryReport = {
        study_name: dicomFiles[0]?.name?.split('/').pop() || 'Unknown Study',
        total_slices: totalSlices,
        slices_analyzed: slicesToAnalyze.length,
        analysis_date: new Date().toISOString(),
        slice_results: results,
        summary: generateSummaryReport(results, totalSlices)
      };

      setBatchAnalysisResults(summaryReport);
      setReportType('batch');
      setShowReportModal(true);
    } catch (err) {
      console.error('[Batch] Error:', err);
      setBatchAnalysisError(err.message || 'Unexpected error during batch analysis.');
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const generateSummaryReport = (results, totalSlices) => {
    const allLesions = [];
    const allRisks = new Set();
    let highConfidenceCount = 0;
    results.forEach((result) => {
      if (result.lesion_identification) allLesions.push(result.lesion_identification);
      if (result.clinical_risks) {
        result.clinical_risks.split(',').forEach((risk) => {
          allRisks.add(risk.trim());
        });
      }
      if (result.confidence_score === 'High') highConfidenceCount++;
    });
    return {
      total_slices_studied: totalSlices,
      slices_with_findings: results.filter((r) => r.lesion_identification && r.lesion_identification !== 'No lesions detected').length,
      lesion_summary: allLesions.length > 0 ? allLesions.join(' | ') : 'No lesions detected',
      identified_risks: Array.from(allRisks).join(', ') || 'No acute risks identified',
      confidence_level: highConfidenceCount === results.length ? 'High' : highConfidenceCount > results.length / 2 ? 'Medium' : 'Variable',
      recommendation: `Complete RECIST 1.1 assessment recommended. Review with qualified radiologist.`
    };
  };

  const handleClearMeasurements = () => {
    if (viewportRef.current) {
      const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();
      cornerstoneTools.clearToolState(viewportRef.current, 'Length');
      cornerstoneTools.clearToolState(viewportRef.current, 'RectangleRoi');
      cornerstoneTools.clearToolState(viewportRef.current, 'EllipticalRoi');
      cornerstone.updateImage(viewportRef.current);
    }
    setMeasurements([]);
  };

  const handleRemoveMeasurement = (id) => {
    if (!viewportRef.current) return;

    try {
      // Find the measurement in our state
      const measurement = measurements.find(m => m.id === id);
      if (!measurement) return;

      // Get tool state from cornerstone
      const toolState = cornerstoneTools.getToolState(viewportRef.current, measurement.toolType);

      if (toolState && toolState.data) {
        // Find and remove the measurement data from cornerstone
        const index = toolState.data.findIndex(d => {
          // Match by comparing data object reference or other properties
          return d === measurement.data;
        });

        if (index !== -1) {
          toolState.data.splice(index, 1);
          cornerstone.updateImage(viewportRef.current);
          console.log('[Measurement] Removed from cornerstone:', id);
        }
      }
    } catch (err) {
      console.error('[Measurement] Error removing:', err);
    }

    // Remove from our state
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  const handleExportMeasurements = () => {
    const data = JSON.stringify(measurements, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Report Modal Component
  const ReportModal = () => {
    if (!showReportModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-black/40"
          onClick={() => setShowReportModal(false)}
        />

        <div className="relative w-full max-w-lg bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col">
          <div className="bg-black/60 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-lg font-bold text-white">
              {reportType === 'single' ? '📋 Analysis Report' : '📊 Batch Report'}
            </h2>
            <button
              onClick={() => setShowReportModal(false)}
              className="text-slate-400 hover:text-white text-2xl leading-none"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {reportType === 'single' && analysisResult && (
              <div className="space-y-4 text-sm">
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Slice Information</p>
                  <p className="text-slate-100">
                    Slice {(analysisResult.slice_index || 0) + 1} / {analysisResult.total_slices || '?'}
                  </p>
                </div>

                {analysisResult.region_organ && (
                  <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-800">
                    <h3 className="text-blue-300 font-semibold text-xs uppercase mb-1">🔍 Region / Organ Identified</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{analysisResult.region_organ}</p>
                  </div>
                )}

                {analysisResult.lesion_identification && (
                  <div className="bg-amber-950/50 rounded-lg p-3 border border-amber-800">
                    <h3 className="text-amber-300 font-semibold text-xs uppercase mb-1">⚕️ Lesion Identification (RECIST 1.1)</h3>
                    <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{analysisResult.lesion_identification}</p>
                  </div>
                )}

                {analysisResult.measurements && analysisResult.measurements !== 'N/A' && (
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                    <h3 className="text-slate-300 font-semibold text-xs uppercase mb-1">📐 Measurements (mm)</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{analysisResult.measurements}</p>
                  </div>
                )}

                {analysisResult.findings && (
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                    <h3 className="text-slate-300 font-semibold text-xs uppercase mb-1">📝 Findings / Interpretation</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{analysisResult.findings}</p>
                  </div>
                )}

                {analysisResult.clinical_risks && (
                  <div className="bg-red-950/50 rounded-lg p-3 border border-red-800">
                    <h3 className="text-red-300 font-semibold text-xs uppercase mb-1">⚠️ Clinical Risks / Concerns</h3>
                    <p className="text-red-100 text-sm leading-relaxed">{analysisResult.clinical_risks}</p>
                  </div>
                )}

                {analysisResult.recist_response && (
                  <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-800">
                    <h3 className="text-purple-300 font-semibold text-xs uppercase mb-1">📊 RECIST Response Assessment</h3>
                    <p className="text-purple-100 text-sm leading-relaxed">{analysisResult.recist_response}</p>
                  </div>
                )}

                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 space-y-2">
                  {analysisResult.confidence_score && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-semibold">Confidence Score</p>
                      <p className="text-slate-100 text-sm">{analysisResult.confidence_score}</p>
                    </div>
                  )}
                  {analysisResult.notes && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-semibold mt-2">Notes</p>
                      <p className="text-slate-100 text-sm">{analysisResult.notes}</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-950/30 rounded-lg p-3 border border-yellow-800">
                  <p className="text-yellow-100 text-xs italic">
                    ⚠️ {analysisResult.disclaimer}
                  </p>
                </div>
              </div>
            )}

            {reportType === 'batch' && batchAnalysisResults && (
              <div className="space-y-4 text-sm">
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Study Information</p>
                  <div className="space-y-1">
                    <p className="text-slate-100"><span className="font-semibold">Study:</span> {batchAnalysisResults.study_name}</p>
                    <p className="text-slate-100"><span className="font-semibold">Date:</span> {new Date(batchAnalysisResults.analysis_date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-blue-950/50 rounded-lg p-4 border border-blue-800">
                  <p className="text-blue-300 text-xs uppercase font-semibold mb-3">📊 Summary Statistics</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-slate-400 text-xs">Total Slices</p>
                      <p className="text-white font-bold text-lg">{batchAnalysisResults.total_slices}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-slate-400 text-xs">Analyzed</p>
                      <p className="text-white font-bold text-lg">{batchAnalysisResults.slices_analyzed}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-slate-400 text-xs">With Findings</p>
                      <p className="text-amber-300 font-bold text-lg">{batchAnalysisResults.summary.slices_with_findings}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-slate-400 text-xs">Confidence</p>
                      <p className="text-green-300 font-bold text-lg">{batchAnalysisResults.summary.confidence_level}</p>
                    </div>
                  </div>
                </div>

                {batchAnalysisResults.summary.lesion_summary && (
                  <div className="bg-amber-950/50 rounded-lg p-3 border border-amber-800">
                    <h3 className="text-amber-300 font-semibold text-xs uppercase mb-2">🎯 Lesion Summary</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{batchAnalysisResults.summary.lesion_summary}</p>
                  </div>
                )}

                {batchAnalysisResults.summary.identified_risks && (
                  <div className="bg-red-950/50 rounded-lg p-3 border border-red-800">
                    <h3 className="text-red-300 font-semibold text-xs uppercase mb-2">⚠️ Identified Risks</h3>
                    <p className="text-red-100 text-sm leading-relaxed">{batchAnalysisResults.summary.identified_risks}</p>
                  </div>
                )}

                {batchAnalysisResults.summary.recommendation && (
                  <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-800">
                    <h3 className="text-purple-300 font-semibold text-xs uppercase mb-2">💡 Clinical Recommendation</h3>
                    <p className="text-purple-100 text-sm leading-relaxed">{batchAnalysisResults.summary.recommendation}</p>
                  </div>
                )}

                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                  <h3 className="text-slate-300 font-semibold text-xs uppercase mb-3">📋 Individual Slice Analyses</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {batchAnalysisResults.slice_results.map((result, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded p-2.5 border-l-2 border-blue-500">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-blue-300 text-xs">Slice {result.slice_number}</span>
                          <span className="text-xs text-green-300 bg-green-950/50 px-2 py-0.5 rounded">{result.confidence_score}</span>
                        </div>

                        {result.region_organ && (
                          <div className="text-xs mb-1">
                            <span className="text-slate-400">Region:</span>
                            <span className="text-slate-100 ml-1">{result.region_organ}</span>
                          </div>
                        )}

                        {result.lesion_identification && result.lesion_identification !== 'No lesions detected' && (
                          <div className="text-xs mb-1">
                            <span className="text-slate-400">Lesions:</span>
                            <span className="text-slate-100 ml-1">{result.lesion_identification.substring(0, 120)}...</span>
                          </div>
                        )}

                        {result.measurements && result.measurements !== 'N/A' && (
                          <div className="text-xs mb-1">
                            <span className="text-slate-400">Measurements:</span>
                            <span className="text-slate-100 ml-1">{result.measurements.substring(0, 80)}...</span>
                          </div>
                        )}

                        {result.clinical_risks && (
                          <div className="text-xs">
                            <span className="text-red-400">Risks:</span>
                            <span className="text-red-200 ml-1">{result.clinical_risks.substring(0, 80)}...</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-black/60 border-t border-slate-800 px-6 py-3 space-y-2 sticky bottom-0">
            {reportType === 'batch' && batchAnalysisResults && (
              <button
                onClick={() => {
                  const reportJSON = JSON.stringify(batchAnalysisResults, null, 2);
                  const blob = new Blob([reportJSON], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `RECIST_Report_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-medium text-sm py-2 px-3 rounded transition-colors"
              >
                📥 Download Report
              </button>
            )}
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm py-2 px-3 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-black/60 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">🏥 DICOM Medical Imaging Viewer</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {imageIds.length > 0 && (
                <>
                  <span>Slice: {currentImageIndex + 1} / {imageIds.length}</span>
                  <span>W/L: {windowWidth}/{windowCenter}</span>
                  {showReportModal && (
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="ml-2 px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded"
                    >
                      Hide Report
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-2">
        {error && (
          <div className="bg-red-950/50 border border-red-700 text-red-100 text-sm rounded-lg px-3 py-2 mb-3">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 h-[calc(100vh-120px)]">
          <div className="lg:col-span-1 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-800">
              <h3 className="text-sm font-semibold text-white mb-3">📁 Upload DICOM</h3>
              <FileUploader
                onFileSelect={handleFileUpload}
                isLoading={isLoading}
                fileCount={dicomFiles.length}
                currentIndex={currentImageIndex}
              />
            </div>


            {imageIds.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white">🔬 AI Analysis</h3>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || isBatchAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-medium text-sm py-2 px-3 rounded transition-colors"
                >
                  {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Slice'}
                </button>
                <button
                  onClick={handleBatchAnalyze}
                  disabled={isBatchAnalyzing || isAnalyzing}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white font-medium text-sm py-2 px-3 rounded transition-colors"
                >
                  {isBatchAnalyzing ? '⏳ Analyzing...' : '📊 Analyze All'}
                </button>

                {(analysisResult || batchAnalysisResults) && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2 px-3 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    📋 View Report
                  </button>
                )}

                {(analysisError || batchAnalysisError) && (
                  <div className="bg-red-950/50 border border-red-700 text-red-100 text-xs rounded px-2 py-1">
                    {analysisError || batchAnalysisError}
                  </div>
                )}
              </div>
            )}

            <MeasurementsPanel
              measurements={measurements}
              onClear={handleClearMeasurements}
              onRemove={handleRemoveMeasurement}
              onExport={handleExportMeasurements}
              currentSlice={currentImageIndex}
              totalSlices={imageIds.length}
            />
          </div>

          <div className="lg:col-span-3 space-y-3 max-h-[calc(100vh-120px)]">
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-slate-800 flex flex-col h-full">
              {imageIds.length > 0 && (
                <div className="mb-3 space-y-2">
                  <Toolbar
                    activeTool={activeTool}
                    onToolChange={handleToolChange}
                    onResetView={handleResetView}
                  />
                  <div className="flex flex-wrap gap-2">
                    <WindowLevelControls
                      windowWidth={windowWidth}
                      windowCenter={windowCenter}
                      onWindowLevelChange={handleWindowLevelChange}
                      onPresetChange={handleWindowLevelChange}
                    />
                    <ImageFilters
                      onInvert={handleInvert}
                      isInverted={isInverted}
                    />
                  </div>
                </div>
              )}

              <div className="bg-black rounded-lg overflow-hidden relative flex-1 min-h-[450px] max-h-[calc(100vh-280px)]">
                <div ref={viewportRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
                {imageIds.length === 0 && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-500 text-sm">Upload DICOM files to begin</p>
                    </div>
                  </div>
                )}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-white text-sm">Loading...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportModal />
    </div>
  );
}

export default App;
