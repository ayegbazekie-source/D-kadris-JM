import { GoogleGenAI } from "@google/genai";

/**
 * Safe wrapper for Gemini API interactions.
 * If the API key is missing or the request fails, it returns a fallback message
 * instead of throwing errors that could break the UI.
 */
export const aiService = {
  generateContent: async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<string> => {
    // The API key must be obtained exclusively from process.env.API_KEY
    if (!process.env.API_KEY) {
      console.warn("Gemini API key is missing. AI features are disabled.");
      return "AI feature temporarily disabled: API key missing.";
    }

    try {
      // Always use the named parameter for API key as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      // Directly access .text property as per guidelines (it's a getter, not a method)
      return response.text || "AI produced an empty response.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "AI feature temporarily disabled due to a service error.";
    }
  }
};
