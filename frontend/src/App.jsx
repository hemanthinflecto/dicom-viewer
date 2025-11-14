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
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchAnalysisResults, setBatchAnalysisResults] = useState(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchAnalysisError, setBatchAnalysisError] = useState(null);

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
      
      // Provide helpful error messages for common issues
      let errorMessage = 'Failed to load images';
      if (err.message?.includes('DICM prefix') || err.message?.includes('not a valid DICOM')) {
        errorMessage = 'Invalid DICOM file. Please upload actual .dcm medical imaging files (not JPG/PNG).';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    setError(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      await dicomLoader.loadFiles(event.target.files);
    } catch (err) {
      setError(err.message);
    }
  };

  const captureCurrentSliceAsBase64 = () => {
    const viewportInstance = viewport.getViewport();
    if (!viewportInstance) {
      throw new Error('Viewport is not ready. Load a DICOM file first.');
    }

    const canvas = viewportInstance.getCanvas();
    if (!canvas) {
      throw new Error('Unable to capture the current slice.');
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
      throw new Error('Failed to convert slice to JPEG.');
    }
    return parts[1];
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



  // Batch analyze all slices
  const handleBatchAnalyze = async () => {
    if (dicomLoader.imageIds.length === 0) {
      setBatchAnalysisError('Please upload and display a DICOM series before requesting analysis.');
      return;
    }

    setIsBatchAnalyzing(true);
    setBatchAnalysisError(null);
    const results = [];
    const totalSlices = dicomLoader.imageIds.length;

    try {
      console.log('[Batch Analysis] Starting analysis of all slices...');
      console.log(`[Batch Analysis] Total slices: ${totalSlices}`);

      // Analyze every 3rd slice for efficiency (adjustable)
      const step = Math.max(1, Math.floor(totalSlices / 15)); // Max ~15 slices
      const slicesToAnalyze = Array.from(
        { length: totalSlices },
        (_, i) => i
      ).filter((i) => i % step === 0 || i === totalSlices - 1);

      for (let i = 0; i < slicesToAnalyze.length; i++) {
        const sliceIndex = slicesToAnalyze[i];
        console.log(`[Batch Analysis] Analyzing slice ${sliceIndex + 1}/${totalSlices} (${i + 1}/${slicesToAnalyze.length})`);

        // Navigate to slice
        dicomLoader.setCurrentImageIndex(sliceIndex);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for viewport to update

        // Capture slice
        const base64Slice = captureCurrentSliceAsBase64();
        const currentFileName = dicomLoader.dicomFiles[sliceIndex]?.name || 'Unknown';

        // Analyze
        const response = await fetch('http://localhost:3009/api/openai/analyze', {
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
          throw new Error(payload?.message || 'Analysis failed for slice ' + (sliceIndex + 1));
        }

        results.push({
          slice_number: sliceIndex + 1,
          ...payload
        });

        console.log(`[Batch Analysis] Completed slice ${sliceIndex + 1}`);
      }

      console.log('[Batch Analysis] All slices analyzed. Generating report...');

      // Generate summary report
      const summaryReport = {
        study_name: dicomLoader.dicomFiles[0]?.name?.split('/').pop() || 'Unknown Study',
        total_slices: totalSlices,
        slices_analyzed: slicesToAnalyze.length,
        analysis_date: new Date().toISOString(),
        slice_results: results,
        summary: generateSummaryReport(results, totalSlices)
      };

      setBatchAnalysisResults(summaryReport);
      console.log('[Batch Analysis] Report complete:', summaryReport);
    } catch (err) {
      console.error('[Batch Analysis] Error:', err);
      setBatchAnalysisError(err.message || 'Unexpected error during batch analysis.');
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  // Generate summary from all slice analyses
  const generateSummaryReport = (results, totalSlices) => {
    const allLesions = [];
    const allRisks = new Set();
    let highConfidenceCount = 0;

    results.forEach((result) => {
      if (result.lesion_identification) {
        allLesions.push(result.lesion_identification);
      }
      if (result.clinical_risks) {
        result.clinical_risks.split(',').forEach((risk) => {
          allRisks.add(risk.trim());
        });
      }
      if (result.confidence_score === 'High') {
        highConfidenceCount++;
      }
    });

    return {
      total_slices_studied: totalSlices,
      slices_with_findings: results.filter(
        (r) => r.lesion_identification && r.lesion_identification !== 'No lesions detected'
      ).length,
      lesion_summary: allLesions.length > 0 ? allLesions.join(' | ') : 'No lesions detected',
      identified_risks: Array.from(allRisks).join(', ') || 'No acute risks identified',
      confidence_level:
        highConfidenceCount === results.length
          ? 'High (all slices)'
          : highConfidenceCount > results.length / 2
            ? 'Medium (most slices)'
            : 'Variable',
      recommendation: `Complete RECIST 1.1 assessment recommended. Review with qualified radiologist. Follow-up imaging as clinically indicated.`
    };
  };

  const handleAnalyze = async () => {
    if (dicomLoader.imageIds.length === 0) {
      setAnalysisError('Please upload and display a DICOM slice before requesting analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const base64Slice = captureCurrentSliceAsBase64();
      const currentFileName = dicomLoader.dicomFiles[dicomLoader.currentImageIndex]?.name || 'Unknown';
      
      console.log('[OpenAI] Captured slice', {
        sliceIndex: dicomLoader.currentImageIndex,
        totalSlices: dicomLoader.imageIds.length,
        fileName: currentFileName,
        base64Length: base64Slice.length
      });

      const response = await fetch('http://localhost:3009/api/openai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: base64Slice,
          sliceIndex: dicomLoader.currentImageIndex,
          totalSlices: dicomLoader.imageIds.length,
          fileName: currentFileName
        })
      });

      const payload = await response.json();
      console.log('[OpenAI] Server response:', payload);

      if (!response.ok) {
        throw new Error(payload?.message || 'OpenAI analysis failed.');
      }

      setAnalysisResult(payload);
    } catch (err) {
      console.error('[OpenAI] Analysis error:', err);
      setAnalysisError(err.message || 'Unexpected error while contacting OpenAI.');
    } finally {
      setIsAnalyzing(false);
    }
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

            {/* AI Analysis Panel - OpenAI */}
            {dicomLoader.imageIds.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">🧠 AI Analysis (OpenAI GPT-4 Vision)</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Medical imaging interpretation and diagnosis using RECIST 1.1
                  </p>
                </div>

                {/* Analysis Type Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setBatchAnalysisResults(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white"
                  >
                    Current Slice
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setBatchAnalysisResults(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white"
                  >
                    All Slices
                  </button>
                </div>

                {/* Current Slice Analysis Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || isBatchAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Analyzing with OpenAI...</span>
                    </>
                  ) : (
                    <>
                      <span role="img" aria-label="sparkles">
                        🔬
                      </span>
                      <span>Analyze Current Slice</span>
                    </>
                  )}
                </button>

                {/* Batch Analysis Button */}
                <button
                  onClick={handleBatchAnalyze}
                  disabled={isBatchAnalyzing || isAnalyzing}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isBatchAnalyzing ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Analyzing all slices...</span>
                    </>
                  ) : (
                    <>
                      <span role="img" aria-label="stack">
                        📊
                      </span>
                      <span>Analyze All Slices & Generate Report</span>
                    </>
                  )}
                </button>

                {(analysisError || batchAnalysisError) && (
                  <div className="bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-lg px-3 py-2">
                    {analysisError || batchAnalysisError}
                  </div>
                )}

                {analysisResult && (
                  <div className="bg-slate-700/40 border border-slate-600 rounded-lg p-4 space-y-3 text-sm">
                    {/* File and slice info + Analysis Type */}
                    {(analysisResult.file_name || analysisResult.slice_index !== undefined) && (
                      <div className="text-xs text-slate-400 pb-2 border-b border-slate-600">
                        📁 {analysisResult.file_name || 'Unknown'} • Slice {(analysisResult.slice_index || 0) + 1} / {analysisResult.total_slices || '?'}
                        {analysisResult.analysis_type && (
                          <div className="text-blue-400 font-semibold mt-1">🔬 {analysisResult.analysis_type}</div>
                        )}
                      </div>
                    )}
                    
                    {/* Region/Organ Identified */}
                    {analysisResult.region_organ && (
                      <div>
                        <h3 className="text-slate-300 font-semibold uppercase tracking-wide text-xs">
                          Region / Organ Identified
                        </h3>
                        <p className="text-slate-200 leading-relaxed">{analysisResult.region_organ}</p>
                      </div>
                    )}

                    {/* Lesion Identification */}
                    {analysisResult.lesion_identification && (
                      <div>
                        <h3 className="text-slate-300 font-semibold uppercase tracking-wide text-xs">
                          Lesion Identification (RECIST 1.1)
                        </h3>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{analysisResult.lesion_identification}</p>
                      </div>
                    )}

                    {/* Measurements */}
                    {analysisResult.measurements && analysisResult.measurements !== 'N/A' && (
                      <div>
                        <h3 className="text-slate-300 font-semibold uppercase tracking-wide text-xs">
                          Measurements & RECIST Classification
                        </h3>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{analysisResult.measurements}</p>
                      </div>
                    )}

                    {/* Findings */}
                    {analysisResult.findings && (
                      <div>
                        <h3 className="text-slate-300 font-semibold uppercase tracking-wide text-xs">
                          Findings / Interpretation
                        </h3>
                        <p className="text-slate-200 leading-relaxed">{analysisResult.findings}</p>
                      </div>
                    )}

                    {/* RECIST Response Assessment */}
                    {analysisResult.recist_response && (
                      <div>
                        <h3 className="text-amber-300 font-semibold uppercase tracking-wide text-xs">
                          RECIST Response Assessment
                        </h3>
                        <p className="text-amber-100 leading-relaxed">{analysisResult.recist_response}</p>
                      </div>
                    )}

                    {/* Clinical Risks */}
                    {analysisResult.clinical_risks && (
                      <div>
                        <h3 className="text-red-300 font-semibold uppercase tracking-wide text-xs">
                          Clinical Risks / Concerns
                        </h3>
                        <p className="text-red-100 leading-relaxed">{analysisResult.clinical_risks}</p>
                      </div>
                    )}

                    {/* Confidence & Notes */}
                    <div className="text-xs text-slate-400 space-y-1">
                      {analysisResult.confidence_score && (
                        <div>
                          <span className="font-semibold">Confidence:</span> {analysisResult.confidence_score}
                        </div>
                      )}
                      {analysisResult.notes && (
                        <div>
                          <span className="font-semibold">Notes:</span> {analysisResult.notes}
                        </div>
                      )}
                    </div>

                    {/* Disclaimer */}
                    <div className="text-xs text-slate-400 border-t border-slate-600 pt-2 italic">
                      ⚠️ {analysisResult.disclaimer}
                    </div>
                  </div>
                )}

                {/* Batch Analysis Results */}
                {batchAnalysisResults && (
                  <div className="bg-slate-700/40 border border-purple-600 rounded-lg p-4 space-y-4 text-sm max-h-96 overflow-y-auto">
                    <div className="border-b border-slate-600 pb-3">
                      <h3 className="text-lg font-bold text-purple-300">📊 RECIST 1.1 Batch Analysis Report</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Study: {batchAnalysisResults.study_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Date: {new Date(batchAnalysisResults.analysis_date).toLocaleString()}
                      </p>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-slate-800/50 rounded p-3 space-y-2">
                      <h4 className="text-purple-300 font-semibold text-xs uppercase">Summary Statistics</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Total Slices:</span>
                          <div className="text-white font-semibold">{batchAnalysisResults.total_slices}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Slices Analyzed:</span>
                          <div className="text-white font-semibold">{batchAnalysisResults.slices_analyzed}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Slices with Findings:</span>
                          <div className="text-amber-300 font-semibold">{batchAnalysisResults.summary.slices_with_findings}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Confidence:</span>
                          <div className="text-green-300 font-semibold">{batchAnalysisResults.summary.confidence_level}</div>
                        </div>
                      </div>
                    </div>

                    {/* Lesion Summary */}
                    {batchAnalysisResults.summary.lesion_summary && (
                      <div>
                        <h4 className="text-slate-300 font-semibold text-xs uppercase">Lesion Summary</h4>
                        <p className="text-slate-200 leading-relaxed text-xs">{batchAnalysisResults.summary.lesion_summary}</p>
                      </div>
                    )}

                    {/* Identified Risks */}
                    {batchAnalysisResults.summary.identified_risks && (
                      <div>
                        <h4 className="text-red-300 font-semibold text-xs uppercase">Identified Risks</h4>
                        <p className="text-red-100 leading-relaxed text-xs">{batchAnalysisResults.summary.identified_risks}</p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {batchAnalysisResults.summary.recommendation && (
                      <div className="bg-amber-900/30 border border-amber-700/50 rounded p-3">
                        <h4 className="text-amber-300 font-semibold text-xs uppercase mb-1">Clinical Recommendation</h4>
                        <p className="text-amber-100 leading-relaxed text-xs">{batchAnalysisResults.summary.recommendation}</p>
                      </div>
                    )}

                    {/* Individual Slice Results */}
                    <div>
                      <h4 className="text-slate-300 font-semibold text-xs uppercase mb-2">Individual Slice Analyses</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {batchAnalysisResults.slice_results.map((result, idx) => (
                          <div key={idx} className="bg-slate-800/50 rounded p-2 border-l-2 border-purple-500">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-purple-300 text-xs">
                                Slice {result.slice_number}
                              </span>
                              <span className="text-xs text-green-300">{result.confidence_score}</span>
                            </div>
                            {result.region_organ && (
                              <div className="text-xs text-slate-400 mb-1">
                                <span className="font-semibold">Region:</span> {result.region_organ}
                              </div>
                            )}
                            {result.lesion_identification && result.lesion_identification !== 'No lesions detected' && (
                              <div className="text-xs text-slate-300">
                                <span className="font-semibold">Lesions:</span> {result.lesion_identification.substring(0, 100)}...
                              </div>
                            )}
                            {result.clinical_risks && (
                              <div className="text-xs text-red-300">
                                <span className="font-semibold">Risks:</span> {result.clinical_risks.substring(0, 80)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export Button */}
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
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-xs"
                    >
                      📥 Download Report as JSON
                    </button>
                  </div>
                )}
              </div>
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
