
'use server';

/**
 * @fileOverview An AI agent that provides general medical advice based on user input.
 *
 * - generateMedicalAdvice - A function that handles the medical advice generation process.
 * - GenerateMedicalAdviceInput - The input type for the generateMedicalAdvice function.
 * - GenerateMedicalAdviceOutput - The return type for the generateMedicalAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMedicalAdviceInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms or concerns described by the user.'),
  imageUri: z
    .string()
    .optional()
    .describe(
      "Optional image related to the symptoms, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  // Placeholder for future conversation history
  // history: z.array(z.object({ role: z.enum(['user', 'ai']), content: z.string() })).optional().describe("The conversation history so far."),
});
export type GenerateMedicalAdviceInput = z.infer<typeof GenerateMedicalAdviceInputSchema>;

const GenerateMedicalAdviceOutputSchema = z.object({
  advice: z
    .string()
    .describe('The general medical advice or suggestions for next steps. This should be conversational and helpful.'),
  suggestions: z.array(z.string()).optional().describe("A few follow-up questions or suggestions for the user to consider."),
  knowledgeCutoffAndSources: z.string().describe("A brief statement about the AI's knowledge base, e.g., 'My knowledge is based on a wide range of medical texts and research up to [date]. I consult general medical knowledge similar to that found in textbooks and reputable health organizations.'"),
  disclaimer: z
    .string()
    .describe(
      'A disclaimer emphasizing the importance of seeking professional medical advice.'
    ),
});
export type GenerateMedicalAdviceOutput = z.infer<typeof GenerateMedicalAdviceOutputSchema>;

export async function generateMedicalAdvice(
  input: GenerateMedicalAdviceInput
): Promise<GenerateMedicalAdviceOutput> {
  return generateMedicalAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMedicalAdvicePrompt',
  input: {schema: GenerateMedicalAdviceInputSchema},
  output: {schema: GenerateMedicalAdviceOutputSchema},
  prompt: `You are MediMate AI, a friendly and empathetic AI medical assistant. Your goal is to provide general medical information and suggestions in a conversational manner.

  Current User Input:
  Symptoms/Concern: {{{symptoms}}}
  {{#if imageUri}}An image related to the symptoms has been provided: {{media url=imageUri}}{{/if}}

  {{#if history}}
  Conversation History (most recent last):
  {{#each history}}
  - {{role}}: {{content}}
  {{/each}}
  {{/if}}

  Based on the user's input (and image if provided):
  1.  Provide clear, general medical advice. Be empathetic and understanding.
  2.  If the user's query is a bit vague, ask a polite clarifying question as part of your advice.
  3.  Offer 2-3 relevant follow-up questions or suggestions the user might find helpful (e.g., "Have you also experienced...?", "You might want to consider tracking...", "Would you like to know more about managing...?").
  4.  Conclude with a statement about your knowledge base. For example: "My knowledge is based on a wide range of medical texts and research up to my last update. I draw on general medical understanding similar to that found in medical textbooks and reputable health information sources. I do not perform live web searches or have access to real-time information for this conversation."
  5.  ALWAYS include a standard disclaimer: "Remember, this is not a substitute for professional medical advice. Always consult a healthcare provider for diagnosis and treatment."

  Structure your response with the following fields:
  - advice: Your main conversational response and advice.
  - suggestions: (Optional) An array of 2-3 follow-up questions or suggestions.
  - knowledgeCutoffAndSources: Your statement about your knowledge base.
  - disclaimer: The standard medical disclaimer.
  `,
});

const generateMedicalAdviceFlow = ai.defineFlow(
  {
    name: 'generateMedicalAdviceFlow',
    inputSchema: GenerateMedicalAdviceInputSchema,
    outputSchema: GenerateMedicalAdviceOutputSchema,
  },
  async input => {
    // For now, we're not passing full history yet, but the prompt is ready.
    const {output} = await prompt({
      symptoms: input.symptoms,
      imageUri: input.imageUri,
      // history: input.history // Uncomment when ready to pass history
    });
    
    // Ensure default values if parts of the output are missing
    return {
        advice: output?.advice || "I'm sorry, I couldn't generate specific advice at this time. Could you try rephrasing your concern?",
        suggestions: output?.suggestions || [],
        knowledgeCutoffAndSources: output?.knowledgeCutoffAndSources || "My knowledge is based on general medical information. I do not perform live web searches.",
        disclaimer: output?.disclaimer || "This is an AI assistant. Always consult with a healthcare professional for medical advice.",
    };
  }
);

