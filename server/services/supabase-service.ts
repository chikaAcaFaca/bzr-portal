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
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Error fetching Supabase Auth users: ${authError.message}`);
    }
    
    // Get all app users from the database
    const { data: dbUsers, error: dbError } = await supabase.from('users').select('*');
    
    if (dbError) {
      throw new Error(`Error fetching database users: ${dbError.message}`);
    }
    
    // Map users to the expected format and check if they exist in the database
    const users = authUsers.users.map(authUser => {
      const dbUser = dbUsers?.find(u => u.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        emailConfirmed: authUser.email_confirmed_at !== null,
        lastSignIn: authUser.last_sign_in_at,
        createdAt: authUser.created_at,
        updatedAt: authUser.updated_at,
        existsInDb: !!dbUser,
        userMetadata: authUser.user_metadata
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
 */
export async function createSupabaseUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error) {
    throw new Error(`Error creating Supabase Auth user: ${error.message}`);
  }
  
  return data;
}

/**
 * Deletes a user from Supabase Auth system
 */
export async function deleteSupabaseUser(userId: string) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    throw new Error(`Error deleting Supabase Auth user: ${error.message}`);
  }
  
  return { success: true };
}

/**
 * Syncs a user from Supabase Auth to the application database
 */
export async function syncUserToDatabase(userId: string) {
  // First get the user from Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  
  if (authError || !authUser.user) {
    throw new Error(`Error fetching Supabase Auth user: ${authError?.message || 'User not found'}`);
  }
  
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
  
  // Create user in the database
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: new Date(authUser.user.created_at),
      updated_at: new Date(),
      isActive: true,
      isAdmin: false, // Only the first user is admin by default
      firstName: authUser.user.user_metadata?.firstName || '',
      lastName: authUser.user.user_metadata?.lastName || '',
    })
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`Error inserting user into database: ${insertError.message}`);
  }
  
  return { user: newUser, created: true };
}