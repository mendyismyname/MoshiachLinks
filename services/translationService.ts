
import { GoogleGenAI } from "@google/genai";
import { storageService } from "./storageService";

export const translationService = {
  /**
   * Translates scholarly Hebrew content to English.
   * Maintains HTML formatting and respects configured tone/complexity.
   */
  translateToEnglish: async (hebrewHtml: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const settings = storageService.getSettings();
    
    const toneInstructions = {
      scholarly: "scholarly and academic",
      literal: "precise and literal",
      modern: "contemporary and accessible"
    };

    const complexityInstructions = {
      detailed: "Ensure all nuances and cross-references are maintained.",
      concise: "Keep the translation direct and avoid redundant philosophical terminology."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following Hebrew content into clear, ${toneInstructions[settings.translationTone || 'scholarly']} English. 
                 The content is related to Jewish theology, Chassidic philosophy, and the concepts of Redemption (Geulah) and Moshiach.
                 
                 RULES:
                 1. Maintain all HTML tags (like <p>, <strong>, <h1>) in their exact positions. 
                 2. Use formal English suitable for religious studies.
                 3. ${complexityInstructions[settings.translationComplexity || 'detailed']}
                 4. Retain specific transliterated terms like 'Moshiach', 'Geulah'.
                 
                 Source Hebrew Content:
                 ${hebrewHtml}`,
      config: {
        systemInstruction: "You are an expert translator specializing in translating complex Hebrew theological texts into sophisticated English.",
        temperature: 0.2,
      },
    });

    return response.text || '';
  }
};
