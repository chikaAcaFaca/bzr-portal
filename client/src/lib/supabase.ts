
import { createClient } from '@supabase/supabase-js'

// Import environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Hardkodirane vrednosti za razvoj
// (ove vrednosti će biti uklonjene u produkciji)
const url = supabaseUrl || 'https://dazylhbqxdmgqxgprsri.supabase.co';
const key = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhenlsaGJxeGRtZ3F4Z3Byc3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDAzMjMsImV4cCI6MjA2MTUxNjMyM30.I75EnV_2VzlqtCfc1Tv1XvQ1tX4THwaiukVUn5V5f5k';

// Kreiranje Supabase klijenta
export const supabase = createClient(
  url,
  key,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)

export type Profile = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}
