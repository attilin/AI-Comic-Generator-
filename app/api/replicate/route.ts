import { NextResponse } from 'next/server';

interface ReplicateError {
  message: string;
  stack?: string;
  name?: string;
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);
    
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    // Log token info (safely)
    console.log('Token exists:', !!process.env.REPLICATE_API_TOKEN);
    console.log('Token starts with:', process.env.REPLICATE_API_TOKEN.substring(0, 3));
    console.log('Token length:', process.env.REPLICATE_API_TOKEN.length);

    // Using the complete version ID
    const requestBody = {
      version: "0501ddd5b8e85e344aa9447116fb81347b7f3ce86597055ba0794fb45db2e78c",
      input: { prompt }
    };
    console.log('Request body:', requestBody);

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const responseData = await response.json();
    console.log('Full response data:', responseData);

    if (!response.ok) {
      console.error('Error details:', responseData);
      throw new Error(responseData.detail || 'Failed to generate prediction');
    }

    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Full error object:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || "Error processing your request" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get('id');

    if (!predictionId) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();

    return NextResponse.json(prediction);
  } catch (error) {
    const err = error as ReplicateError;
    console.error('Full error object:', {
      message: err.message || 'Unknown error',
      stack: err.stack,
      name: err.name
    });
    
    return NextResponse.json(
      { error: err.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 