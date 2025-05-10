/**
 * Rute za upravljanje Supabase Auth korisnicima
 * 
 * Ove rute omogućavaju admin korisnicima da upravljaju Supabase Auth korisnicima
 * i sinhronizuju ih sa bazom podataka aplikacije.
 */

import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth-middleware';
import {
  fetchSupabaseUsers,
  createSupabaseUser,
  deleteSupabaseUser,
  syncUserToDatabase
} from '../services/supabase-service';

const router = Router();

/**
 * Dohvata sve korisnike iz Supabase Auth sistema i proverava da li postoje u bazi podataka
 */
router.get('/supabase-users', async (_req: Request, res: Response) => {
  try {
    const users = await fetchSupabaseUsers();
    return res.status(200).json(users);
  } catch (error: any) {
    console.error('Error fetching Supabase users:', error);
    return res.status(500).json({ message: `Greška pri dohvatanju korisnika: ${error.message}` });
  }
});

/**
 * Kreira novog korisnika u Supabase Auth sistemu
 */
router.post('/create-auth-user', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email i lozinka su obavezni' });
    }
    
    const data = await createSupabaseUser(email, password);
    return res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating Supabase user:', error);
    return res.status(500).json({ message: `Greška pri kreiranju korisnika: ${error.message}` });
  }
});

/**
 * Briše korisnika iz Supabase Auth sistema
 */
router.delete('/delete-auth-user/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'ID korisnika je obavezan' });
    }
    
    await deleteSupabaseUser(id);
    return res.status(200).json({ success: true, message: 'Korisnik uspešno obrisan' });
  } catch (error: any) {
    console.error('Error deleting Supabase user:', error);
    return res.status(500).json({ message: `Greška pri brisanju korisnika: ${error.message}` });
  }
});

/**
 * Sinhronizuje korisnika iz Supabase Auth sa bazom podataka aplikacije
 */
router.post('/sync-user/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'ID korisnika je obavezan' });
    }
    
    const result = await syncUserToDatabase(id);
    return res.status(200).json({
      success: true,
      message: result.created 
        ? 'Korisnik uspešno kreiran u bazi podataka' 
        : 'Korisnik već postoji u bazi podataka',
      user: result.user
    });
  } catch (error: any) {
    console.error('Error syncing user to database:', error);
    return res.status(500).json({ message: `Greška pri sinhronizaciji korisnika: ${error.message}` });
  }
});

export default router;