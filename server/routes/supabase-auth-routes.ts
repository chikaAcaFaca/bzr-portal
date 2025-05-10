import { Router, Request, Response } from "express";
import supabase from "../lib/supabase";
import { storage } from "../storage";
import { sendEmail } from "../services/email-service";
import { checkAdminRole } from "../middleware/auth-middleware";

export const supabaseAuthRouter = Router();

/**
 * Lista korisnika iz Supabase Auth - dostupno samo za administratore
 */
supabaseAuthRouter.get("/list-users", checkAdminRole, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error("Greška pri dobavljanju korisnika iz Supabase:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
    
    // Vraćamo listu korisnika
    return res.status(200).json({
      success: true,
      users: data.users,
    });
  } catch (error: any) {
    console.error("Izuzetak pri dobavljanju korisnika:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Interna greška pri dobavljanju korisnika",
    });
  }
});

/**
 * Brisanje korisnika iz Supabase Auth i iz naše baze podataka - dostupno samo za administratore
 */
supabaseAuthRouter.delete("/users/:id", checkAdminRole, async (req: Request, res: Response) => {
  const userId = req.params.id;
  
  try {
    // Prvo brišemo korisnika iz Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error(`Greška pri brisanju korisnika ${userId} iz Supabase Auth:`, authError);
      return res.status(500).json({
        success: false,
        message: authError.message,
      });
    }
    
    // Zatim brišemo korisnika iz naše baze
    const deleted = await storage.deleteUser(userId);
    
    if (!deleted) {
      console.warn(`Korisnik ${userId} nije pronađen u bazi prilikom brisanja`);
      // Nastavljamo izvršavanje jer je korisnik obrisan iz Auth sistema
    }
    
    return res.status(200).json({
      success: true,
      message: "Korisnik je uspešno izbrisan iz sistema",
    });
  } catch (error: any) {
    console.error(`Izuzetak pri brisanju korisnika ${userId}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || "Interna greška pri brisanju korisnika",
    });
  }
});

/**
 * Slanje verifikacionog email-a korisniku - dostupno samo za administratore
 */
supabaseAuthRouter.post("/send-verification-email", checkAdminRole, async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email adresa je obavezna",
    });
  }
  
  try {
    const redirectTo = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email`;
    
    // Koristimo supabase.auth.resend da pošaljemo verifikacioni email
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      console.error(`Greška pri slanju verifikacionog email-a na ${email}:`, error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Verifikacioni email je poslat na ${email}`,
    });
  } catch (error: any) {
    console.error(`Izuzetak pri slanju verifikacionog email-a na ${email}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || "Interna greška pri slanju verifikacionog email-a",
    });
  }
});

/**
 * Sinhronizacija korisnika iz Supabase Auth sa našom bazom - dostupno samo za administratore
 * Ova ruta proverava sve korisnike u Supabase Auth sistemu i osigurava da postoje u našoj bazi
 */
supabaseAuthRouter.post("/sync-users", checkAdminRole, async (req: Request, res: Response) => {
  try {
    // Dobavljamo sve korisnike iz Supabase Auth
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error("Greška pri dobavljanju korisnika iz Supabase za sinhronizaciju:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
    
    const results = [];
    
    // Za svakog korisnika proveravamo da li postoji u našoj bazi
    for (const authUser of data.users) {
      const user = await storage.getUserByID(authUser.id);
      
      // Ako korisnik ne postoji u našoj bazi, kreiramo ga
      if (!user) {
        try {
          const newUser = await storage.createUserFromAuth({
            id: authUser.id,
            email: authUser.email || "nepoznat@mail.com",
            created_at: new Date(authUser.created_at),
          });
          
          if (newUser) {
            results.push({
              id: authUser.id,
              email: authUser.email,
              action: "created",
            });
          }
        } catch (err: any) {
          console.error(`Greška pri kreiranju korisnika ${authUser.id} tokom sinhronizacije:`, err);
          results.push({
            id: authUser.id,
            email: authUser.email,
            action: "error",
            error: err.message,
          });
        }
      } else {
        // Korisnik već postoji, nema potrebe za akcijom
        results.push({
          id: authUser.id,
          email: authUser.email,
          action: "already_exists",
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Sinhronizacija završena sa ${results.length} obrađenih korisnika`,
      results,
    });
  } catch (error: any) {
    console.error("Izuzetak pri sinhronizaciji korisnika:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Interna greška pri sinhronizaciji korisnika",
    });
  }
});

// Uklanjamo default export jer koristimo named export
// export default supabaseAuthRouter;