import { createClient } from '@supabase/supabase-js';

let supabaseUrl: string;
let supabaseAnonKey: string;

if (typeof window !== 'undefined') {
  // Client-side
  supabaseUrl = window.ENV.SUPABASE_URL;
  supabaseAnonKey = window.ENV.SUPABASE_ANON_KEY;
} else {
  // Server-side
  supabaseUrl = process.env.SUPABASE_URL || '';
  supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
