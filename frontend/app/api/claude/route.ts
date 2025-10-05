import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, systemPrompt, isCodeGen, conversationHistory, errorContext } = body;

    if (!userMessage) {
      return NextResponse.json({ error: 'No user message provided' }, { status: 400 });
    }

    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: 'Claude API key not configured' }, { status: 500 });
    }

    // Call Claude API directly from Next.js
    const anthropic = new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });

    const messages: any[] = conversationHistory || [];
    
    if (errorContext) {
      messages.push({
        role: 'user',
        content: `Previous code failed with error:\n${errorContext}\n\nPlease fix the code to address this error.\n\nOriginal request: ${userMessage}`
      });
    } else {
      messages.push({
        role: 'user',
        content: userMessage
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isCodeGen ? 8000 : 4000,
      temperature: isCodeGen ? 0.3 : 0.7,
      system: systemPrompt,
      messages: messages
    });

    const textBlock = message.content.find((block: any) => block.type === 'text');
    const textContent = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({
      content: textContent,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      }
    });
  } catch (error: any) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to call Claude API' },
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
