'use server';

/**
 * @fileOverview An AI agent to answer medical questions based on provided documents or text.
 *
 * - answerMedicalQuestion - A function that handles answering medical questions.
 * - AnswerMedicalQuestionInput - The input type for the answerMedicalQuestion function.
 * - AnswerMedicalQuestionOutput - The return type for the answerMedicalQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerMedicalQuestionInputSchema = z.object({
  question: z.string().describe('The medical question to be answered.'),
  document: z
    .string()
    .optional()
    .describe(
      'A document or text to use as context for answering the question.'
    ),
});
export type AnswerMedicalQuestionInput = z.infer<
  typeof AnswerMedicalQuestionInputSchema
>;

const AnswerMedicalQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the medical question.'),
});
export type AnswerMedicalQuestionOutput = z.infer<
  typeof AnswerMedicalQuestionOutputSchema
>;

export async function answerMedicalQuestion(
  input: AnswerMedicalQuestionInput
): Promise<AnswerMedicalQuestionOutput> {
  return answerMedicalQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerMedicalQuestionPrompt',
  input: {schema: AnswerMedicalQuestionInputSchema},
  output: {schema: AnswerMedicalQuestionOutputSchema},
  prompt: `You are a medical AI assistant. Use the provided document or text to answer the user's medical question accurately and concisely.\n\nIf the document is provided, prioritize it as the main source of information. If the document doesn't have any informaiton return I cannot answer questions based on this document.\n\nQuestion: {{{question}}}\n\nDocument: {{{document}}}`,
});

const answerMedicalQuestionFlow = ai.defineFlow(
  {
    name: 'answerMedicalQuestionFlow',
    inputSchema: AnswerMedicalQuestionInputSchema,
    outputSchema: AnswerMedicalQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
