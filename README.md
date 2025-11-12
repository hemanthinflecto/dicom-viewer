# DICOM Medical Imaging Viewer with AI Analysis

A modern web application for viewing DICOM medical scans with AI-powered analysis using OpenAI's Vision API.

## 🏗️ Architecture

### Frontend (React + Vite + Tailwind CSS)
- **OHIF/Cornerstone.js** for DICOM rendering
- Modern UI with Tailwind CSS
- Real-time slice capture and analysis
- Responsive design

### Backend (Node.js + Express)
- RESTful API for image analysis
- OpenAI GPT-4 Vision integration
- Secure file handling with Multer
- CORS-enabled for local development

## 📋 Features

✅ Upload and view DICOM (.dcm) files
✅ Interactive medical image viewer powered by Cornerstone.js
✅ Capture current slice as PNG
✅ AI-powered medical image analysis
✅ Structured insights (findings, observations, recommendations)
✅ Beautiful, modern UI with dark theme
✅ Responsive design for all screen sizes

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dicom-viewer
```

#### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file from template
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-api-key-here
```

#### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

### Running the Application

#### Start Backend Server (Terminal 1)

```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run on: `http://localhost:3001`

#### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

### 🧪 Testing the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Upload Scan" and select a DICOM (.dcm) file
3. The image will be displayed in the DICOM viewer
4. Click "Analyze Current Slice" to get AI-powered insights
5. View the analysis results in the left panel

## 📁 Project Structure

```
dicom-viewer/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── backend/
│   ├── server.js            # Express server
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
└── README.md
```

## 🔧 API Endpoints

### Backend API

#### `POST /api/analyze`
Analyze a medical image slice using OpenAI Vision API

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (PNG file)

**Response:**
```json
{
  "success": true,
  "findings": "Description of the scan",
  "observations": [
    "Key observation 1",
    "Key observation 2"
  ],
  "recommendations": "Clinical recommendations",
  "disclaimer": "AI-generated analysis disclaimer"
}
```

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

## 🎨 Tech Stack

### Frontend
- **React 18.3** - UI library
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Cornerstone.js 1.80** - Medical imaging rendering
- **DICOM Image Loader** - DICOM file parsing

### Backend
- **Node.js** - Runtime environment
- **Express 4.21** - Web framework
- **OpenAI API 4.73** - AI analysis
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## ⚙️ Configuration

### Environment Variables (Backend)

Create a `.env` file in the `backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

### OpenAI API Key

1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to [API Keys](https://platform.openai.com/api-keys)
3. Create a new API key
4. Add it to your `.env` file

**Note:** OpenAI API usage is billed. Check [OpenAI Pricing](https://openai.com/pricing) for current rates.

## 🔐 Security Notes

- Never commit `.env` files to version control
- Keep your OpenAI API key secure
- The backend automatically cleans up uploaded files after analysis
- Add rate limiting for production deployments
- Implement authentication for production use

## 📝 Sample DICOM Files

You can find sample DICOM files for testing from:
- [Medical Connections DICOM Library](https://www.medicalconnections.co.uk/kb/DICOM-Library/)
- [Osirix DICOM Sample Images](https://www.osirix-viewer.com/resources/dicom-image-library/)
- [TCIA (The Cancer Imaging Archive)](https://www.cancerimagingarchive.net/)

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend is running on port 3001
- Check CORS configuration in `server.js`

### DICOM File Not Loading
- Ensure the file is a valid DICOM (.dcm) file
- Check browser console for errors
- Verify file size is reasonable (<100MB)

### OpenAI API Errors
- Verify your API key is correct in `.env`
- Check your OpenAI account has credits
- Ensure you have access to GPT-4 Vision API

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Production Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the 'dist' folder
```

### Backend (Heroku/Railway/Render)
```bash
cd backend
# Ensure environment variables are set in your hosting platform
# Deploy following your platform's guidelines
```

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This application is for **educational and demonstration purposes only**. The AI-generated analysis should **never** be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical imaging interpretation.

## 📧 Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using React, Node.js, and OpenAI
