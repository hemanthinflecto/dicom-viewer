import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

app.post('/api/perplexity/analyze', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(500).json({
        error: 'Missing API key',
        message: 'PERPLEXITY_API_KEY is not configured on the server'
      });
    }

    if (!imageBase64) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'imageBase64 field is required'
      });
    }

    const body = {
      model: 'pplx-vision',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert radiologist assisting with medical imaging interpretation. Provide concise description and likely diagnostic considerations for the provided scan. Include clear professional disclaimers.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Analyze this medical imaging slice and provide: 1) A concise description of notable anatomy or findings, 2) Differential diagnosis or key diagnostic considerations. Reply in valid JSON with fields: description, diagnosis, disclaimer.'
            },
            {
              type: 'image_url',
              image_url: `data:image/jpeg;base64,${imageBase64}`
            }
          ]
        }
      ],
      temperature: 0.2
    };

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'perplexity_request_failed',
        message: 'Failed to fetch analysis from Perplexity API',
        details: errorText
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    let parsedResult = null;

    if (typeof content === 'string') {
      try {
        parsedResult = JSON.parse(content);
      } catch (err) {
        parsedResult = {
          description: content,
          diagnosis:
            'No structured diagnosis provided. Please review the description manually.',
          disclaimer:
            'This AI-generated information is for educational purposes only and must not be used for clinical decision making.'
        };
      }
    } else {
      parsedResult = content;
    }

    res.json({
      success: true,
      description: parsedResult?.description || 'No description provided.',
      diagnosis:
        parsedResult?.diagnosis ||
        'No diagnostic considerations returned by the model.',
      disclaimer:
        parsedResult?.disclaimer ||
        'This AI-generated information is for educational purposes only. Always consult qualified medical professionals for diagnosis and treatment.'
    });
  } catch (error) {
    console.error('Perplexity analysis error:', error);
    res.status(500).json({
      error: 'perplexity_analysis_failed',
      message: error.message || 'Unexpected server error while querying Perplexity.'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`✨ Perplexity endpoint: http://localhost:${PORT}/api/perplexity/analyze`);
});

export default app;
