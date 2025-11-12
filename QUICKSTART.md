# Quick Start Guide for Hamad

## 🎯 What You've Got

A complete DICOM medical imaging viewer with AI analysis:
- **Frontend**: Modern React app with OHIF/Cornerstone viewer
- **Backend**: Node.js API that connects to OpenAI Vision
- **Features**: Upload DICOM files, view them, and get AI analysis

## 📦 File Structure

```
dicom-viewer/
├── frontend/               # React Application
│   ├── src/
│   │   ├── App.jsx        # Main UI component (OHIF viewer + controls)
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Tailwind styles
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite configuration
│   └── index.html         # HTML template
│
├── backend/               # Node.js Server
│   ├── server.js         # Express server + OpenAI integration
│   ├── package.json      # Backend dependencies
│   └── .env.example      # Environment variables template
│
├── README.md             # Full documentation
└── setup.sh              # Quick setup script
```

## 🚀 Quick Setup (5 minutes)

### Option 1: Automatic Setup
```bash
cd dicom-viewer
./setup.sh
```

### Option 2: Manual Setup

**Step 1: Backend Setup**
```bash
cd dicom-viewer/backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-your-key-here
```

**Step 2: Frontend Setup**
```bash
cd ../frontend
npm install
```

## ▶️ Running the App

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

## 🔑 Getting OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it in `backend/.env` file:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

## 🧪 Testing

1. Open browser: `http://localhost:3000`
2. Click "Upload Scan" button
3. Select a `.dcm` DICOM file
4. Image appears in the viewer
5. Click "Analyze Current Slice"
6. AI analysis appears in the left panel

## 📥 Getting Sample DICOM Files

- https://www.medicalconnections.co.uk/kb/DICOM-Library/
- https://www.osirix-viewer.com/resources/dicom-image-library/

## 🎨 Customization Ideas

### Frontend (App.jsx)
- Add more viewer controls (zoom, pan, windowing)
- Add multi-slice navigation
- Customize the color scheme
- Add export functionality

### Backend (server.js)
- Customize the AI prompt for different analysis types
- Add more analysis endpoints
- Implement user authentication
- Add result caching

## 🔧 Key Technologies

**Frontend:**
- React 18.3 - UI framework
- Vite 5.4 - Super fast build tool
- Tailwind CSS - Utility-first styling
- Cornerstone.js - Medical image rendering
- DICOM Image Loader - Parse DICOM files

**Backend:**
- Express - Web server
- Multer - File uploads
- OpenAI API - GPT-4 Vision for analysis

## 💡 How It Works

1. **User uploads DICOM** → Frontend receives file
2. **Cornerstone renders** → Medical image displayed
3. **User clicks Analyze** → Frontend captures current slice as PNG
4. **PNG sent to backend** → Express receives image
5. **Backend calls OpenAI** → GPT-4 Vision analyzes image
6. **Analysis returned** → Frontend displays structured results

## 🐛 Common Issues

**"Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**CORS error**
- Make sure backend is running on port 3001
- Check backend console for errors

**DICOM not loading**
- Verify file is valid .dcm format
- Check browser console (F12) for errors

**OpenAI error**
- Verify API key in .env
- Check you have credits in OpenAI account
- Ensure GPT-4 Vision access

## 📞 Need Help?

Check the full README.md for detailed documentation.

## 🎓 Learning Resources

- React: https://react.dev/
- Vite: https://vitejs.dev/
- Tailwind: https://tailwindcss.com/
- Cornerstone.js: https://www.cornerstonejs.org/
- OpenAI API: https://platform.openai.com/docs/

---

**Ready to build something amazing! 🚀**
