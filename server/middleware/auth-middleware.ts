import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import session from 'express-session';

// Deklarišemo proširenje za Express Session interfejs
declare module 'express-session' {
  interface SessionData {
    supabase_uid?: string;
  }
}

// Proširenje za Express Request interfejs
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      role: string;
      [key: string]: any;
    }
  }
}

/**
 * Middleware koji proverava da li je trenutni korisnik ulogovan
 */
export async function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Proveravamo da li postoji supabase_uid u sesiji
  const supabaseUserId = req.session.supabase_uid;
  
  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      message: 'Niste prijavljeni. Molimo vas da se prijavite.'
    });
  }
  
  // Proveravamo da li korisnik postoji u našoj bazi
  const user = await storage.getUserByID(supabaseUserId);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Korisnik nije pronađen u sistemu. Obratite se administratoru.'
    });
  }
  
  // Dodajemo korisnika u request objekat
  req.user = user;
  
  next();
}

/**
 * Middleware koji proverava da li je trenutni korisnik administrator
 */
export async function checkAdminRole(req: Request, res: Response, next: NextFunction) {
  // Prvo proveravamo da li je korisnik ulogovan
  await checkAuthenticated(req, res, async (err) => {
    if (err) return next(err);
    
    // Proveravamo da li je uloga korisnika "admin"
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Nemate dozvolu za pristup ovoj funkcionalnosti. Potrebna je administratorska uloga.'
      });
    }
    
    next();
  });
}