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
});
export type GenerateMedicalAdviceInput = z.infer<typeof GenerateMedicalAdviceInputSchema>;

const GenerateMedicalAdviceOutputSchema = z.object({
  advice: z
    .string()
    .describe('The general medical advice or suggestions for next steps.'),
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
  prompt: `You are an AI medical assistant that provides general medical advice based on user-provided symptoms and concerns.

  Based on the following symptoms: {{{symptoms}}},
  {{#if imageUri}}Here is an image related to the symptoms: {{media url=imageUri}}{{/if}}

  provide general medical advice or suggestions for next steps (e.g., see a specialist, try over-the-counter medication). Also, include a disclaimer about seeking professional medical advice.

  Output should include the following fields:
  - advice: The general medical advice or suggestions for next steps.
  - disclaimer: A disclaimer emphasizing the importance of seeking professional medical advice.
  `,
});

const generateMedicalAdviceFlow = ai.defineFlow(
  {
    name: 'generateMedicalAdviceFlow',
    inputSchema: GenerateMedicalAdviceInputSchema,
    outputSchema: GenerateMedicalAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
