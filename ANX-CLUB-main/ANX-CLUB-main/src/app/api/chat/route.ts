import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ reply: "My AI brain isn't connected yet! Please add a GEMINI_API_KEY to the .env.local file." }, { status: 200 });
    }

    // Initialize the SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Format history for Gemini API
    const formattedHistory = (history || []).map((msg: any) => ({
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

    const reply = response.text || "I'm not sure what to say.";
    
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to generate response", details: error.message }, { status: 500 });
  }
}
