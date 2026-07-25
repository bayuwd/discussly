import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fsPromises from "fs/promises";
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

    let zai;
    try {
      const envApiKey = process.env.ZAI_API_KEY || process.env.NEXT_PUBLIC_ZAI_API_KEY;
      if (envApiKey) {
        // Bypass ZAI.create() which strictly requires a local file and use the constructor directly
        zai = new (ZAI as any)({
          baseUrl: process.env.ZAI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
          apiKey: envApiKey
        });
      } else {
        // Fallback to local .z-ai-config file when running locally
        zai = await ZAI.create();
      }
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const systemPrompt = 
      "You are a creative discussion topic generator. The user will provide a keyword or subject. " +
      "Generate exactly ONE engaging, thought-provoking discussion question or topic based on it. " +
      "Return ONLY a valid JSON object with the following schema (do not include any markdown formatting like ```json):\n" +
      "{\n" +
      "  \"text\": \"The discussion topic text\",\n" +
      "  \"spiciness\": 2, // An integer between 0 and 3 indicating how controversial/spicy it is (0=mild, 3=spicy)\n" +
      "  \"tags\": [\"tag1\", \"tag2\"] // Up to 3 relevant single-word lowercase tags\n" +
      "}";

    const originalFetch = global.fetch;
    let response;
    try {
      global.fetch = async (url, options) => {
        console.log("SDK FETCH URL:", url);
        if (options && typeof options.body === "string") {
          try {
            const parsed = JSON.parse(options.body);
            if (parsed.thinking !== undefined) {
              delete parsed.thinking;
              options.body = JSON.stringify(parsed);
            }
          } catch (e) {}
        }
        return originalFetch(url, options);
      };

      response = await zai.chat.completions.create({
        model: "gemini-flash-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      });
    } finally {
      global.fetch = originalFetch;
    }

    const aiText = response.choices?.[0]?.message?.content?.trim();

    if (!aiText) {
      throw new Error("No response from AI");
    }

    let parsedResult;
    try {
      // Remove any markdown formatting just in case
      const cleanedText = aiText.replace(/```json\n?|\n?```/g, '');
      parsedResult = JSON.parse(cleanedText);
    } catch (e) {
      // Fallback if parsing fails
      parsedResult = {
        text: aiText,
        spiciness: 1,
        tags: ["ai"]
      };
    }

    return NextResponse.json({
      topic: {
        id: uuidv4(),
        text: parsedResult.text || "Could not parse topic",
        category: "ai-generated", // using a pseudo category
        source: "ai",
        spiciness: parsedResult.spiciness || 0,
        tags: parsedResult.tags || [],
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
