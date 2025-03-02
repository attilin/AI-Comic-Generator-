import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ComicPanel {
  prompt: string;
  caption: string;
}

interface StoryResponse {
  comics: ComicPanel[];
}

// Update the client configuration to use GITHUB_API_KEY
const client = new OpenAI({
  apiKey: process.env.GITHUB_API_KEY || '',  // Provide empty string as fallback
  baseURL: 'https://models.inference.ai.azure.com'
});

export async function POST(req: Request) {
  try {
    // Check if API key is available
    if (!process.env.GITHUB_API_KEY) {
      throw new Error('GitHub API key is not configured');
    }

    const { prompt } = await req.json();

    // Debug log for API key (safely)
    console.log('Azure API Key exists:', !!process.env.AZURE_API_KEY);
    console.log('Azure API Key length:', process.env.AZURE_API_KEY?.length);

    const systemPrompt = `
    Create a 3-panel comic story about a cat's adventure. For each panel, provide:
    1. An image generation prompt that includes 'YuRi_cat' and 'white and orange tabby' and ends with 'cute cartoon style, vivid colors'
    2. A caption that refers to the cat as 'Yuri'

    Format the output as JSON with this structure:
    {
        "comics": [
            {
                "prompt": "Image generation prompt here",
                "caption": "Caption text here"
            }
        ]
    }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from API');
    }

    const storyJson = JSON.parse(content) as StoryResponse;
    
    // Check if Replicate token is available
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token is not configured');
    }

    // Generate images for each panel
    const panels = await Promise.all(storyJson.comics.map(async (panel: ComicPanel) => {
      const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "0501ddd5b8e85e344aa9447116fb81347b7f3ce86597055ba0794fb45db2e78c",
          input: {
            prompt: panel.prompt,
            num_inference_steps: 4,
            guidance_scale: 7.5,
            model: "schnell"
          }
        }),
      });

      return await replicateResponse.json();
    }));

    return NextResponse.json({
      story: storyJson,
      predictions: panels
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate comic' },
      { status: 500 }
    );
  }
} 