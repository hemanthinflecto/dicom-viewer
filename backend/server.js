import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3009;

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('[OpenAI] Initialized with API key');
} else {
  console.error('[OpenAI] ❌ OPENAI_API_KEY not set. Server cannot start.');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8000',
    'https://medicalimaging.inflectotechnologies.com',
    'https://www.medicalimaging.inflectotechnologies.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// OpenAI Vision Analysis Endpoint
app.post('/api/openai/analyze', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: 'openai_unavailable',
        message: 'OpenAI API is not configured. Please set OPENAI_API_KEY in .env'
      });
    }

    const { imageBase64, sliceIndex, totalSlices, fileName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'imageBase64 field is required'
      });
    }

    console.log('[OpenAI] Received slice for analysis');
    console.log(` - Slice: ${sliceIndex} / ${totalSlices}`);
    console.log(` - File: ${fileName || 'Unknown'}`);
    console.log(` - Payload size (base64 chars): ${imageBase64.length}`);

    // Validate image data
    if (!imageBase64 || imageBase64.length < 1000) {
      return res.status(400).json({
        error: 'invalid_image',
        message: 'Image data is empty or too small. Please ensure the DICOM image loaded correctly in the viewport.',
        region_organ: 'Unable to process',
        lesion_identification: 'No data visualized to assess lesions',
        measurements: 'N/A',
        findings: 'Image data insufficient for analysis',
        confidence_score: 'Low'
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are an expert medical imaging analyst trained to interpret medical imaging using RECIST 1.1 (Response Evaluation Criteria in Solid Tumors).

Your task is to analyze the given medical imaging slice and provide precise findings aligned to RECIST interpretation standards.

ALWAYS respond with valid JSON, even if image quality is poor or no abnormalities are found.

CRITICAL REQUIREMENTS - YOU MUST INCLUDE IN EVERY RESPONSE:

1. **REGION / ORGAN IDENTIFIED** - Identify the anatomical region visible:
   - Brain, Chest, Abdomen, Pelvis, Spine, etc.
   - Specify location if visible (e.g., "Liver - Right lobe")

2. **LESION IDENTIFICATION (RECIST 1.1)**:
   - If lesions found: Classify as Target (≥10mm) or Non-Target (<10mm)
   - If no lesions: State "No lesions or abnormalities detected"
   - Describe location and characteristics

3. **MEASUREMENTS** (in mm):
   - Provide specific measurements if lesions visible
   - Include RECIST classification reasoning
   - If no measurable lesions: State "No measurable lesions identified"

RESPONSE FORMAT - RESPOND ONLY IN VALID JSON:
{
  "region_organ_identified": "Anatomical region visible in image",
  "lesion_identification": "Lesion classification or 'No lesions detected'",
  "measurements_mm": "Measurements in mm or 'No measurable lesions'",
  "findings_interpretation": "Clinical findings",
  "recist_response_assessment": "CR/PR/SD/PD or Baseline assessment",
  "clinical_risks": "Any identified risks or concerns",
  "confidence_score": "High/Medium/Low based on image quality",
  "notes": "Additional assessment notes"
}

IMPORTANT: Always return valid JSON. If image is unclear, state that in the response.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this medical imaging slice:
- File: ${fileName || 'Unknown'}
- Slice: ${sliceIndex + 1} of ${totalSlices}
- Assessment Type: BASELINE ASSESSMENT

Please provide:
1. The anatomical region/organ visible
2. Any lesions found and their RECIST 1.1 classification
3. Measurements in millimeters if applicable
4. Clinical findings and interpretation
5. RECIST response category
6. Any clinical risks identified
7. Confidence score based on image quality

Return response as JSON only.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    console.log('[OpenAI] Raw response received');

    let parsedResult = null;

    if (typeof content === 'string') {
      try {
        parsedResult = JSON.parse(content);
      } catch (err) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            parsedResult = JSON.parse(jsonMatch[1]);
          } catch {
            parsedResult = {
              anatomical_structures: content,
              findings: 'See analysis above',
              clinical_considerations: 'Consult qualified radiologist',
              notes: 'Raw text response - see full analysis'
            };
          }
        } else {
          parsedResult = {
            anatomical_structures: 'See analysis',
            findings: content,
            clinical_considerations: 'Consult qualified radiologist',
            notes: 'AI-generated text response'
          };
        }
      }
    } else {
      parsedResult = content;
    }

    const resultPayload = {
      success: true,
      file_name: fileName || 'Unknown',
      slice_index: sliceIndex,
      total_slices: totalSlices,
      analysis_type: 'RECIST 1.1 Evaluation',
      region_organ: parsedResult?.region_organ_identified || parsedResult?.['region/organ_identified'] || parsedResult?.region || 'Not determined',
      lesion_identification: parsedResult?.lesion_identification || parsedResult?.['lesion_identification_using_recist_1.1'] || parsedResult?.lesion || 'No lesions detected',
      measurements: parsedResult?.measurements_mm || parsedResult?.measurements || parsedResult?.['measurements_(mm)_with_recist_classification_reasoning'] || 'N/A',
      findings: parsedResult?.findings_interpretation || parsedResult?.findings || parsedResult?.['findings_/_interpretation'] || 'No significant findings',
      recist_response: parsedResult?.recist_response_assessment || parsedResult?.recist_response || parsedResult?.['recist_response_assessment'] || 'Baseline assessment only - cannot classify response',
      clinical_risks: parsedResult?.clinical_risks || parsedResult?.['clinical_risks_(based_on_visible_findings)'] || 'No acute risks identified',
      confidence_score: parsedResult?.confidence_score || 'Medium',
      notes: parsedResult?.notes || 'Full series review recommended for complete assessment',
      disclaimer:
        'This AI-generated RECIST 1.1 analysis is for educational purposes only and must not be used for clinical decision-making. Always consult with qualified oncologic radiologists for official interpretations.'
    };

    console.log('[OpenAI] Parsed response:', JSON.stringify(resultPayload, null, 2));

    res.json(resultPayload);
  } catch (error) {
    console.error('[OpenAI] Analysis error:', error);
    res.status(500).json({
      error: 'openai_analysis_failed',
      message: error.message || 'Unexpected server error while querying OpenAI.',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔬 OpenAI Vision endpoint: http://localhost:${PORT}/api/openai/analyze`);
  console.log('');
  console.log('✅ Ready for DICOM analysis');
});

export default app;
