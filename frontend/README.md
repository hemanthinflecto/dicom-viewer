# Advanced DICOM Medical Imaging Viewer

A professional-grade DICOM viewer built with React and Cornerstone.js, featuring advanced measurement tools, image filters, and a modular component architecture.

## 🏗️ Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── FileUploader.jsx        # File upload component
│   ├── Toolbar.jsx             # Tool selection toolbar
│   ├── WindowLevelControls.jsx # Window/Level controls
│   ├── ImageFilters.jsx        # Image filter controls
│   ├── SliceNavigator.jsx      # Slice navigation component
│   ├── MeasurementsPanel.jsx   # Measurements display panel
│   └── index.js                # Component exports
│
├── hooks/               # Custom React hooks
│   ├── useCornerstoneViewport.js  # Viewport management
│   ├── useDicomLoader.js          # DICOM file loading
│   ├── useToolManager.js          # Tool management
│   ├── useMeasurements.js         # Measurement tracking
│   └── index.js                   # Hook exports
│
├── utils/               # Utility functions
│   ├── dicomUtils.js              # DICOM file utilities
│   ├── measurementUtils.js        # Measurement calculations
│   └── index.js                   # Utility exports
│
├── App.jsx              # Main application component
├── main.jsx             # Application entry point
└── index.css            # Global styles
```

## ✨ Features

### 🔧 Measurement Tools
- **Length** - Measure distances in millimeters
- **Rectangle ROI** - Calculate area and volume
- **Ellipse ROI** - Calculate elliptical area and volume
- **Angle** - Measure angles between lines

### 🎨 Image Filters & Adjustments
- **Window/Level** - Manual and preset adjustments
  - Abdomen preset
  - Bone preset
  - Brain preset
  - Lung preset
  - Mediastinum preset
  - Soft Tissue preset
- **Invert Colors** - Toggle color inversion
- **Pan** - Move image around viewport
- **Zoom** - Zoom in/out

### 📊 Navigation
- Previous/Next buttons
- Slider control
- Keyboard shortcuts (↑↓ or ←→)
- Mouse wheel scrolling

### 📁 File Support
- Single DICOM files (.dcm, .dicom)
- ZIP archives containing multiple DICOM files
- Automatic file sorting

### 📈 Measurement Features
- Real-time measurement display
- Automatic unit conversion (mm, mm², mm³)
- Statistical analysis (mean, std dev, min/max)
- Export measurements to JSON
- Individual measurement removal
- Clear all measurements

## 🚀 Usage

### Basic Usage

```jsx
import App from './App';

// The App component handles everything automatically
<App />
```

### Using Custom Hooks

```jsx
import { useCornerstoneViewport, useDicomLoader, useToolManager } from './hooks';

function CustomViewer() {
  const viewport = useCornerstoneViewport('MY_VIEWPORT');
  const loader = useDicomLoader();
  const tools = useToolManager('MY_TOOLS');

  // Your custom implementation
}
```

### Using Utility Functions

```jsx
import { extractZipFile, calculateDistance, WINDOW_LEVEL_PRESETS } from './utils';

// Extract DICOM files from ZIP
const files = await extractZipFile(zipFile);

// Calculate distance with pixel spacing
const distance = calculateDistance(point1, point2, [0.5, 0.5]);

// Apply window/level preset
const preset = WINDOW_LEVEL_PRESETS.CT.BRAIN;
viewport.setWindowLevel(preset.width, preset.center);
```

## 🎯 Component API

### FileUploader
```jsx
<FileUploader
  onFileSelect={(event) => handleFileUpload(event)}
  isLoading={false}
  fileCount={10}
  currentIndex={0}
/>
```

### Toolbar
```jsx
<Toolbar
  activeTool="Pan"
  onToolChange={(toolName) => setTool(toolName)}
  onResetView={() => resetCamera()}
/>
```

### WindowLevelControls
```jsx
<WindowLevelControls
  windowWidth={400}
  windowCenter={50}
  onWindowLevelChange={(width, center) => handleChange(width, center)}
  onPresetChange={(width, center) => handlePreset(width, center)}
/>
```

### SliceNavigator
```jsx
<SliceNavigator
  currentIndex={0}
  totalSlices={100}
  onPrevious={() => previousSlice()}
  onNext={() => nextSlice()}
  onSliceChange={(index) => goToSlice(index)}
