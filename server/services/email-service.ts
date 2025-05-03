import { createClient } from '@supabase/supabase-js';

// Proveravamo da li imamo postavljene env varijable
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Nedostaju Supabase kredencijali za email servis');
}

// Kreiranje Supabase klijenta sa service role ključem za slanje emailova
const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

/**
 * Funkcija za slanje email poruke putem Supabase-a
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // Šaljemo email koristeći Supabase
    const { error } = await supabase
      .auth
      .admin
      .inviteUserByEmail(to, {
        data: {
          subject,
          content: html,
          skipAuthEmail: true, // Označavamo da ne želimo slati Auth email već customizovani sadržaj
        }
      });

    if (error) {
      console.error('Greška pri slanju emaila preko Supabase:', error);
      return false;
    }

    console.log(`Email uspešno poslat na: ${to}`);
    return true;
  } catch (error) {
    console.error('Izuzetak pri slanju emaila:', error);
    return false;
  }
}

/**
 * Alternativna funkcija koja koristi Supabase Edge Functions za slanje emailova 
 * ako je konfigurisana odgovarajuća Edge Function
 */
export async function sendEmailViaEdgeFunction(
  to: string, 
  subject: string, 
  html: string
): Promise<boolean> {
  try {
    // Pozivamo edge funkciju za slanje emaila
    const { data, error } = await supabase
      .functions
      .invoke('send-email', {
        body: {
          to,
          subject,
          html
        }
      });

    if (error) {
      console.error('Greška pri slanju emaila preko Edge funkcije:', error);
      return false;
    }

    console.log(`Email uspešno poslat preko Edge funkcije na: ${to}`);
    return true;
  } catch (error) {
    console.error('Izuzetak pri slanju emaila preko Edge funkcije:', error);
    return false;
  }
}