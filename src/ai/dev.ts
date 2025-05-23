import { config } from 'dotenv';
config();

import '@/ai/flows/generate-medical-advice.ts';
import '@/ai/flows/summarize-medical-text.ts';
import '@/ai/flows/answer-medical-question.ts';