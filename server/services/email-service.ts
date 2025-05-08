import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

/**
 * Klasa za upravljanje email servisima - Resend i Supabase
 * Ova klasa omogućava slanje emailova preko više servisa sa fallback opcijom
 */
class EmailServiceManager {
  private resendClient: Resend | null = null;
  private supabaseClient: ReturnType<typeof createClient> | null = null;
  private _hasResend: boolean = false;
  private _hasSupabase: boolean = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Inicijalizacija Resend klijenta
    if (process.env.RESEND_API_KEY) {
      try {
        this.resendClient = new Resend(process.env.RESEND_API_KEY);
        this._hasResend = true;
        console.log('Resend servis uspešno inicijalizovan');
      } catch (error) {
        console.error('Greška pri inicijalizaciji Resend servisa:', error);
        this.resendClient = null;
        this._hasResend = false;
      }
    } else {
      console.log('Resend API ključ nije dostupan');
    }

    // Inicijalizacija Supabase klijenta za edge funkcije
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        this.supabaseClient = createClient(
          process.env.SUPABASE_URL, 
          process.env.SUPABASE_ANON_KEY
        );
        this._hasSupabase = true;
        console.log('Supabase servis uspešno inicijalizovan');
      } catch (error) {
        console.error('Greška pri inicijalizaciji Supabase servisa:', error);
        this.supabaseClient = null;
        this._hasSupabase = false;
      }
    } else {
      console.log('Supabase kredencijali nisu dostupni');
    }
  }

  get resend(): Resend | null {
    return this.resendClient;
  }

  get supabase(): ReturnType<typeof createClient> | null {
    return this.supabaseClient;
  }

  get hasResend(): boolean {
    return this._hasResend;
  }

  get hasSupabase(): boolean {
    return this._hasSupabase;
  }

  get activeService(): string {
    if (this._hasResend) return 'resend';
    if (this._hasSupabase) return 'supabase';
    return 'none';
  }

  get hasFallback(): boolean {
    return this._hasResend && this._hasSupabase;
  }
  
  /**
   * Metoda za slanje emaila preko dostupnih servisa sa fallback opcijom
   * @param to Email primaoca
   * @param subject Naslov emaila
   * @param htmlContent HTML sadržaj emaila
   * @param fromName Ime pošiljaoca
   * @param fromEmail Email pošiljaoca
   * @returns Promise<boolean> Uspešno poslato
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    fromName: string = 'BZR Portal',
    fromEmail: string = 'onboarding@resend.dev'
  ): Promise<boolean> {
    // Pokušaj slanja preko Resend-a
    if (this._hasResend && this.resendClient) {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject: subject,
          html: htmlContent,
        });
        
        if (!error) {
          console.log('Email uspešno poslat preko Resend, ID:', data?.id);
          return true;
        }
        
        console.error('Greška pri slanju emaila preko Resend:', error);
        // Ako Resend nije uspeo, nastavljamo na Supabase kao fallback
      } catch (error) {
        console.error('Neočekivana greška pri slanju preko Resend:', error);
        // Nastavljamo na Supabase kao fallback
      }
    }
    
    // Pokušaj slanja preko Supabase-a
    if (this._hasSupabase && this.supabaseClient) {
      try {
        const { error } = await this.supabaseClient.functions.invoke('send-email', {
          body: {
            to,
            subject,
            html: htmlContent,
          },
        });
        
        if (!error) {
          console.log('Email uspešno poslat preko Supabase');
          return true;
        }
        
        console.error('Greška pri slanju emaila preko Supabase:', error);
      } catch (error) {
        console.error('Neočekivana greška pri slanju preko Supabase:', error);
      }
    }
    
    // Ako smo stigli dovde, nijedan servis nije uspeo da pošalje email
    return false;
  }
}

const emailService = new EmailServiceManager();

/**
 * Funkcija za slanje emaila preko dostupnih servisa sa automatskim fallback mehanizmom
 * @param to Email primaoca
 * @param subject Naslov emaila
 * @param htmlContent HTML sadržaj emaila
 * @param fromName Ime pošiljaoca (opciono)
 * @param fromEmail Email pošiljaoca (opciono)
 * @returns Promise<boolean> Da li je slanje uspešno
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  fromName: string = 'BZR Portal',
  fromEmail: string = 'onboarding@resend.dev'
): Promise<boolean> {
  try {
    // Koristimo objedinjenu metodu iz EmailServiceManager klase
    return await emailService.sendEmail(to, subject, htmlContent, fromName, fromEmail);
  } catch (error) {
    console.error('Neočekivana greška pri slanju emaila:', error);
    return false;
  }
}

/**
 * Funkcija koja proverava da li je email servis dostupan
 */
export function isEmailServiceAvailable(): boolean {
  return emailService.hasResend || emailService.hasSupabase;
}

/**
 * Funkcija koja vraća informacije o dostupnim email servisima
 */
export function getEmailServiceInfo(): { 
  resend: boolean, 
  supabase: boolean, 
  active: string,
  activeWithFallback: boolean 
} {
  return {
    resend: emailService.hasResend,
    supabase: emailService.hasSupabase,
    active: emailService.activeService,
    activeWithFallback: emailService.hasFallback
  };
}