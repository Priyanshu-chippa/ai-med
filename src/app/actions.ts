
"use server"

import { generateMedicalAdvice, type GenerateMedicalAdviceInput, type GenerateMedicalAdviceOutput } from "@/ai/flows/generate-medical-advice";

export async function getAIResponse(
  symptoms: string,
  imageUri?: string
  // TODO: Add history parameter when ready: history?: Array<{ role: 'user' | 'ai', content: string }>
): Promise<GenerateMedicalAdviceOutput | { error: string }> {
  try {
    const input: GenerateMedicalAdviceInput = { symptoms };
    if (imageUri) {
      input.imageUri = imageUri;
    }
    // if (history) {
    //   input.history = history;
    // }
    const response = await generateMedicalAdvice(input);
    
    if (!response || !response.advice) {
        return { 
            advice: "I'm sorry, I couldn't generate a response at this time. Please try again later.",
            suggestions: [],
            knowledgeCutoffAndSources: "My knowledge is based on general medical information.",
            disclaimer: "This is an AI assistant. Always consult with a healthcare professional for medical advice."
        };
    }
    return response;
  } catch (error) {
    console.error("Error calling generateMedicalAdvice:", error);
    return {
      error: "An error occurred while processing your request. Please try again.",
    };
  }
}

