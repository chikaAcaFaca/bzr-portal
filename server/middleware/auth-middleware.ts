/**
 * Middleware za autentifikaciju i autorizaciju korisnika
 */

import { NextFunction, Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Middleware za proveru da li je korisnik prijavljen
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Morate biti prijavljeni za pristup ovom resursu'
    });
  }
  
  // Proverimo da li korisnik postoji u bazi podataka (ne samo u Supabase Auth)
  const [user] = await db.select().from(users).where(eq(users.id, Number(req.user.id)));
  
  if (!user) {
    return res.status(401).json({ 
      error: 'UserNotFound',
      message: 'Korisnički nalog je izbrisan iz baze podataka'
    });
  }
  
  next();
};

// Middleware za proveru da li je korisnik admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Morate biti prijavljeni za pristup ovom resursu'
    });
  }
  
  // Proverimo da li korisnik postoji u bazi podataka (ne samo u Supabase Auth)
  const [user] = await db.select().from(users).where(eq(users.id, Number(req.user.id)));
  
  if (!user) {
    return res.status(401).json({ 
      error: 'UserNotFound',
      message: 'Korisnički nalog je izbrisan iz baze podataka'
    });
  }
  
  if (!user.isAdmin) {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Nemate administratorske privilegije za pristup ovom resursu'
    });
  }
  
  next();
};