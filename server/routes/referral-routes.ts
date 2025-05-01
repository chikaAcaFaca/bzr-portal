import { Router, Request, Response } from 'express';
import { referralRewardService, ReferralSource } from '../services/referral-reward-service';

const router = Router();

/**
 * Pribavlja referalni kod korisnika
 * GET /api/referrals/code
 */
router.get('/code', (req: Request, res: Response) => {
  const userId = req.user?.id?.toString();
  
  // Provera da li je korisnik ulogovan
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Morate biti ulogovani da biste dobili referalni kod' 
    });
  }
  
  try {
    const referralCode = referralRewardService.getUserReferralCode(userId);
    const referralInfo = referralRewardService.getUserReferralInfo(userId);
    
    // Formiramo osnovne URL varijante
    const baseUrl = process.env.APP_URL || 'https://bzr-portal.com';
    const referralUrl = `${baseUrl}/register?ref=${referralCode}`;
    
    res.json({ 
      success: true,
      referralCode,
      referralInfo,
      referralUrl
    });
  } catch (error) {
    console.error('Greška pri dobavljanju referalnog koda:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Došlo je do greške pri dobavljanju referalnog koda' 
    });
  }
});

/**
 * Pribavlja referalne informacije korisnika
 * GET /api/referrals/info
 */
router.get('/info', (req: Request, res: Response) => {
  const userId = req.user?.id?.toString();
  
  // Provera da li je korisnik ulogovan
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Morate biti ulogovani da biste videli referalne informacije' 
    });
  }
  
  try {
    const referralInfo = referralRewardService.getUserReferralInfo(userId);
    const referrals = referralRewardService.getUserReferrals(userId);
    
    if (!referralInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Referalne informacije nisu pronađene' 
      });
    }
    
    res.json({ 
      success: true,
      referralInfo,
      referrals
    });
  } catch (error) {
    console.error('Greška pri dobavljanju referalnih informacija:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Došlo je do greške pri dobavljanju referalnih informacija' 
    });
  }
});

/**
 * Obrađuje registraciju korisnika preko referalnog koda
 * POST /api/referrals/register
 */
router.post('/register', (req: Request, res: Response) => {
  const { referralCode, newUserId, isProUser = false, source = ReferralSource.UNKNOWN, socialPlatform, postLink } = req.body;
  
  // Validacija ulaznih parametara
  if (!referralCode || !newUserId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Referalni kod i ID novog korisnika su obavezni' 
    });
  }
  
  try {
    const success = referralRewardService.registerReferral(
      referralCode, 
      newUserId, 
      isProUser, 
      source, 
      socialPlatform, 
      postLink
    );
    
    if (!success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nije moguće registrovati referal sa datim kodom' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Referal je uspešno registrovan'
    });
  } catch (error) {
    console.error('Greška pri registraciji referala:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Došlo je do greške pri registraciji referala' 
    });
  }
});

/**
 * Ažuriranje statusa PRO pretplate za korisnika
 * PUT /api/referrals/update-pro-status
 */
router.put('/update-pro-status', (req: Request, res: Response) => {
  const { userId, isProActive } = req.body;
  
  // Validacija ulaznih parametara
  if (!userId || isProActive === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID korisnika i status PRO pretplate su obavezni' 
    });
  }
  
  // Dodatna provera da li je zahtev poslao administrator
  const requesterId = req.user?.id?.toString();
  const isAdmin = req.user?.role === 'admin'; // Pretpostavljamo da postoji polje role
  
  if (!requesterId || (!isAdmin && requesterId !== userId)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Nemate dozvolu da ažurirate ovaj status' 
    });
  }
  
  try {
    referralRewardService.updateReferralStatus(userId, isProActive);
    
    res.json({ 
      success: true,
      message: 'Status PRO pretplate je uspešno ažuriran'
    });
  } catch (error) {
    console.error('Greška pri ažuriranju PRO statusa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Došlo je do greške pri ažuriranju PRO statusa' 
    });
  }
});

export default router;