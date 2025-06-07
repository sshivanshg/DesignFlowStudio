import OpenAI from "openai";
import 'dotenv/config'

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

export interface SmartEstimateRequest {
  projectType: string; // residential, commercial, etc.
  roomTypes: string[]; // kitchen, bathroom, living room, etc.
  squareFootage: number;
  scope: string; // description of the project
  quality: string; // basic, standard, premium, luxury
  location: string; // city or region (optional)
  timeline: string; // desired timeline (optional)
}

export interface SmartEstimateResponse {
  totalEstimate: number;
  breakdown: {
    design: number;
    materials: number;
    labor: number;
    furniture: number;
    fixtures: number;
    accessories: number;
    management: number;
  };
  lineItems: Array<{
    category: string;
    name: string;
    description: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }>;
  timeEstimate: {
    designPhase: string;
    procurementPhase: string;
    implementationPhase: string;
    totalTimeframe: string;
  };
  recommendations: string[];
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

/**
 * Generates a smart, AI-powered estimate for an interior design project
 * This uses current market rates and design best practices to create 
 * a comprehensive and accurate estimate with line items and recommendations
 */
export async function generateSmartEstimate(
  request: SmartEstimateRequest
): Promise<SmartEstimateResponse> {
  try {
    const prompt = `
As an expert interior designer with extensive knowledge of project costs and timelines, create a detailed 
estimate for the following interior design project:

Project Type: ${request.projectType}
Room Types: ${request.roomTypes.join(', ')}
Square Footage: ${request.squareFootage} sq ft
Quality Level: ${request.quality}
Project Scope: ${request.scope}
${request.location ? `Location: ${request.location}` : ''}
${request.timeline ? `Desired Timeline: ${request.timeline}` : ''}

Please provide a JSON response with a comprehensive estimate including:

1. A total project cost estimate
2. A detailed cost breakdown by category (design, materials, labor, furniture, fixtures, accessories, project management)
3. Detailed line items for major components with unit prices and quantities
4. Time estimates for each phase and overall project duration
5. 3-5 professional recommendations for cost optimization or enhancements

Format your response exactly as follows:
{
  "totalEstimate": total estimate in USD as a number (no currency symbols or commas),
  "breakdown": {
    "design": design fees in USD as a number,
    "materials": materials cost in USD as a number,
    "labor": labor cost in USD as a number,
    "furniture": furniture cost in USD as a number,
    "fixtures": fixtures cost in USD as a number,
    "accessories": accessories cost in USD as a number,
    "management": project management cost in USD as a number
  },
  "lineItems": [
    {
      "category": category name,
      "name": item name,
      "description": brief description,
      "unitPrice": unit price in USD as a number,
      "quantity": quantity as a number,
      "total": total price in USD as a number
    },
    ...more line items
  ],
  "timeEstimate": {
    "designPhase": design phase timeframe as string (e.g., "2-3 weeks"),
    "procurementPhase": procurement phase timeframe as string,
    "implementationPhase": implementation phase timeframe as string,
    "totalTimeframe": total project timeframe as string
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

It's critical that all numerical values are provided as numbers without currency symbols, commas, or other formatting.
Ensure all calculations are accurate and the breakdown sums match the total estimate.
Base your estimates on current market rates for ${request.location || "the average US market"}.
Line items should cover all major expenses a client would expect in a professional estimate.
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

    return JSON.parse(content) as SmartEstimateResponse;
  } catch (error: any) {
    console.error("Error generating smart estimate:", error);
    throw new Error(`Failed to generate smart estimate: ${error.message || String(error)}`);
  }
}