# 🎬 Visual Walkthrough - Using the DICOM Viewer

## Step-by-Step User Journey

### 1️⃣ Starting the Application

**Terminal 1 - Backend:**
```bash
cd dicom-viewer/backend
npm start
```
✅ You'll see:
```
🚀 Backend server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
🔬 Analysis endpoint: http://localhost:3001/api/analyze
```

**Terminal 2 - Frontend:**
```bash
cd dicom-viewer/frontend
npm run dev
```
✅ You'll see:
```
  VITE v5.4.2  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

### 2️⃣ Opening the Application

**Browser:** Navigate to `http://localhost:3000`

**What You'll See:**

```
┌─────────────────────────────────────────────────────────────┐
│  DICOM Medical Imaging Viewer                               │
│  Upload and analyze medical scans with AI assistance        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │              │  │                                       │ │
│  │  UPLOAD      │  │                                       │ │
│  │  SCAN        │  │         DICOM VIEWER                  │ │
│  │              │  │                                       │ │
│  │  [📁 Drop]   │  │    No DICOM file loaded               │ │
│  │   here       │  │                                       │ │
│  │              │  │    Upload a .dcm file to begin        │ │
│  │              │  │                                       │ │
│  └──────────────┘  │                                       │ │
│                     │                                       │ │
│  ┌──────────────┐  │                                       │ │
│  │ ANALYSIS     │  │                                       │ │
│  │              │  │                                       │ │
│  │ [Analyze]    │  └─────────────────────────────────────┘ │
│  │   Slice      │                                           │
│  │              │                                           │
│  └──────────────┘                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 3️⃣ Uploading a DICOM File

**Action:** Click on the upload area or drag a `.dcm` file

**What Happens:**
1. File picker opens
2. Select your DICOM file (e.g., `brain_scan.dcm`)
3. Filename appears: "brain_scan.dcm"

**UI Updates:**
```
┌──────────────┐
│  UPLOAD      │
│  SCAN        │
│              │
│ 📄 brain_    │
│    scan.dcm  │
│              │
└──────────────┘
```

---

### 4️⃣ Viewing the DICOM Image

**Automatically happens after upload**

**Viewer Updates:**
```
┌─────────────────────────────────────┐
│         DICOM VIEWER                │
├─────────────────────────────────────┤
│                                     │
│     [Medical Image Display]         │
│                                     │
│     • CT/MRI scan visible           │
│     • Grayscale rendering           │
│     • Proper windowing              │
│                                     │
└─────────────────────────────────────┘
```

**Features Available:**
- ✅ Image displayed in high quality
- ✅ Proper DICOM rendering
- ✅ Canvas-based visualization

---

### 5️⃣ Analyzing the Current Slice

**Action:** Click the "Analyze Current Slice" button

**Loading State:**
```
┌──────────────┐
│ ANALYSIS     │
│              │
│ [⟳ Analyzing]│
│              │
└──────────────┘
```

**What Happens Behind the Scenes:**
1. Frontend captures current viewer canvas
2. Converts to PNG blob
3. Sends to backend API
4. Backend converts to base64
5. Calls OpenAI Vision API
6. Receives structured analysis
7. Displays results

---

### 6️⃣ Viewing AI Analysis Results

**Results Panel Appears:**
```
┌────────────────────────────────────────┐
│  AI ANALYSIS RESULTS                   │
├────────────────────────────────────────┤
│                                        │
│  Findings                              │
│  ─────────                             │
│  This appears to be a CT scan of the   │
│  head showing brain tissue with clear  │
│  visualization of anatomical           │
│  structures...                         │
│                                        │
│  Key Observations                      │
│  ─────────────────                     │
│  • Clear visualization of gray matter  │
│  • Normal ventricular system           │
│  • No obvious abnormalities visible    │
│                                        │
│  Recommendations                       │
│  ───────────────                       │
│  Professional radiologist review       │
│  recommended for clinical diagnosis... │
│                                        │
└────────────────────────────────────────┘
```

---

### 7️⃣ Analyzing Another Slice

**If Multi-Slice DICOM:**
1. Navigate to different slice (future feature)
2. Click "Analyze Current Slice" again
3. New analysis appears
4. Previous results are replaced

**Current Behavior:**
- One slice at a time
- Instant analysis (5-10 seconds)
- Structured, readable results

---

## 🎨 UI Elements Explained

### Upload Card (Left Panel)
```
┌────────────────┐
│ 📤 UPLOAD SCAN │  ← Title
├────────────────┤
│                │
│  ┌──────────┐  │
│  │ 📁 Click │  │  ← Interactive area
│  │ or drop  │  │
│  └──────────┘  │
│                │
│  filename.dcm  │  ← Shows uploaded file
│                │
└────────────────┘
```

### Analysis Button
```
┌────────────────────┐
│   💡 ANALYSIS      │  ← Section title
├────────────────────┤
│                    │
│ [Analyze Slice]    │  ← Click to analyze
│                    │
│ Idle:  [Analyze]   │
│ Active: [⟳ Analyzing]
│ Done:  [Analyze]   │
│                    │
└────────────────────┘
```

### Viewer Panel (Right Side)
```
┌─────────────────────────────┐
│    DICOM VIEWER             │
├─────────────────────────────┤
│                             │
│   Empty State:              │
│   "No DICOM file loaded"    │
│                             │
│   With Image:               │
│   [Medical Image Canvas]    │
│                             │
└─────────────────────────────┘
```

---

## 🔄 Complete Workflow

```
1. Start Servers
   ↓
