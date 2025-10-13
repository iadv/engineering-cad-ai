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

    // Log prompt details
    console.log('\n' + '='.repeat(80));
    console.log('🤖 CLAUDE API CALL');
    console.log('='.repeat(80));
    console.log('📋 Type:', isCodeGen ? 'CODE GENERATION' : 'ANALYSIS/CHAT');
    console.log('🔧 Temperature:', isCodeGen ? 0.3 : 0.7);
    console.log('📊 Max Tokens:', isCodeGen ? 8000 : 4000);
    console.log('\n📝 SYSTEM PROMPT:');
    console.log('-'.repeat(80));
    console.log(systemPrompt?.substring(0, 500) + (systemPrompt?.length > 500 ? '...' : ''));
    console.log('\n💬 USER MESSAGE:');
    console.log('-'.repeat(80));
    console.log(userMessage.substring(0, 500) + (userMessage.length > 500 ? '...' : ''));
    if (errorContext) {
      console.log('\n❌ ERROR CONTEXT:');
      console.log('-'.repeat(80));
      console.log(errorContext.substring(0, 300) + (errorContext.length > 300 ? '...' : ''));
    }
    console.log('='.repeat(80) + '\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isCodeGen ? 8000 : 4000,
      temperature: isCodeGen ? 0.3 : 0.7,
      system: systemPrompt,
      messages: messages
    });

    const textBlock = message.content.find((block: any) => block.type === 'text');
    const textContent = textBlock && 'text' in textBlock ? textBlock.text : '';

    // Log response details
    console.log('✅ CLAUDE: Response received!');
    console.log('📊 Token Usage: Input:', message.usage.input_tokens, '| Output:', message.usage.output_tokens, '| Total:', message.usage.input_tokens + message.usage.output_tokens);
    console.log('📏 Response Length:', textContent.length, 'characters\n');

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
