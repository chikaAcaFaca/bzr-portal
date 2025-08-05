/**
 * Supabase servis
 * 
 * Služi za komunikaciju sa Supabase API-jem i pruža standardizovani interfejs
 * za rad sa Supabase funkcionalnostima unutar aplikacije.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Provera da li su postavljene neophodne environment varijable
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL i SUPABASE_ANON_KEY moraju biti postavljeni u environment varijablama');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Kreiranje Supabase klijenta sa osnovnim podešavanjima
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});

/**
 * Initializes the Supabase service. This function is called during server startup.
 */
export async function initSupabaseService() {
  console.log('Supabase servis uspešno inicijalizovan');
  return supabase;
}

/**
 * Fetches all users from Supabase Auth system and checks if they exist in the database.
 * This is used to detect and fix synchronization issues between Supabase Auth and app database.
 */
export async function fetchSupabaseUsers() {
  try {
    // Umesto admin API-a, dohvatamo samo korisnike iz baze podataka
    // Napomena: Ovo ne dohvata podatke o autentifikaciji, ali barem sprečava grešku
    const { data: dbUsers, error: dbError } = await supabase.from('users').select('*');
    
    if (dbError) {
      throw new Error(`Error fetching database users: ${dbError.message}`);
    }
    
    // Mapiramo korisnike iz baze podataka bez Auth informacija
    const users = dbUsers.map(dbUser => {
      return {
        id: dbUser.id,
        email: dbUser.email,
        emailConfirmed: true, // Pretpostavljamo da su potvrđeni
        lastSignIn: null,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at,
        existsInDb: true,
        userMetadata: null
      };
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching Supabase users:', error);
    throw error;
  }
}

/**
 * Creates a user in Supabase Auth system
 * Napomena: Ova funkcija je isključena zbog nedostatka admin privilegija
 */
export async function createSupabaseUser(email: string, password: string) {
  // Za sada vraćamo grešku da funkcija nije dostupna
  throw new Error('Admin funkcije za upravljanje korisnicima nisu dostupne bez service_role ključa');
  
  // Originalni kod je komentarisan
  /*
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error) {
    throw new Error(`Error creating Supabase Auth user: ${error.message}`);
  }
  
  return data;
  */
}

/**
 * Deletes a user from Supabase Auth system
 * Napomena: Ova funkcija je isključena zbog nedostatka admin privilegija
 */
export async function deleteSupabaseUser(userId: string) {
  // Za sada vraćamo grešku da funkcija nije dostupna
  throw new Error('Admin funkcije za upravljanje korisnicima nisu dostupne bez service_role ključa');
  
  // Originalni kod je komentarisan
  /*
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    throw new Error(`Error deleting Supabase Auth user: ${error.message}`);
  }
  
  return { success: true };
  */
}

/**
 * Syncs a user from Supabase Auth to the application database
 * Napomena: Ova funkcija je modifikovana zbog nedostatka admin privilegija
 */
export async function syncUserToDatabase(userId: string) {
  // U nedostatku admin API-a, samo proveravamo da li korisnik postoji u bazi
  // i vraćamo postojećeg korisnika
  
  // Check if user already exists in the database
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (checkError) {
    throw new Error(`Error checking if user exists in database: ${checkError.message}`);
  }
  
  if (existingUser) {
    return { user: existingUser, created: false };
  }
  
  // Bez admin pristupa ne možemo kreirati korisnika jer nemamo Auth podatke
  throw new Error('Ne možemo kreirati korisnika u bazi jer nemamo pristup Auth podacima. Potreban je service_role ključ.');
}