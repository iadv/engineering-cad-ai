import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    // Use the Claude-optimized prompt directly
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    // Extract image from response
    if (!response.candidates || response.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No candidates in response' },
        { status: 500 }
      );
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      return NextResponse.json(
        { error: 'No content in response' },
        { status: 500 }
      );
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        
        return NextResponse.json({
          success: true,
          image: imageData, // Base64 encoded image
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