2. Open Browser (localhost:3000)
   ↓
3. Upload DICOM File
   ↓
4. Image Displays Automatically
   ↓
5. Click "Analyze Slice"
   ↓
6. Loading Spinner Shows
   ↓
7. Results Appear (5-10 sec)
   ↓
8. Read AI Analysis
   ↓
9. Upload New File (Optional)
   ↓
10. Repeat Analysis
```

---

## 🎯 Expected Timings

| Action | Duration |
|--------|----------|
| Upload DICOM | 1-3 seconds |
| Render Image | Instant |
| Capture PNG | <1 second |
| API Request | 1-2 seconds |
| OpenAI Analysis | 3-7 seconds |
| Display Results | Instant |
| **Total Analysis** | **5-10 seconds** |

---

## ✅ Success Indicators

**Everything Working:**
- ✅ Upload area is clickable
- ✅ Image appears after upload
- ✅ Analyze button is enabled
- ✅ Loading spinner shows during analysis
- ✅ Results appear formatted
- ✅ No error messages

**Check Console If Issues:**
```bash
# Frontend console (Browser F12)
# Should see: "Cornerstone initialized"

# Backend console (Terminal)
# Should see: "Backend server running"
```

---

## 🎨 Color Scheme Reference

**Current Theme: Medical Dark**

```
Background:    Gradient blue/slate (professional)
Cards:         Semi-transparent slate (frosted glass)
Text:          White primary, slate-300 secondary
Buttons:       Blue-600 (professional medical)
Borders:       Subtle slate-700
Accents:       Blue-400 highlights
```

---

## 📱 Responsive Behavior

**Desktop (>1024px):**
- Side-by-side layout
- Left: Controls (1/3 width)
- Right: Viewer (2/3 width)

**Tablet (768-1024px):**
- Stacked layout
- Controls on top
- Viewer below

**Mobile (<768px):**
- Full-width stacked
- Touch-optimized controls
- Scrollable results

---

## 💡 Tips for Best Experience

1. **Use Chrome or Edge** for best compatibility
2. **Start with small DICOM files** (<50MB) for testing
3. **Check both consoles** if issues occur
4. **Wait for analysis** to complete (don't click multiple times)
5. **Test with different DICOM types** (CT, MRI, X-ray)

---

## 🎓 Understanding the Results

**Findings Section:**
- Overall description of what the AI sees
- Medical terminology used
- General observations

**Key Observations:**
- Bullet-point specific items
- Anatomical structures noted
- Potential areas of interest

**Recommendations:**
- Always includes professional review note
- General clinical guidance
- Educational disclaimers

---

This visual guide helps you understand exactly what to expect at each step! 🎉
