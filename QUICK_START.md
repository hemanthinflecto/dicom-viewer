# Quick Start Guide - Advanced DICOM Viewer

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Navigate to `http://localhost:3000`

## 📦 What You Need

- **Node.js** 16+ installed
- **DICOM files** (.dcm format)
- **Modern browser** (Chrome, Firefox, Safari, or Edge)

## 🎯 First-Time Usage

### 1. Upload Files
Click the upload area and select:
- A single `.dcm` file, OR
- A `.zip` file containing multiple `.dcm` files

### 2. View Your Images
- Images load automatically
- First slice displays immediately
- Use toolbar to select tools

### 3. Navigate Slices
**Multiple ways to navigate:**
- Click **Previous/Next** buttons
- Use **slider** control
- Press **↑↓** or **←→** keys
- Scroll **mouse wheel**

### 4. Take Measurements
**Select a tool:**
- 📏 **Length**: Click start → drag → click end
- ◻️ **Rectangle**: Click corner → drag → release
- ⭕ **Ellipse**: Click corner → drag → release
- 📐 **Angle**: Click point 1 → vertex → point 2

**Results show automatically** in the Measurements panel!

### 5. Adjust Image
**Window/Level:**
- Use **manual controls** (Width/Center inputs)
- Select a **preset** (Abdomen, Bone, Brain, etc.)
- Use **W/L tool** (drag on image)

**Other tools:**
- ✋ **Pan**: Drag to move image
- 🔍 **Zoom**: Drag up/down to zoom
- 🔳 **Invert**: Toggle black/white
- 🔄 **Reset**: Return to original view

## 🎨 Interface Overview

```
┌────────────────────────────────────────────┐
│  🏥 DICOM Viewer                           │
├─────────┬──────────────────────────────────┤
│         │  ┌──────────────────────────┐    │
│ Upload  │  │ Toolbar: Tools & Filters │    │
│  Area   │  ├──────────────────────────┤    │
│         │  │                          │    │
│─────────│  │                          │    │
│         │  │    Main Viewport         │    │
│  Slice  │  │                          │    │
│   Nav   │  │   (Your DICOM Image)     │    │
│         │  │                          │    │
│─────────│  ├──────────────────────────┤    │
│         │  │ Info: Tool | W/L | Slice │    │
│ Measure │  └──────────────────────────┘    │
│ -ments  │                                  │
└─────────┴──────────────────────────────────┘
```

## ⚡ Quick Tips

### Fastest Navigation
Use **keyboard arrows** or **mouse wheel** for quickest browsing!

### Best Window/Level
Try the **presets**! They're optimized for different tissues.

### Export Measurements
Click **📥 Export** in Measurements panel to save as JSON.

### Clear View
Press **🔄 Reset View** if image gets misaligned.

### Multiple Measurements
Switch between tools anytime. All measurements stay visible!

## 🎯 Common Tasks

### Task: Measure a tumor
1. Select **Rectangle** or **Ellipse** tool
2. Draw around the tumor
3. See area and volume instantly!

### Task: Measure distance
1. Select **Length** tool
2. Click start point
3. Click end point
4. Distance shown in mm!

### Task: View bone structures
1. Click **Preset** dropdown
2. Select **"Bone"**
3. Bone structures now clearly visible!

### Task: Browse all slices
1. Use **mouse wheel** to scroll
2. Or drag the **slider**
3. Or press **↓** key repeatedly

## 🐛 Troubleshooting

### Images not loading?
- ✅ Ensure files are `.dcm` format
- ✅ Check browser console (F12) for errors
- ✅ Try uploading individual files first

### Measurements not calculating?
- ✅ Ensure tool is selected (button is blue)
- ✅ Complete the measurement (don't leave it half-drawn)
- ✅ Check that DICOM has pixel spacing metadata

### Tools not working?
- ✅ Click the tool button to activate it
- ✅ Ensure an image is loaded
- ✅ Try clicking **Reset View**

### Viewer looks wrong?
- ✅ Refresh browser (F5)
- ✅ Clear browser cache
- ✅ Try different browser

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **↑** | Previous slice |
| **↓** | Next slice |
| **←** | Previous slice |
| **→** | Next slice |
| **Mouse Wheel** | Scroll slices |

## 🎓 Learn More

- **Full Feature List**: See `FEATURES.md`
- **Architecture**: See `ARCHITECTURE_NEW.md`
- **Development Guide**: See `REFACTORING_GUIDE.md`
- **API Documentation**: See `frontend/README.md`

## 🎯 Example Workflow

### Typical Radiology Review:

1. **Upload** CT scan series (ZIP file)
   - 100 slices load automatically

2. **Browse** through slices
   - Use mouse wheel
   - Look for areas of interest

3. **Adjust** Window/Level
   - Select "Lung" preset for lung scan
   - Or "Brain" for brain scan

4. **Measure** finding
   - Use Rectangle tool on lesion
   - Note area: 12.5 mm²
   - Note volume: 125 mm³

5. **Take more** measurements
   - Length of another structure
   - Angle of bone alignment

6. **Export** results
   - Click Export in Measurements panel
   - Save JSON file for records

7. **Compare** to reference
   - Load another series
   - Repeat measurements

## 🔧 Advanced Features

### Window/Level Presets
- **Abdomen**: W:400, C:50
- **Bone**: W:2000, C:300
- **Brain**: W:80, C:40
- **Lung**: W:1500, C:-600
- **Mediastinum**: W:350, C:50
- **Soft Tissue**: W:400, C:40

### Measurement Statistics
For ROI measurements, you get:
- **Area** in mm²
- **Volume** in mm³ (area × slice thickness)
- **Mean** pixel intensity
- **Std Dev** of pixel values
- **Min/Max** pixel values

### Export Format
Measurements export as JSON:
```json
{
  "type": "Rectangle Area",
  "area": 123.45,
  "areaUnit": "mm²",
  "volume": 1234.56,
  "volumeUnit": "mm³",
  "mean": 100.5,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 💡 Pro Tips

1. **Use Presets**: Faster than manual adjustment
2. **Keyboard Nav**: Much faster than clicking
3. **Export Often**: Save measurements as you go
4. **Reset View**: Fix any viewing issues instantly
5. **Multiple Tools**: Switch freely, all measurements stay
6. **Watch Info Bar**: Always see current settings

## 🎉 You're Ready!

You now know everything needed to use the DICOM viewer effectively!

### Quick Recap:
1. ✅ Upload ZIP or DICOM files
2. ✅ Navigate with keyboard/mouse/buttons
3. ✅ Select tools and draw measurements
4. ✅ Adjust window/level as needed
5. ✅ Export measurements when done

**Happy Viewing! 🏥📊🔬**

---

## 📞 Need Help?

- Check the error message (red box in sidebar)
- Look at browser console (F12 → Console)
- Review documentation files in project root
- Ensure DICOM files are valid

## 🚀 Next Steps

After mastering basics:
- Explore all measurement tools
- Try all window/level presets
- Practice keyboard shortcuts
- Export and analyze measurements
- Review `FEATURES.md` for complete capabilities

---

**Built with ❤️ for medical imaging professionals**

