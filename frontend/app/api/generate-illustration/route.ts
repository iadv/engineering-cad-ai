import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt, viewType } = await request.json();

    if (!prompt || !viewType) {
      return NextResponse.json(
        { error: 'Prompt and viewType are required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Craft professional engineering illustration prompt based on view type
    const viewPrompts: Record<string, string> = {
      isometric: `Create a professional isometric 3D technical illustration of: ${prompt}. Style: Clean engineering diagram with precise lines, professional CAD-style rendering, technical details visible, white background, high quality.`,
      sketch: `Create a professional engineering sketch illustration of: ${prompt}. Style: Hand-drawn technical sketch with dimension lines, annotations, clean linework, engineering blueprint aesthetic, white background.`,
      front: `Create a professional front view technical illustration of: ${prompt}. Style: Orthographic engineering view, precise dimensions, technical drawing style, clean lines, white background, CAD rendering quality.`,
      top: `Create a professional top view technical illustration of: ${prompt}. Style: Orthographic engineering view from above, technical drawing style, dimension lines, clean CAD aesthetic, white background.`,
      render: `Create a professional photorealistic 3D rendering of: ${prompt}. Style: High-quality engineering visualization, realistic materials, professional lighting, technical accuracy, studio background.`
    };

    const fullPrompt = viewPrompts[viewType] || viewPrompts.isometric;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: fullPrompt,
    });

    // Extract image from response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        
        return NextResponse.json({
          success: true,
          image: imageData, // Base64 encoded image
          viewType,
        });
      }
    }

    return NextResponse.json(
      { error: 'No image generated' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('Gemini illustration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate illustration' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