/>
```

### MeasurementsPanel
```jsx
<MeasurementsPanel
  measurements={[]}
  onClear={() => clearAll()}
  onRemove={(id) => removeMeasurement(id)}
  onExport={() => exportToJSON()}
/>
```

## 🔌 Hook API

### useCornerstoneViewport

```jsx
const {
  viewportRef,           // React ref for viewport DOM element
  isInitialized,         // Initialization status
  error,                 // Error state
  loadImageStack,        // Load image stack
  setWindowLevel,        // Set window/level
  setInvert,            // Toggle invert
  resetCamera,          // Reset view
  getCurrentImage,      // Get current image
} = useCornerstoneViewport('VIEWPORT_ID');
```

### useDicomLoader

```jsx
const {
  dicomFiles,           // Array of loaded files
  imageIds,             // Cornerstone image IDs
  isLoading,            // Loading state
  error,                // Error state
  currentImageIndex,    // Current slice index
  loadFiles,            // Load new files
  nextImage,            // Go to next slice
  previousImage,        // Go to previous slice
  goToImage,            // Go to specific slice
} = useDicomLoader();
```

### useToolManager

```jsx
const {
  activeTool,           // Currently active tool name
  isInitialized,        // Initialization status
  initializeTools,      // Initialize tool group
  setTool,              // Change active tool
  addViewport,          // Add viewport to tool group
  getToolGroup,         // Get tool group instance
} = useToolManager('TOOL_GROUP_ID');
```

### useMeasurements

```jsx
const {
  measurements,         // Array of measurements
  clearMeasurements,    // Clear all measurements
  removeMeasurement,    // Remove specific measurement
  exportMeasurements,   // Export to JSON
} = useMeasurements(viewportElement, getCurrentImage, toolGroupId);
```

## 🎨 Styling

The application uses Tailwind CSS for styling with a dark medical theme:
- Primary: Blue (#3B82F6)
- Background: Slate gradient
- Text: White/Slate shades
- Accents: Blue/Red/Green

## 📦 Dependencies

- **React 18.3+** - UI framework
- **@cornerstonejs/core** - DICOM image rendering
- **@cornerstonejs/tools** - Medical imaging tools
- **@cornerstonejs/dicom-image-loader** - DICOM file loading
- **dicom-parser** - DICOM data parsing
- **JSZip** - ZIP file extraction
- **Tailwind CSS** - Styling framework

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🎯 Keyboard Shortcuts

- **↑ / ←** - Previous slice
- **↓ / →** - Next slice
- **Mouse Wheel** - Scroll through slices

## 📝 Measurement Data Structure

```javascript
{
  id: "annotation-uuid",
  type: "Length" | "Rectangle Area" | "Ellipse Area" | "Angle",
  value: 123.45,
  unit: "mm" | "mm²" | "°",
  formatted: "123.45 mm",
  // For area measurements:
  area: 1234.56,
  volume: 12345.67,
  mean: 100.5,
  stdDev: 25.3,
  min: 50,
  max: 150,
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

## 🔍 Advanced Features

### Window/Level Presets

Pre-configured presets for different tissue types:
- **Abdomen**: W:400, C:50
- **Bone**: W:2000, C:300
- **Brain**: W:80, C:40
- **Lung**: W:1500, C:-600
- **Mediastinum**: W:350, C:50
- **Soft Tissue**: W:400, C:40

### Measurement Statistics

For ROI measurements, the viewer calculates:
- **Mean intensity** - Average pixel value in ROI
- **Standard deviation** - Variation in pixel values
- **Min/Max** - Range of pixel values
- **Area** - ROI area in mm²
- **Volume** - Estimated volume using slice thickness

## 🐛 Troubleshooting

**Issue**: Images not loading
- Ensure DICOM files are valid
- Check browser console for errors
- Try uploading files individually

**Issue**: Measurements not calculating
- Verify pixel spacing exists in DICOM metadata
- Check that the correct tool is selected
- Ensure the measurement is complete

**Issue**: Tools not working
- Click the tool button to activate it
- Ensure an image is loaded
- Try resetting the view

## 📄 License

This project is part of a DICOM viewer application.

