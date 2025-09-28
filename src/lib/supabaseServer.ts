import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Get the Supabase URL and Anon Key from the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Throw an error if the environment variables are not set
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and/or Anon Key are not set in environment variables.');
}

// Server component client
export const createSupabaseServerComponent = () =>
  createServerComponentClient({ cookies });

// Route handler client (for API routes)
export const createSupabaseRouteHandler = () =>
  createRouteHandlerClient({ cookies });

