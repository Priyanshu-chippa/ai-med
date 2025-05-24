// supabase/functions/save-ai-message/index.ts
import { createClient } from '@supabase/supabase-js'
// Use a relative path for types, assuming src/types/supabase.ts relative to this file
import type { Database, TablesInsert } from '../../../src/types/supabase.ts' 

// WARNING: The SUPABASE_SERVICE_ROLE_KEY is highly sensitive and should be treated like a password.
// Do not expose it in client-side code. It's used here because this is a trusted server-side environment.
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  // Deno.exit(1); // Consider how you want to handle fatal errors in deployment
}

const supabaseAdmin = createClient<Database>(supabaseUrl!, serviceRoleKey!);

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*', // Be more specific in production
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } });
  }

  try {
    const { conversation_id, user_id, ai_response } = await req.json();

    if (!conversation_id || !user_id || !ai_response) {
      return new Response(JSON.stringify({ error: 'Missing required fields: conversation_id, user_id, or ai_response' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const messageToInsert: TablesInsert<'messages'> = {
      conversation_id: conversation_id,
      user_id: user_id, // user_id of the human user this AI message is associated with
      sender: 'ai',
      content: JSON.stringify(ai_response), // Store the structured AI response as JSON
      // image_url will be null for AI messages
    };

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(messageToInsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error; // This will be caught by the outer catch block
    }

    return new Response(JSON.stringify({ message: 'AI message saved successfully', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    // Log the full error for server-side debugging
    console.error('Error in save-ai-message function:', err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message || 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
