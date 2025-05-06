import { Router, Request, Response } from 'express';
import ReferralRewardService from '../services/referral-reward-service';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * Get the referral code and URL for the current user
 * GET /api/referrals/code
 */
router.get('/code', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Morate biti prijavljeni da biste dobili referalni kod'
      });
    }

    // Proverimo prvo direktno u bazi da li korisnik već ima referalni kod
    let referralCode = null;
    let referralUrl = null;
    
    try {
      // Proveriti da li korisnik već ima referalni kod
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', req.user.id)
        .single();
      
      if (existingCode && existingCode.code) {
        // Ako kod već postoji, koristimo ga
        referralCode = existingCode.code;
        
        // Generišemo URL sa postojećim kodom
        // Uvek koristimo bzr-portal.com kao baznu adresu
        const baseUrl = 'https://bzr-portal.com';
        
        referralUrl = `${baseUrl}/auth?ref=${referralCode}`;
      } else {
        // Ako kod ne postoji, generišemo novi
        referralCode = await ReferralRewardService.generateReferralCode(req.user.id);
        referralUrl = await ReferralRewardService.getReferralUrl(req.user.id);
      }
    } catch (dbError) {
      // Ako dođe do greške sa bazom, pokušajmo preko servisa
      console.log('Fallback na ReferralRewardService:', dbError);
      referralCode = await ReferralRewardService.generateReferralCode(req.user.id);
      referralUrl = await ReferralRewardService.getReferralUrl(req.user.id);
    }

    return res.status(200).json({
      success: true,
      referral_code: referralCode,
      referral_url: referralUrl
    });
  } catch (error) {
    console.error('Greška pri dobavljanju referalnog koda:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri dobavljanju referalnog koda'
    });
  }
});

/**
 * Get referral information and statistics for the current user
 * GET /api/referrals/info
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Morate biti prijavljeni da biste videli referalne informacije'
      });
    }

    // Dobavljanje statistike referala
    const referralInfo = await ReferralRewardService.getReferralStats(req.user.id);
    
    // Dobavljanje liste referala
    const referrals = await ReferralRewardService.getUserReferrals(req.user.id);

    return res.status(200).json({
      success: true,
      referral_info: referralInfo,
      referrals
    });
  } catch (error) {
    console.error('Greška pri dobavljanju referalnih informacija:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri dobavljanju referalnih informacija'
    });
  }
});

/**
 * Process a referral during registration
 * POST /api/referrals/process
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { referred_user_id, referral_code, is_pro_user, source, social_platform, post_link } = req.body;

    if (!referred_user_id || !referral_code) {
      return res.status(400).json({
        success: false,
        message: 'Potrebni su ID korisnika i referalni kod'
      });
    }

    const success = await ReferralRewardService.processReferral(
      referred_user_id,
      referral_code,
      is_pro_user || false,
      source || 'direct_link',
      social_platform,
      post_link
    );

    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Referral uspešno procesiran'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Nije moguće procesirati referral'
      });
    }
  } catch (error) {
    console.error('Greška pri procesiranju referala:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri procesiranju referala',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Update user PRO status and adjust referrals
 * PUT /api/referrals/update-pro-status
 */
router.put('/update-pro-status', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Morate biti prijavljeni da biste ažurirali PRO status'
      });
    }

    const { is_pro_user } = req.body;

    if (typeof is_pro_user !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Potrebno je definisati PRO status (true/false)'
      });
    }

    await ReferralRewardService.updateUserProStatus(req.user.id, is_pro_user);

    return res.status(200).json({
      success: true,
      message: `PRO status uspešno ${is_pro_user ? 'aktiviran' : 'deaktiviran'}`
    });
  } catch (error) {
    console.error('Greška pri ažuriranju PRO statusa:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri ažuriranju PRO statusa'
    });
  }
});

/**
 * Manually check and update expired referrals
 * POST /api/referrals/check-expired (Admin only)
 */
router.post('/check-expired', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Samo administratori mogu izvršiti ovu akciju'
      });
    }

    await ReferralRewardService.checkExpiredReferrals();

    return res.status(200).json({
      success: true,
      message: 'Istekli referali su uspešno ažurirani'
    });
  } catch (error) {
    console.error('Greška pri proveri isteklih referala:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri proveri isteklih referala'
    });
  }
});

/**
 * Administratorski endpoint za ručno kreiranje referala između dva korisnika
 * POST /api/referrals/admin/create-referral
 */
router.post('/admin/create-referral', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Samo administratori mogu izvršiti ovu akciju'
      });
    }

    const { referrer_email, referred_email, is_pro_user = false } = req.body;

    if (!referrer_email || !referred_email) {
      return res.status(400).json({
        success: false,
        message: 'Potrebni su email adrese oba korisnika'
      });
    }

    // Pronalaženje korisnika po email adresama
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('id')
      .eq('email', referrer_email)
      .single();

    if (referrerError || !referrerData) {
      return res.status(404).json({
        success: false,
        message: `Korisnik sa email adresom ${referrer_email} nije pronađen`
      });
    }

    const { data: referredData, error: referredError } = await supabase
      .from('users')
      .select('id')
      .eq('email', referred_email)
      .single();

    if (referredError || !referredData) {
      return res.status(404).json({
        success: false,
        message: `Korisnik sa email adresom ${referred_email} nije pronađen`
      });
    }

    // Dobavljanje ili generisanje referalnog koda za referrer-a
    const referralCode = await ReferralRewardService.getReferralCode(referrerData.id);

    if (!referralCode) {
      return res.status(500).json({
        success: false,
        message: 'Nije moguće generisati referalni kod'
      });
    }

    // Provera da li referral već postoji
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', referredData.id)
      .single();
    
    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: 'Referral već postoji za korisnika sa ovom email adresom'
      });
    }

    // Kreiranje referrala
    const referral = await ReferralRewardService.createReferral(
      referrerData.id,
      referredData.id,
      referralCode,
      is_pro_user,
      'direct_link',
      'admin_manual'
    );

    return res.status(201).json({
      success: true,
      message: 'Referral uspešno kreiran',
      referral
    });
  } catch (error) {
    console.error('Greška pri ručnom kreiranju referala:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri ručnom kreiranju referala'
    });
  }
});

export default router;