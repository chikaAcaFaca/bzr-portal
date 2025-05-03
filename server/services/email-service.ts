import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Inicijalizacija Resend klijenta
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Inicijalizacija Supabase klijenta za edge funkcije
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Funkcija za slanje emaila preko Resend servisa
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  fromName: string = 'BZR Portal',
  fromEmail: string = 'noreply@bzr-portal.com'
): Promise<boolean> {
  try {
    // 1. Pokušaj slanje preko Resend-a
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: htmlContent,
      });
      
      if (error) {
        console.error('Greška pri slanju emaila preko Resend:', error);
        return false;
      }
      
      console.log('Email uspešno poslat preko Resend, ID:', data?.id);
      return true;
    }
    
    // 2. Pokušaj slanje preko Supabase-a kao alternativa
    return await sendEmailViaEdgeFunction(to, subject, htmlContent);
    
  } catch (error) {
    console.error('Neočekivana greška pri slanju emaila:', error);
    return false;
  }
}

/**
 * Funkcija za slanje emaila preko Supabase Edge funkcije
 * (koristi se samo kao fallback ako Resend nije dostupan)
 */
export async function sendEmailViaEdgeFunction(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase konfiguracija nije dostupna');
      return false;
    }

    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html: htmlContent,
      },
    });

    if (error) {
      console.error('Greška pri slanju emaila preko Supabase:', error);
      return false;
    }

    console.log('Email uspešno poslat preko Supabase');
    return true;
  } catch (error) {
    console.error('Neočekivana greška pri slanju emaila preko Supabase:', error);
    return false;
  }
}

/**
 * Funkcija koja proverava da li je email servis dostupan
 */
export function isEmailServiceAvailable(): boolean {
  return Boolean(resend) || (Boolean(supabaseUrl) && Boolean(supabaseKey));
}

/**
 * Funkcija koja vraća informacije o dostupnim email servisima
 */
export function getEmailServiceInfo(): { resend: boolean, supabase: boolean, active: string } {
  const hasResend = Boolean(resend);
  const hasSupabase = Boolean(supabaseUrl) && Boolean(supabaseKey);
  
  return {
    resend: hasResend,
    supabase: hasSupabase,
    active: hasResend ? 'resend' : hasSupabase ? 'supabase' : 'none'
  };
}