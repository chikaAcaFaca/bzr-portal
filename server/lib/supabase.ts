import { createClient } from '@supabase/supabase-js';

// Import environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://dazylhbqxdmgqxgprsri.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhenlsaGJxeGRtZ3F4Z3Byc3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDAzMjMsImV4cCI6MjA2MTUxNjMyM30.I75EnV_2VzlqtCfc1Tv1XvQ1tX4THwaiukVUn5V5f5k';

// Kreiranje Supabase klijenta
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

export default supabase;