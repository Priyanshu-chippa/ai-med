# MediMate AI

An AI chat assistant that answers general health questions and summarizes medical text. You can type, upload an image, or speak your question.

> **MediMate AI is an informational prototype, not a medical device.** It does not give medical advice, diagnosis or treatment. Always talk to a qualified doctor about health decisions.

**Project post:** [MediMate AI on LinkedIn](https://www.linkedin.com/posts/priyanshuchippa_medimate-aiai-powered-medicalassistant-activity-7332176638090051584-Mylx)

## What it does

- **Medical Q&A:** ask a health question and get an explanation in plain language.
- **Advice with sources:** answers list where the information came from and suggest follow-up questions.
- **Summarization:** paste medical text and get a short summary.
- **Three ways to ask:** type, upload an image, or use speech-to-text.
- **Chat history:** sign in and reopen older conversations from the sidebar, including the images in them.
- **Light and dark themes** with a responsive layout.

## How it works

```
Browser (Next.js / React)
   │  text, image or voice → text
   ▼
Next.js server actions  ──►  Genkit flows ──►  Google Gemini (gemini-2.0-flash)
   │                          • answer-medical-question
   │                          • generate-medical-advice
   │                          • summarize-medical-text
   ▼
Supabase  ◄── save-ai-message edge function (stores conversations)
   └── Supabase Auth (sign-in, session)
```

1. The chat UI collects the user's input (text, image or transcribed speech).
2. A server action calls a Genkit flow, which sends the request to Gemini and returns a structured response.
3. Conversations are saved to Supabase through an edge function, so history persists per user.

## Tech stack

Next.js, React, TypeScript, Tailwind CSS, Radix UI, Genkit with Google Gemini, Supabase (Auth, Postgres, Edge Functions), Firebase Studio and Firebase emulators for development.

## Run it locally

You need Node.js 18+, a [Gemini API key](https://aistudio.google.com/apikey) and a Supabase project.

```bash
git clone https://github.com/Priyanshu-chippa/ai-med.git
cd ai-med
npm install
```

Create a `.env.local` file (never commit it):

```bash
GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Deploy the `save-ai-message` function in `supabase/functions` to your Supabase project. It needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set as function secrets.

```bash
npm run dev          # app on http://localhost:9002
npm run genkit:dev   # Genkit developer UI for the AI flows
```

## Project structure

```
src/ai/flows/        Genkit flows (Q&A, advice, summarization)
src/app/             Next.js pages and server actions
src/components/      Chat input bar, messages, sidebar, theme toggle
src/lib/             Supabase client
supabase/functions/  save-ai-message edge function
docs/blueprint.md    Original product blueprint
```

## Status and how it was built

This is a prototype I built in 2025 as a learning project. I used AI-assisted development (Firebase Studio) to build it quickly, and I handled the design, integration with Gemini and Supabase, and the debugging. To try it, run it locally using the steps above.

## Author

Priyanshu Chippa. [LinkedIn](https://www.linkedin.com/in/priyanshuchippa) | [GitHub](https://github.com/Priyanshu-chippa)
