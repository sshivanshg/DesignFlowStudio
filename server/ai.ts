import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DesignInsightRequest {
  projectDescription: string;
  clientPreferences?: string;
  budget?: string;
  roomType?: string;
  stylePreferences?: string;
}

export interface DesignInsightResponse {
  suggestions: string[];
  colorPalette: string[];
  materialSuggestions: string[];
  estimatedTimeframe: string;
  budgetBreakdown?: {
    furniture: number;
    materials: number;
    labor: number;
    accessories: number;
    total: number;
  };
}

export async function generateDesignInsights(
  request: DesignInsightRequest
): Promise<DesignInsightResponse> {
  try {
    const prompt = `
As an expert interior designer, provide comprehensive design insights based on the following project details:

Project Description: ${request.projectDescription}
${request.clientPreferences ? `Client Preferences: ${request.clientPreferences}` : ''}
${request.budget ? `Budget: ${request.budget}` : ''}
${request.roomType ? `Room Type: ${request.roomType}` : ''}
${request.stylePreferences ? `Style Preferences: ${request.stylePreferences}` : ''}

Please provide a JSON response with the following structure:
{
  "suggestions": [5 specific design recommendations based on the project details],
  "colorPalette": [5 specific color hex codes that would work well together],
  "materialSuggestions": [5 specific material recommendations with brief explanations],
  "estimatedTimeframe": "Realistic project timeframe considering the scope",
  "budgetBreakdown": {
    "furniture": estimated furniture cost,
    "materials": estimated materials cost,
    "labor": estimated labor cost,
    "accessories": estimated accessories and finishing touches,
    "total": total estimated cost
  }
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in the OpenAI response");
    }

    return JSON.parse(content) as DesignInsightResponse;
  } catch (error: any) {
    console.error("Error generating design insights:", error);
    throw new Error(`Failed to generate design insights: ${error.message || String(error)}`);
  }
}

export async function analyzeClientFeedback(
  feedback: string
): Promise<{ sentimentScore: number; keyPoints: string[]; suggestedResponse: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert interior design consultant analyzing client feedback. Extract the sentiment, key points, and suggest a professional response.",
        },
        {
          role: "user",
          content: `Analyze this client feedback for an interior design project: "${feedback}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in the OpenAI response");
    }

    return JSON.parse(content) as {
      sentimentScore: number;
      keyPoints: string[];
      suggestedResponse: string;
    };
  } catch (error: any) {
    console.error("Error analyzing client feedback:", error);
    throw new Error(`Failed to analyze client feedback: ${error.message || String(error)}`);
  }
}

export async function generateMoodboardSuggestions(
  style: string,
  colors: string[],
  roomType: string
): Promise<{ imagePrompts: string[]; textSuggestions: string[] }> {
  try {
    const prompt = `
As an interior design expert, create a moodboard concept for a ${roomType} with a ${style} style and these colors: ${colors.join(', ')}.

Please provide a JSON response with:
1. Five detailed image prompts that could be used to generate images for this moodboard
2. Five text suggestions describing key elements to include in the moodboard

Format your response as:
{
  "imagePrompts": [5 detailed image generation prompts],
  "textSuggestions": [5 text descriptions of key elements]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in the OpenAI response");
    }

    return JSON.parse(content) as {
      imagePrompts: string[];
      textSuggestions: string[];
    };
  } catch (error: any) {
    console.error("Error generating moodboard suggestions:", error);
    throw new Error(`Failed to generate moodboard suggestions: ${error.message || String(error)}`);
  }
}