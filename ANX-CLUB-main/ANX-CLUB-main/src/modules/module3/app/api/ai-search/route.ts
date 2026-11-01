import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ actions: [] }, { status: 200 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "No API Key configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        actions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The title of the action (e.g., 'Find a Mentor', 'Host an Event')" },
              url: { type: Type.STRING, description: "The relative URL route for this action (e.g., '/mentors', '/events/create')" },
              description: { type: Type.STRING, description: "A short, helpful 1-sentence description of what this action does." }
            },
            required: ["name", "url", "description"]
          }
        }
      },
      required: ["actions"]
    };

    const prompt = `You are the semantic search engine for a professional community platform. 
The platform has the following main features and routes:
- /events : Browse upcoming events
- /events/create : Host a new event
- /mentors : Find and book a mentor
- /mentor-dashboard : Dashboard for mentors
- /projects/my-projects : View user's projects
- /projects/new : Create a new project
- /community/new : Create a new community post
- /profile : Edit user profile settings
- /dashboard : User's main dashboard
- /messages : User's chat messages
- /roadmaps : Learning roadmaps

The user searched for: "${query}"

Based on their intent, suggest 1 to 3 relevant actions they can take on the platform. If their search is nonsense or unrelated, return an empty list of actions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    }
    
    return NextResponse.json({ actions: [] });

  } catch (error: any) {
    console.error("AI Search API Error:", error);
    return NextResponse.json({ error: "Failed to generate search results" }, { status: 500 });
  }
}
