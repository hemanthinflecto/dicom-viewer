# DICOM Viewer - New Architecture

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                              │
│                    (Main Orchestrator)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Custom Hooks Layer                     │    │
│  │                                                     │    │
│  │  useCornerstoneViewport  useDicomLoader           │    │
│  │  useToolManager          useMeasurements          │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │              UI Components Layer                    │    │
│  │                                                     │    │
│  │  FileUploader    Toolbar    WindowLevelControls   │    │
│  │  SliceNavigator  ImageFilters  MeasurementsPanel  │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Utilities Layer                        │    │
│  │                                                     │    │
│  │  dicomUtils.js       measurementUtils.js          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
    ┌────▼────┐                      ┌──────▼──────┐
    │Cornerstone│                     │   Browser   │
    │   Core    │                     │     API     │
    └────┬────┘                       └──────┬──────┘
         │                                   │
    ┌────▼────────┐                  ┌──────▼──────┐
    │Cornerstone  │                  │   Canvas    │
    │   Tools     │                  │   WebGL     │
    └─────────────┘                  └─────────────┘
```

## 🔄 Data Flow

```
User Action
    │
    ▼
┌─────────────────┐
│  Component      │  (UI Event)
│  (e.g. Toolbar) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App.jsx        │  (Event Handler)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Custom Hook    │  (State Update)
│ (e.g. useTool)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Utility        │  (Pure Function)
│ (if needed)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cornerstone    │  (Rendering)
│  API Call       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Viewport       │  (Visual Update)
│  Re-render      │
└─────────────────┘
```

## 📦 Module Dependencies

### App.jsx Dependencies
```
App.jsx
├── hooks/
│   ├── useCornerstoneViewport
│   ├── useDicomLoader
│   ├── useToolManager
│   └── useMeasurements
├── components/
│   ├── FileUploader
│   ├── Toolbar
│   ├── WindowLevelControls
│   ├── ImageFilters
│   ├── SliceNavigator
│   └── MeasurementsPanel
└── External Libraries
    ├── @cornerstonejs/core
    ├── @cornerstonejs/tools
    ├── @cornerstonejs/dicom-image-loader
    └── dicom-parser
```

### Hook Dependencies
```
useCornerstoneViewport
└── @cornerstonejs/core

useDicomLoader
├── @cornerstonejs/dicom-image-loader
└── utils/dicomUtils

useToolManager
└── @cornerstonejs/tools

useMeasurements
├── @cornerstonejs/tools
├── utils/measurementUtils
└── utils/dicomUtils
```

### Component Dependencies
```
All Components
└── React only (no external dependencies)
```

### Utility Dependencies
```
dicomUtils.js
└── jszip

measurementUtils.js
└── None (Pure JavaScript)
```

## 🎯 Component Hierarchy

```
App
├── Header
│   ├── Title
│   └── Subtitle
│
└── Main Container
    ├── Left Sidebar
    │   ├── FileUploader
    │   ├── SliceNavigator
    │   ├── MeasurementsPanel
    │   └── Error Display
    │
    └── Main Viewer
        ├── Toolbar
        │   ├── Tool Buttons (Pan, Zoom, etc.)
        │   └── Reset Button
        │
        ├── Controls Row
        │   ├── WindowLevelControls
        │   │   ├── Width Input
        │   │   ├── Center Input
        │   │   └── Preset Selector
        │   │
        │   └── ImageFilters
        │       ├── Invert Button
        │       └── Sharpen Button
        │
        ├── Viewport Container
        │   ├── Canvas Element (ref)
        │   ├── Empty State
        │   └── Loading State
        │
        └── Info Bar
            ├── Active Tool Display
            ├── Window/Level Display
            ├── Slice Position Display
            └── Measurement Count Display
```

## 🔌 State Management

### Local State (useState)
```
App.jsx:
├── windowWidth
├── windowCenter
├── isInverted
└── error

useCornerstoneViewport:
├── isInitialized
└── error

useDicomLoader:
├── dicomFiles
├── imageIds
├── isLoading
├── error
└── currentImageIndex

useToolManager:
├── activeTool
└── isInitialized

useMeasurements:
└── measurements
```

### Refs (useRef)
```
useCornerstoneViewport:
├── viewportRef (DOM element)
└── renderingEngineRef (Cornerstone instance)

App.jsx:
└── (Uses refs from hooks)
```

## 🔄 Lifecycle Flow

### 1. Application Initialization
```
Component Mount
    │
    ▼
Initialize Cornerstone Core
    │
    ▼
Initialize DICOM Image Loader
    │
    ▼
Initialize Cornerstone Tools
    │
    ▼
Create Tool Group
    │
    ▼
Initialize Viewport
    │
    ▼
Ready for File Upload
```

### 2. File Upload Flow
```
User Selects File
    │
    ▼
