import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Main analysis endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log(`Analyzing image: ${req.file.filename}`);

    // Read the uploaded image file
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert medical imaging assistant analyzing a DICOM scan slice. 
              Please analyze this medical image and provide:
              1. A detailed description of what you observe
              2. Key anatomical structures visible
              3. Any notable findings or abnormalities (if visible)
              4. General recommendations for clinical review
              
              Format your response as a structured JSON with the following fields:
              - findings: string (overall description)
              - observations: array of strings (key points)
              - recommendations: string (clinical recommendations)
              
              Important: This is for educational/demonstration purposes. Always recommend professional medical review.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Parse the response
    let analysisResult;
    try {
      analysisResult = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      analysisResult = {
        findings: response.choices[0].message.content,
        observations: [],
        recommendations: "Please consult with a qualified radiologist for professional interpretation."
      };
    }

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    console.log('Analysis completed successfully');

    // Send response
    res.json({
      success: true,
      ...analysisResult,
      disclaimer: "This analysis is AI-generated and for educational purposes only. Always consult qualified medical professionals for diagnosis and treatment."
    });

  } catch (error) {
    console.error('Error during analysis:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Check if it's an OpenAI API error
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'OpenAI API error',
        message: error.response.data?.error?.message || 'Failed to analyze image',
        details: error.response.data
      });
    }

    res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Alternative endpoint using ChatGPT-4 Vision (for compatibility)
app.post('/api/analyze-vision', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log(`Analyzing image with Vision API: ${req.file.filename}`);

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this medical scan image and provide detailed observations about anatomical structures, potential findings, and recommendations. Format as JSON with fields: findings, observations (array), recommendations."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    let analysisResult;
    const content = response.choices[0].message.content;
    
    try {
      analysisResult = JSON.parse(content);
    } catch {
      analysisResult = {
        findings: content,
        observations: content.split('\n').filter(line => line.trim().length > 0),
        recommendations: "Please consult with a qualified medical professional."
      };
    }

    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      ...analysisResult,
      disclaimer: "AI-generated analysis for educational purposes only."
    });

  } catch (error) {
    console.error('Error during vision analysis:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Vision analysis failed',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔬 Analysis endpoint: http://localhost:${PORT}/api/analyze`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables!');
    console.warn('   Please create a .env file with your OpenAI API key');
  }
});

export default app;
