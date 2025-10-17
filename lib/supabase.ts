import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side operations with extended timeout
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Server-side, don't persist
    },
    global: {
      headers: {
        'x-client-info': 'sportstrivia-server',
      },
    },
    db: {
      schema: 'public',
    },
    // Increase timeout for large file operations
    realtime: {
      timeout: 60000, // 60 seconds
    },
  });
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
           (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

// Default bucket name for quiz images
export const QUIZ_IMAGES_BUCKET = "quiz-images";

