/**
 * Middleware za autentifikaciju i autorizaciju korisnika
 * 
 * Ovaj middleware proverava da li je korisnik autentifikovan i da li ima odgovarajuće privilegije
 * za pristup zaštićenim rutama. Takođe rešava problem desinhronizacije između Supabase Auth
 * i baze podataka aplikacije.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase-service';

// Middleware za proveru da li je korisnik autentifikovan
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Provera Authorization header-a
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Neautorizovani pristup' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Provera validnosti tokena
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Neautorizovani pristup' });
    }
    
    // Provera da li korisnik postoji u bazi podataka aplikacije
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!dbUser) {
      return res.status(403).json({ 
        message: 'Korisnik ne postoji u bazi podataka', 
        supabaseExists: true,
        dbExists: false
      });
    }
    
    // Dodavanje korisnika u req objekat
    req.user = dbUser;
    next();
  } catch (error: any) {
    console.error('Greška u auth middleware-u:', error);
    return res.status(500).json({ message: 'Interna serverska greška' });
  }
}

// Middleware za proveru admin privilegija
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Prvo proveri da li je korisnik autentifikovan
    await requireAuth(req, res, async () => {
      const user = req.user;
      
      // Proveri da li korisnik ima admin privilegije
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Zabranjen pristup: Potrebne su admin privilegije' });
      }
      
      next();
    });
  } catch (error: any) {
    console.error('Greška u admin auth middleware-u:', error);
    return res.status(500).json({ message: 'Interna serverska greška' });
  }
}

// Proširenje Express.Request tipa da uključi korisnika
declare global {
  namespace Express {
    interface Request {
      user: any;
    }
  }
}