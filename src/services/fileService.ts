import { supabase } from '../integrations/supabase/client';
// @ts-ignore
import * as mammoth from 'mammoth';
import { PLACEHOLDER_CONTENT_HEBREW, PLACEHOLDER_CONTENT_ENGLISH } from '../constants'; // Import placeholders

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper function to call Gemini API for translation
async function translateTextWithGemini(text: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Skipping translation.");
    return PLACEHOLDER_CONTENT_ENGLISH; // Return placeholder if API key is missing
  }

  const prompt = `Translate the following Hebrew text to English. Maintain HTML structure and formatting where possible. If the input is not Hebrew, return it as is:\n\n${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Gemini API error:", errorBody);
      throw new Error(`Gemini API error: ${response.status} - ${errorBody.error?.message || response.statusText}`);
    }

    const data = await response.json();
    // Extracting the text from the Gemini response structure
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return translatedText || PLACEHOLDER_CONTENT_ENGLISH; // Return placeholder if translation fails
  } catch (error) {
    console.error("Error translating with Gemini:", error);
    return PLACEHOLDER_CONTENT_ENGLISH; // Return placeholder on error
  }
}

export const fileService = {
  processFileContent: async (file: File): Promise<{ contentHtml: string; translatedContent: string }> => {
    let contentHtml = '';
    let translatedContent = '';

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ 
          arrayBuffer,
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Center'] => p.text-center:fresh",
            "p[style-name='Centered'] => p.text-center:fresh",
            "p[style-name='Normal Center'] => p.text-center:fresh",
            "p[style-name='Quote'] => blockquote:fresh",
            "r[style-name='Bold'] => strong",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "b => strong",
            "i => em"
          ]
        });
        contentHtml = result.value;
        
        // Translate the extracted HTML content
        translatedContent = await translateTextWithGemini(contentHtml);

      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        contentHtml = text
          .split(/\n\s*\n/)
          .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('');
        
        // Translate the extracted text content
        translatedContent = await translateTextWithGemini(contentHtml);

      } else {
        throw new Error("Unsupported format");
      }
      
      return { contentHtml, translatedContent };

    } catch (err) {
      console.error("File processing or translation error:", err);
      return { contentHtml: PLACEHOLDER_CONTENT_HEBREW, translatedContent: PLACEHOLDER_CONTENT_ENGLISH }; // Return placeholders on error
    }
  }
};