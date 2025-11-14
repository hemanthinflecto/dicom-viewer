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
app.use(cors());
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `You are a medical imaging evaluation model trained to interpret MRI scans using RECIST 1.1 (Response Evaluation Criteria in Solid Tumors).

Your task is to analyze the given MRI slice and provide findings aligned to RECIST interpretation rules.

RECIST 1.1 RULES YOU MUST FOLLOW:

**Tumor Classification:**
- Target Lesion (TL): Solid tumor measurable ≥10 mm longest diameter (≥15 mm short-axis for lymph nodes)
- Non-Target Lesion (NTL): <10 mm, poorly defined, or bone lesions without soft-tissue component
- Lymph Nodes: ≥15 mm short-axis = TL; 10-14 mm = NTL; <10 mm = normal

**Measurement Rules:**
- Solid lesions: report longest diameter (LD)
- Lymph nodes: report short-axis diameter (SAD)
- Only slice available: note measurements are approximate

**Response Evaluation (if comparison exists):**
- CR (Complete Response): All TL disappear; lymph nodes <10 mm
- PR (Partial Response): ≥30% decrease in sum of TL diameters
- SD (Stable Disease): Neither PR nor PD criteria met
- PD (Progressive Disease): ≥20% increase in TL sum OR new lesions

**Always Provide:**
1. Region/Organ Identified
2. Lesion Identification (Target vs Non-Target using RECIST rules)
3. Measurements (mm) with RECIST classification reasoning
4. Findings/Interpretation
5. RECIST Response Assessment (or "Baseline only - cannot classify response")
6. Clinical Risks/Concerns
7. Confidence Score (High/Medium/Low)
8. Notes on whether full series review is needed

Format response as structured JSON with these exact fields.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Perform RECIST 1.1 evaluation of this MRI slice:
- File: ${fileName || 'Unknown'}
- Slice: ${sliceIndex + 1} of ${totalSlices}
- Scan Region: Infer from visible anatomy (Brain/Liver/Abdomen/Chest/Pelvis/Spine)
- Previous Scan: Not available (BASELINE ASSESSMENT)

Analyze according to RECIST 1.1 criteria and provide structured findings.`
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
      region_organ: parsedResult?.region_organ_identified || parsedResult?.['region/organ_identified'] || 'Not determined',
      lesion_identification: parsedResult?.lesion_identification || parsedResult?.['lesion_identification_using_recist_1.1'] || 'No lesions detected',
      measurements: parsedResult?.measurements || parsedResult?.['measurements_(mm)_with_recist_classification_reasoning'] || 'N/A',
      findings: parsedResult?.findings || parsedResult?.['findings_/_interpretation'] || 'No significant findings',
      recist_response: parsedResult?.recist_response || parsedResult?.['recist_response_assessment'] || 'Baseline assessment only - cannot classify response',
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
  console.log('✅ Ready for DICOM analysis with OpenAI GPT-4 Vision');
});

export default app;
