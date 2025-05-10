/**
 * Rute za sinhronizaciju i upravljanje Supabase Auth korisnicima
 */

import { Router, Request, Response } from 'express';
import { isAdmin } from '../middleware/auth-middleware';
import { db } from '../db';
import { users } from '@shared/schema';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';

const router = Router();

// Inicijalizacija Supabase klijenta
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL ili SUPABASE_ANON_KEY nedostaju u env varijablama');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta za pregled svih Supabase Auth korisnika
router.get('/supabase-users', isAdmin, async (req: Request, res: Response) => {
  try {
    const { data: supabaseUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return res.status(500).json({ 
        error: 'SupabaseError', 
        message: 'Greška pri pribavljanju Supabase Auth korisnika',
        details: error.message 
      });
    }
    
    // Dobijanje korisnika iz naše baze
    const dbUsers = await db.select().from(users);
    
    // Mapiranje ID-ova korisnika iz naše baze
    const dbUserIds = new Set(dbUsers.map(user => user.id.toString()));
    
    // Mapiranje Supabase korisnika sa informacijom da li postoje u bazi
    const mappedUsers = supabaseUsers.users.map(user => ({
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at !== null,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      existsInDb: dbUserIds.has(user.id.toString()),
      userMetadata: user.user_metadata
    }));
    
    res.json(mappedUsers);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'ServerError', 
      message: 'Interna greška servera',
      details: error.message 
    });
  }
});

// Ruta za sinhronizaciju Supabase Auth korisnika sa našom bazom
router.post('/sync-user/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Provera da li korisnik postoji u Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);
    
    if (userError || !userData.user) {
      return res.status(404).json({ 
        error: 'UserNotFound', 
        message: 'Korisnik nije pronađen u Supabase Auth bazi' 
      });
    }
    
    // Provera da li korisnik već postoji u bazi
    const [existingUser] = await db.select().from(users).where(eq(users.id, Number(id)));
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'UserExists', 
        message: 'Korisnik već postoji u bazi podataka' 
      });
    }
    
    // Kreiranje korisnika u bazi
    await db.insert(users).values({
      id: Number(id),
      username: userData.user.email?.split('@')[0] || `user_${id}`,
      email: userData.user.email || '',
      isActive: true,
      isAdmin: false,
      createdAt: new Date(userData.user.created_at || Date.now()),
      updatedAt: new Date(),
      storageQuota: 100 * 1024 * 1024, // 100 MB za besplatne korisnike
      usedStorage: 0,
      isPro: false,
      referralCode: `REF${String(Number(id) * 12 + 1).padStart(5, '0')}`,
      referrerCode: null,
      referralCount: 0,
      referralBonus: 0,
      lastLoginAt: new Date(userData.user.last_sign_in_at || Date.now())
    });
    
    res.json({ 
      success: true, 
      message: 'Korisnik uspešno sinhronizovan sa bazom podataka' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'ServerError', 
      message: 'Interna greška servera',
      details: error.message 
    });
  }
});

// Ruta za brisanje korisnika iz Supabase Auth
router.delete('/delete-auth-user/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Brisanje korisnika iz Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(id);
    
    if (error) {
      return res.status(500).json({ 
        error: 'SupabaseError', 
        message: 'Greška pri brisanju korisnika iz Supabase Auth',
        details: error.message 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Korisnik uspešno obrisan iz Supabase Auth baze' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'ServerError', 
      message: 'Interna greška servera',
      details: error.message 
    });
  }
});

// Ruta za kreiranje novog korisnika direktno u Supabase Auth
router.post('/create-auth-user', isAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, metadata } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'InvalidInput', 
        message: 'Email i lozinka su obavezni' 
      });
    }
    
    // Kreiranje korisnika u Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata || {}
    });
    
    if (error) {
      return res.status(500).json({ 
        error: 'SupabaseError', 
        message: 'Greška pri kreiranju korisnika u Supabase Auth',
        details: error.message 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Korisnik uspešno kreiran u Supabase Auth bazi',
      user: data.user
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'ServerError', 
      message: 'Interna greška servera',
      details: error.message 
    });
  }
});

export default router;