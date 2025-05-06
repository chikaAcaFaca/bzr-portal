import { createClient } from '@supabase/supabase-js';

// Import environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://dazylhbqxdmgqxgprsri.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhenlsaGJxeGRtZ3F4Z3Byc3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDAzMjMsImV4cCI6MjA2MTUxNjMyM30.I75EnV_2VzlqtCfc1Tv1XvQ1tX4THwaiukVUn5V5f5k';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL ili key nisu definisani. Proverite vaše environment varijable.');
}

// Kreiranje Supabase klijenta sa poboljšanim opcijama
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    // Poboljšamo rukovanje greškama
    fetch: (...args) => fetch(...args)
  }
});

// Proverimo konekciju
supabase.auth.getSession().then(() => {
  console.log('Supabase servis uspešno inicijalizovan');
}).catch(err => {
  console.error('Greška pri inicijalizaciji Supabase klijenta:', err.message);
});

// Zadržavamo oba načina izvoza za kompatibilnost
export default supabase;