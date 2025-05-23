
// src/app/auth/callback/route.ts
import { supabase } from '@/lib/supabaseClient';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
      }
      // Successfully authenticated, redirect to home or dashboard
      return NextResponse.redirect(`${origin}/`);
    } catch (e: any) {
      console.error('Callback error:', e);
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(e.message || 'Authentication failed')}`);
    }
  }

  // If no code is present, or an error occurred before exchanging
  console.log('No code found in auth callback request or other error.');
  return NextResponse.redirect(`${origin}/auth?error=Invalid%20authentication%20callback`);
}

// Ensure this route is dynamic if needed, or revalidate as necessary
export const dynamic = 'force-dynamic';