Check File Type (ZIP or DICOM)
    │
    ├─(ZIP)──▶ Extract Files
    │           │
    │           ▼
    │         Get DICOM Files
    │           │
    └───────────┘
                │
                ▼
            Sort Files
                │
                ▼
        Create Image IDs
                │
                ▼
        Load into Viewport
                │
                ▼
            Render First Image
                │
                ▼
        Add Viewport to Tools
                │
                ▼
        Ready for Interaction
```

### 3. Measurement Flow
```
User Selects Tool
    │
    ▼
Tool Activated in Tool Group
    │
    ▼
User Draws on Image
    │
    ▼
ANNOTATION_ADDED Event
    │
    ▼
Get Current Image
    │
    ▼
Extract Pixel Spacing
    │
    ▼
Calculate Measurement
    │
    ▼
Update Measurements State
    │
    ▼
Display in Panel
```

### 4. Navigation Flow
```
User Action (Button/Key/Wheel)
    │
    ▼
Update currentImageIndex
    │
    ▼
useEffect Triggered
    │
    ▼
Load New Image
    │
    ▼
Apply Window/Level
    │
    ▼
Apply Filters (if active)
    │
    ▼
Render Viewport
```

## 🎨 Styling Architecture

```
index.css (Global)
├── Tailwind Base
├── Tailwind Components
└── Tailwind Utilities

Components (Inline Tailwind)
├── Layout Classes
├── Color Classes
├── Spacing Classes
├── Typography Classes
└── State Classes (hover, disabled, etc.)
```

## 🔐 Error Handling

```
Layer 1: Utility Functions
    │
    ├─▶ Try/Catch
    │   └─▶ Throw Descriptive Error
    │
    ▼
Layer 2: Hooks
    │
    ├─▶ Try/Catch
    │   └─▶ Set Local Error State
    │
    ▼
Layer 3: Components
    │
    ├─▶ Display Error State
    │
    ▼
Layer 4: App.jsx
    │
    └─▶ Global Error Display
```

## 🚀 Performance Optimizations

### 1. Code Splitting
```
React.lazy() (if needed)
├── Heavy components
└── Rarely used features
```

### 2. Memoization
```
React.memo()
├── Pure components
└── Expensive renders

useMemo()
├── Expensive calculations
└── Derived state

useCallback()
├── Event handlers
└── Function props
```

### 3. Cornerstone Optimizations
```
Web Workers
├── DICOM decoding
└── Image processing

GPU Acceleration
├── Canvas rendering
└── WebGL support

Caching
├── Image cache
└── Viewport cache
```

## 📊 Type of State

### Server State (None)
- No backend required
- All processing client-side

### Local State
- Component-specific state
- Managed with useState

### Ref State
- DOM references
- Mutable values that don't trigger re-renders

### Derived State
- Calculated from existing state
- No separate state needed

## 🔍 Testing Strategy

```
Unit Tests
├── Utilities (Pure functions)
│   ├── dicomUtils.test.js
│   └── measurementUtils.test.js
│
├── Hooks
│   ├── useCornerstoneViewport.test.js
│   ├── useDicomLoader.test.js
│   ├── useToolManager.test.js
│   └── useMeasurements.test.js
│
└── Components
    ├── FileUploader.test.jsx
    ├── Toolbar.test.jsx
    ├── WindowLevelControls.test.jsx
    └── etc.

Integration Tests
├── File upload → Display
├── Tool selection → Measurement
└── Navigation → Update

E2E Tests
├── Complete workflow
└── User scenarios
```

## 📈 Scalability Considerations

### Horizontal Scalability
- Add new tools easily
- Add new components without refactoring
- Add new utilities independently

### Vertical Scalability
- Optimize individual modules
- Replace implementations without affecting others
- Progressive enhancement

### Extensibility
```
New Feature
    │
    ▼
Add Utility (if needed)
    │
    ▼
Add/Update Hook (if needed)
    │
    ▼
Add/Update Component
    │
    ▼
Wire up in App.jsx
    │
    ▼
Done! ✅
```

## 🎯 Design Patterns Used

1. **Component Composition**: Build complex UI from simple components
2. **Custom Hooks**: Encapsulate reusable stateful logic
3. **Utility Functions**: Pure functions for calculations
4. **Separation of Concerns**: UI, logic, and data separate
5. **Single Responsibility**: Each module has one job
6. **Dependency Injection**: Pass dependencies as props
7. **Observer Pattern**: Event listeners for measurements
8. **Factory Pattern**: Creating image IDs and tool groups

## 🔄 State Updates Flow

```
User Interaction
    │
    ▼
Component Event Handler
    │
    ▼
Call Hook Function
    │
    ▼
Update State in Hook
    │
    ▼
React Re-renders
    │
    ├─▶ Update Components
    │   └─▶ UI reflects new state
    │
    └─▶ Run useEffect (if deps changed)
        └─▶ Side effects (API calls, etc.)
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Easy to test
- ✅ Easy to extend
- ✅ Easy to maintain
- ✅ Reusable code
- ✅ Type-safe (can add TypeScript easily)
- ✅ Performance optimized
- ✅ Professional structure

