import { Router, Request, Response } from 'express';
import AdminService from '../services/admin-service';

export const adminRoleRouter = Router();

// Endpointt za proveru prvog korisnika i dodelu admin prava
adminRoleRouter.post('/setup-first-admin', async (req: Request, res: Response) => {
  try {
    const success = await AdminService.setupFirstUserAsAdmin();
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Uspešno dodeljena admin prava prvom korisniku'
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Nije moguće dodeliti admin prava (postoji više korisnika ili je došlo do greške)'
      });
    }
  } catch (error) {
    console.error('Greška pri dodeljivanju admin prava:', error);
    return res.status(500).json({
      success: false,
      message: 'Došlo je do greške pri dodeljivanju admin prava',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint za dobijanje broja administratora
adminRoleRouter.get('/admin-count', async (req: Request, res: Response) => {
  try {
    const count = await AdminService.getAdminCount();
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Greška pri dobavljanju broja admina:', error);
    return res.status(500).json({
      success: false,
      message: 'Došlo je do greške pri dobavljanju broja administratora',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint za ručno dodeljivanje admin prava (admin može da dodeli drugom korisniku)
adminRoleRouter.post('/assign-admin/:userId', async (req: Request, res: Response) => {
  try {
    // Provera da li je trenutni korisnik administrator
    // U pravoj implementaciji, ovde bi se proverilo req.user ili sesija
    const isCurrentUserAdmin = true; // Ovo treba zameniti pravom proverom
    
    if (!isCurrentUserAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Nemate dozvolu za dodeljivanje admin prava'
      });
    }
    
    const userId = req.params.userId;
    const success = await AdminService.assignAdminRole(userId);
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: `Uspešno dodeljena admin prava korisniku (ID: ${userId})`
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Nije moguće dodeliti admin prava'
      });
    }
  } catch (error) {
    console.error('Greška pri dodeljivanju admin prava:', error);
    return res.status(500).json({
      success: false,
      message: 'Došlo je do greške pri dodeljivanju admin prava',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});