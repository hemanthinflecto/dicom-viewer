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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('single'); // 'single' or 'batch'

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

  // Setup viewport events
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
        await cornerstone.init();
        cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
        cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
        cornerstoneDICOMImageLoader.configure({
          useWebWorkers: true,
          decodeConfig: { convertFloatPixelDataToInt: false },
        });
        cornerstoneTools.init();
        toolManager.initializeTools();
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

  const loadImages = async () => {
    try {
      await viewport.loadImageStack(dicomLoader.imageIds, dicomLoader.currentImageIndex);
      toolManager.addViewport(viewport.viewportId, viewport.renderingEngineId);
      await new Promise(resolve => setTimeout(resolve, 50));
      viewport.setWindowLevel(windowWidth, windowCenter);
      if (isInverted) viewport.setInvert(true);
      viewport.render();
    } catch (err) {
      console.error('Error loading images:', err);
      let errorMessage = 'Failed to load images';
      if (err.message?.includes('DICM prefix') || err.message?.includes('not a valid DICOM')) {
        errorMessage = 'Invalid DICOM file. Please upload actual .dcm medical imaging files.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

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

  const captureCurrentSliceAsBase64 = async () => {
    try {
      const viewportInstance = viewport.getViewport();
      if (!viewportInstance) throw new Error('Viewport is not ready.');
      
      const canvas = viewportInstance.getCanvas();
      if (!canvas) throw new Error('Unable to capture the current slice.');
      
      // Ensure canvas has been rendered properly
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has no dimensions. Make sure the image is fully loaded.');
      }
      
      // Try to capture as JPEG with high quality
      let dataUrl;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      } catch (err) {
        // Fallback to PNG if JPEG fails
        console.warn('[Canvas] JPEG conversion failed, trying PNG');
        dataUrl = canvas.toDataURL('image/png');
      }
      
      // Validate data URL
      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Canvas appears to be empty. Image data not rendered.');
      }
      
      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        throw new Error('Failed to parse data URL from canvas.');
      }
      
      const base64Data = parts[1];
      
      // Validate base64 data isn't too small (likely empty)
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

  const handleWindowLevelChange = (width, center) => {
    setWindowWidth(width);
    setWindowCenter(center);
    viewport.setWindowLevel(width, center);
  };

  const handleInvert = () => {
    const newInvertState = !isInverted;
    setIsInverted(newInvertState);
    viewport.setInvert(newInvertState);
    viewport.render();
  };

  const handleAnalyze = async () => {
    if (dicomLoader.imageIds.length === 0) {
      setAnalysisError('Please upload a DICOM file first.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      // Ensure viewport is rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('[Analysis] Starting image capture...');
      const base64Slice = await captureCurrentSliceAsBase64();
      const currentFileName = dicomLoader.dicomFiles[dicomLoader.currentImageIndex]?.name || 'Unknown';
      
      console.log('[Analysis] Captured image, sending to server...');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009';
      const response = await fetch(`${baseUrl}/api/openai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Slice,
          sliceIndex: dicomLoader.currentImageIndex,
          totalSlices: dicomLoader.imageIds.length,
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
    if (dicomLoader.imageIds.length === 0) {
      setBatchAnalysisError('Please upload a DICOM file first.');
      return;
    }
    setIsBatchAnalyzing(true);
    setBatchAnalysisError(null);
    const results = [];
    const totalSlices = dicomLoader.imageIds.length;
    try {
      const step = Math.max(1, Math.floor(totalSlices / 15));
      const slicesToAnalyze = Array.from({ length: totalSlices }, (_, i) => i)
        .filter((i) => i % step === 0 || i === totalSlices - 1);
      
      console.log('[Batch] Starting analysis of', slicesToAnalyze.length, 'slices');
      
      for (let i = 0; i < slicesToAnalyze.length; i++) {
        const sliceIndex = slicesToAnalyze[i];
        console.log(`[Batch] Processing slice ${i + 1}/${slicesToAnalyze.length} (index: ${sliceIndex})`);
        
        dicomLoader.setCurrentImageIndex(sliceIndex);
        await new Promise((resolve) => setTimeout(resolve, 800)); // Increased wait time
        
        let base64Slice;
        try {
          base64Slice = await captureCurrentSliceAsBase64();
        } catch (captureErr) {
          console.error(`[Batch] Failed to capture slice ${sliceIndex}:`, captureErr.message);
          setBatchAnalysisError(`Failed to capture image for slice ${sliceIndex + 1}: ${captureErr.message}`);
          return;
        }
        
        const currentFileName = dicomLoader.dicomFiles[sliceIndex]?.name || 'Unknown';
        
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009';
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
        study_name: dicomLoader.dicomFiles[0]?.name?.split('/').pop() || 'Unknown Study',
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
    measurements.clearMeasurements(viewport.viewportId, viewport.render);
  };

  const handleRemoveMeasurement = (id) => {
    measurements.removeMeasurement(id, viewport.viewportId, viewport.render);
  };

  // Report Modal Component
  const ReportModal = () => {
    if (!showReportModal) return null;

  return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40"
          onClick={() => setShowReportModal(false)}
        />

        {/* Modal Panel - Left Side */}
        <div className="relative w-full max-w-lg bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {reportType === 'single' && analysisResult && (
              <div className="space-y-4 text-sm">
                {/* Header Info */}
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Slice Information</p>
                  <p className="text-slate-100">
                    Slice {(analysisResult.slice_index || 0) + 1} / {analysisResult.total_slices || '?'}
                  </p>
                </div>

                {/* Region/Organ */}
                {analysisResult.region_organ && (
                  <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-800">
                    <h3 className="text-blue-300 font-semibold text-xs uppercase mb-1">🔍 Region / Organ Identified</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{analysisResult.region_organ}</p>
                      </div>
                    )}

                    {/* Lesion Identification */}
                    {analysisResult.lesion_identification && (
                  <div className="bg-amber-950/50 rounded-lg p-3 border border-amber-800">
                    <h3 className="text-amber-300 font-semibold text-xs uppercase mb-1">⚕️ Lesion Identification (RECIST 1.1)</h3>
                    <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{analysisResult.lesion_identification}</p>
                      </div>
                    )}

                    {/* Measurements */}
                    {analysisResult.measurements && analysisResult.measurements !== 'N/A' && (
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                    <h3 className="text-slate-300 font-semibold text-xs uppercase mb-1">📐 Measurements (mm)</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{analysisResult.measurements}</p>
                      </div>
                    )}

                    {/* Findings */}
                    {analysisResult.findings && (
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                    <h3 className="text-slate-300 font-semibold text-xs uppercase mb-1">📝 Findings / Interpretation</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{analysisResult.findings}</p>
                      </div>
                    )}

                    {/* Clinical Risks */}
                    {analysisResult.clinical_risks && (
                  <div className="bg-red-950/50 rounded-lg p-3 border border-red-800">
                    <h3 className="text-red-300 font-semibold text-xs uppercase mb-1">⚠️ Clinical Risks / Concerns</h3>
                    <p className="text-red-100 text-sm leading-relaxed">{analysisResult.clinical_risks}</p>
                  </div>
                )}

                {/* RECIST Response */}
                {analysisResult.recist_response && (
                  <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-800">
                    <h3 className="text-purple-300 font-semibold text-xs uppercase mb-1">📊 RECIST Response Assessment</h3>
                    <p className="text-purple-100 text-sm leading-relaxed">{analysisResult.recist_response}</p>
                      </div>
                    )}

                    {/* Confidence & Notes */}
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

                    {/* Disclaimer */}
                <div className="bg-yellow-950/30 rounded-lg p-3 border border-yellow-800">
                  <p className="text-yellow-100 text-xs italic">
                      ⚠️ {analysisResult.disclaimer}
                  </p>
                    </div>
                  </div>
                )}

            {reportType === 'batch' && batchAnalysisResults && (
              <div className="space-y-4 text-sm">
                {/* Study Info */}
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Study Information</p>
                  <div className="space-y-1">
                    <p className="text-slate-100"><span className="font-semibold">Study:</span> {batchAnalysisResults.study_name}</p>
                    <p className="text-slate-100"><span className="font-semibold">Date:</span> {new Date(batchAnalysisResults.analysis_date).toLocaleString()}</p>
                  </div>
                </div>

                {/* Summary Statistics */}
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

                    {/* Lesion Summary */}
                    {batchAnalysisResults.summary.lesion_summary && (
                  <div className="bg-amber-950/50 rounded-lg p-3 border border-amber-800">
                    <h3 className="text-amber-300 font-semibold text-xs uppercase mb-2">🎯 Lesion Summary</h3>
                    <p className="text-slate-100 text-sm leading-relaxed">{batchAnalysisResults.summary.lesion_summary}</p>
                      </div>
                    )}

                    {/* Identified Risks */}
                    {batchAnalysisResults.summary.identified_risks && (
                  <div className="bg-red-950/50 rounded-lg p-3 border border-red-800">
                    <h3 className="text-red-300 font-semibold text-xs uppercase mb-2">⚠️ Identified Risks</h3>
                    <p className="text-red-100 text-sm leading-relaxed">{batchAnalysisResults.summary.identified_risks}</p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {batchAnalysisResults.summary.recommendation && (
                  <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-800">
                    <h3 className="text-purple-300 font-semibold text-xs uppercase mb-2">💡 Clinical Recommendation</h3>
                    <p className="text-purple-100 text-sm leading-relaxed">{batchAnalysisResults.summary.recommendation}</p>
                      </div>
                    )}

                    {/* Individual Slice Results */}
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

          {/* Footer with Actions */}
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
      {/* Header - Compact */}
      <header className="bg-black/60 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">🏥 DICOM Medical Imaging Viewer</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {dicomLoader.imageIds.length > 0 && (
                <>
                  <span>Slice: {dicomLoader.currentImageIndex + 1} / {dicomLoader.imageIds.length}</span>
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

      <div className="container mx-auto px-4 py-3">
        {error && (
          <div className="bg-red-950/50 border border-red-700 text-red-100 text-sm rounded-lg px-3 py-2 mb-3">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[calc(100vh-140px)]">
          {/* Left Sidebar - Controls (Compact) */}
          <div className="lg:col-span-1 space-y-3 overflow-y-auto">
            {/* File Uploader */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-800">
              <h3 className="text-sm font-semibold text-white mb-3">📁 Upload DICOM</h3>
              <FileUploader
                onFileSelect={handleFileUpload}
                isLoading={dicomLoader.isLoading}
                fileCount={dicomLoader.dicomFiles.length}
                currentIndex={dicomLoader.currentImageIndex}
              />
            </div>

            {/* Quick Navigation */}
            {dicomLoader.imageIds.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-2">⬅️ Navigation</h3>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={dicomLoader.previousImage}
                    disabled={dicomLoader.currentImageIndex === 0}
                    className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={dicomLoader.nextImage}
                    disabled={dicomLoader.currentImageIndex === dicomLoader.imageIds.length - 1}
                    className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors"
                  >
                    Next
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max={dicomLoader.imageIds.length - 1}
                  value={dicomLoader.currentImageIndex}
                  onChange={(e) => dicomLoader.setCurrentImageIndex(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="text-xs text-slate-400 mt-2 text-center">
                  Use ↑↓ arrow keys or scroll
                </div>
              </div>
            )}

            {/* AI Analysis Panel */}
            {dicomLoader.imageIds.length > 0 && (
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

                {/* Show Report Button when analysis is done */}
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

            {/* Measurements Panel */}
            <MeasurementsPanel
              measurements={measurements.measurements}
              onClear={handleClearMeasurements}
              onRemove={handleRemoveMeasurement}
              onExport={measurements.exportMeasurements}
              currentSlice={dicomLoader.currentImageIndex}
              totalSlices={dicomLoader.imageIds.length}
            />
          </div>

          {/* Main Content Area - Image Only */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto">
            {/* Viewer Area */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-slate-800 h-full flex flex-col">
              {/* Compact Toolbar */}
              {dicomLoader.imageIds.length > 0 && (
                <div className="mb-3 space-y-2">
                <Toolbar
                  activeTool={toolManager.activeTool}
                  onToolChange={toolManager.setTool}
                  onResetView={viewport.resetCamera}
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

              {/* Viewport */}
              <div className="bg-black rounded-lg overflow-hidden relative flex-1">
                <div ref={viewport.viewportRef} className="w-full h-full" />
                {dicomLoader.imageIds.length === 0 && !dicomLoader.isLoading && (
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
                {dicomLoader.isLoading && (
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

      {/* Report Modal */}
      <ReportModal />
    </div>
  );
}

export default App;
