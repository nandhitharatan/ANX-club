import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const searchSchema: Schema = {
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

export async function generateSemanticSearch(queryStr: string) {
  if (!ai) {
    console.warn("⚠️ Gemini API key is missing. Skipping AI semantic search.");
    return { actions: [] };
  }

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

The user searched for: "${queryStr}"

Based on their intent, suggest 1 to 3 relevant actions they can take on the platform. If their search is nonsense or unrelated, return an empty list of actions.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: searchSchema,
      temperature: 0.2
    }
  });

  const text = response.text;
  return text ? JSON.parse(text) : { actions: [] };
}

export async function generateChatReply(message: string, history: Array<{ role: string, text: string }>) {
  if (!ai) {
    return "My AI brain isn't connected yet! Please add a GEMINI_API_KEY to your environment variables.";
  }

  const formattedHistory = (history || []).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: "System Prompt: You are a helpful AI assistant for an online professional community platform that features Mentorship Booking, Event Registration, and Project Collabs. Be concise, polite, and helpful.\n\n" }]
      },
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ]
  });

  return response.text || "I'm not sure what to say.";
}
