import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and Anon Key from the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Throw an error if the environment variables are not set
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and/or Anon Key are not set in environment variables.');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);