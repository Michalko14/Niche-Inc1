
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, GoalType, DashboardData } from "../types";
import { findMatchingInfluencers } from "./influencerData";

// Initialize Gemini
// NOTE: In a real production app, you should proxy this through a backend to hide the key.
// For this demo SPA, we use the env var directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

export const analyzeGoalWithGemini = async (description: string): Promise<{ recommendedGoal: GoalType, refinedGoal: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze this user's marketing goal description: "${description}". 
      1. Categorize it into one of these exact IDs: 'awareness', 'launch', 'sales', 'ugc', 'event', 'community'.
      2. Create a short, punchy "North Star" title (max 6 words) summarizing this goal professionally.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedGoal: { type: Type.STRING, enum: ['awareness', 'launch', 'sales', 'ugc', 'event', 'community'] },
            refinedGoal: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as { recommendedGoal: GoalType, refinedGoal: string };
    }
    throw new Error("No response from AI");
  } catch (e) {
    console.error("Gemini Goal Analysis Error:", e);
    return { recommendedGoal: GoalType.AWARENESS, refinedGoal: "Maximize Brand Potential" };
  }
};

export const generateFullStrategy = async (formData: FormData): Promise<DashboardData> => {
  const { businessName, industry, location, businessDescription, goal, websiteUrl, refinedGoal } = formData;
  
  const prompt = `
    Act as a world-class Influencer Marketing Strategist (like a $50k/month consultant).
    
    Client Profile:
    - Name: ${businessName}
    - Industry: ${industry}
    - Location: ${location}
    - Website: ${websiteUrl || "N/A"}
    - Description: ${businessDescription}
    - Main Goal: ${goal}
    - Specific Objective: ${refinedGoal}

    Task 1: Analyze the Brand Identity. Infer the story, mission, core values, and tone.
    Task 2: Develop a Strategy. Choose the SINGLE best social platform.
    Task 3: Define the Creator Persona. A specific description of the ideal creator's vibe, audience, and communication style (Max 25 words).
    Task 4: Expand Content Ideas. 3 distinct ideas with a Title and a Brief Description (Max 15 words each).
    
    CRITICAL CONSTRAINTS TO PREVENT INFO OVERLOAD:
    - Reasoning: MAX 25 words. Extremely concise and direct.
    - Goal Reasoning: MAX 15 words.
    - Brand Story: MAX 2 sentences.
    - Mission: MAX 1 sentence.

    Return JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: {
              type: Type.OBJECT,
              properties: {
                story: { type: Type.STRING, description: "A 2-sentence brand origin or purpose story." },
                mission: { type: Type.STRING, description: "A powerful mission statement." },
                values: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 single-word core values." },
                tone: { type: Type.STRING, description: "Description of the brand voice (e.g. 'Approachable but expert')." }
              }
            },
            strategy: {
              type: Type.OBJECT,
              properties: {
                platformName: { type: Type.STRING, enum: ["Instagram", "YouTube", "TikTok"] },
                targetRange: { type: Type.STRING, description: "e.g. '10k - 50k Followers'" },
                frequency: { type: Type.STRING, description: "e.g. '3x Posts per week'" },
                reasoning: { type: Type.STRING, description: "Why this platform/strategy fits the goal." },
                contentIdeas: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                    }
                  }, 
                  description: "3 specific content concepts with title and brief." 
                },
                northStar: { type: Type.STRING, description: "The refined goal string." },
                goalReasoning: { type: Type.STRING, description: "Why this goal matters for this stage." },
                creatorPersona: { type: Type.STRING, description: "Description of the ideal creator personality." }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("Empty response");
    
    const data = JSON.parse(response.text);
    
    // Fetch Mock Influencers based on the AI's platform decision
    const matchingCreators = findMatchingInfluencers(industry, data.strategy.platformName);

    return {
      brand: data.brand,
      strategy: data.strategy,
      creators: matchingCreators
    };

  } catch (error) {
    console.error("Gemini Strategy Generation Error:", error);
    // Fallback data if API fails
    return {
      brand: {
        story: `We simplify ${industry} for the modern world.`,
        mission: "To empower users through innovation.",
        values: ["Quality", "Trust", "Speed", "Design"],
        tone: "Professional yet accessible."
      },
      strategy: {
        platformName: "Instagram",
        targetRange: "10k - 50k",
        frequency: "3 posts / week",
        reasoning: "High engagement rates for this industry.",
        contentIdeas: [
            { title: "Unboxing Experience", description: "Highlighting the premium packaging and first impressions." },
            { title: "How-To Tutorial", description: "Demonstrating the key value proposition in 60 seconds." },
            { title: "User Testimonial", description: "Authentic stories from real users solving real problems." }
        ],
        northStar: refinedGoal,
        goalReasoning: "Building foundational trust.",
        creatorPersona: "Authentic storytellers who value aesthetics and have a high-trust relationship with their audience."
      },
      creators: findMatchingInfluencers(industry, "Instagram")
    };
  }
};
