import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt is required" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    
    const systemPrompt = 
      "You are a creative discussion topic generator. The user will provide a keyword or subject. " +
      "Generate exactly ONE engaging, thought-provoking discussion question or topic based on it. " +
      "Do not include any extra text, markdown formatting, quotes, or conversational filler. " +
      "Just the raw question/topic text.";

    const response = await zai.chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    });

    const aiText = response.choices?.[0]?.message?.content?.trim();

    if (!aiText) {
      throw new Error("No response from AI");
    }

    return NextResponse.json({
      topic: {
        id: uuidv4(),
        text: aiText,
        category: "ai-generated", // using a pseudo category
        source: "ai",
      }
    });
  } catch (error: any) {
    console.error("AI generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate topic with AI" },
      { status: 500 }
    );
  }
}
