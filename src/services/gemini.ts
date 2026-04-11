import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSchemaSuggestion(toolDescription: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a valid JSON Schema for an MCP tool based on this description: "${toolDescription}". 
      Return ONLY the JSON object, no markdown, no explanation.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schema: {
              type: Type.OBJECT,
              description: "The JSON Schema object"
            },
            explanation: {
              type: Type.STRING,
              description: "Brief explanation of the schema choices"
            }
          },
          required: ["schema", "explanation"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function troubleshootIntegration(errorLog: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze this MCP integration error and provide a technical troubleshooting guide: "${errorLog}"`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
