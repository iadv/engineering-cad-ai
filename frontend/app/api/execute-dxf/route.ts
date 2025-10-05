import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_ENDPOINT = process.env.LAMBDA_API_ENDPOINT;

export async function POST(request: NextRequest) {
  try {
    const { code, max_retries } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided', success: false }, { status: 400 });
    }

    if (!LAMBDA_ENDPOINT) {
      return NextResponse.json(
        { 
          error: 'Lambda endpoint not configured. Please set LAMBDA_API_ENDPOINT in environment variables.',
          success: false 
        },
        { status: 500 }
      );
    }

    const response = await fetch(`${LAMBDA_ENDPOINT}/execute-dxf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        max_retries: max_retries || 3
      })
    });

    if (!response.ok) {
      throw new Error(`Lambda execution failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Execute DXF error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to execute DXF code',
        success: false 
      },
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

