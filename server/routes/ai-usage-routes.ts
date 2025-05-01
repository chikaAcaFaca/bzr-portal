import { Request, Response, Router } from 'express';
import { db } from '../db';
import { format } from 'date-fns';

const router = Router();

// Konstante
const FREE_USER_DAILY_QUESTION_LIMIT = 3;
const PRO_USER_DAILY_QUESTION_LIMIT = 100; // Praktično neograničeno

// Middleware za proveru autentifikacije
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: "Niste prijavljeni" });
  }
  next();
};

// Endpoint za dohvatanje dnevnog limita pitanja
router.get('/daily', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Niste prijavljeni" });
    }
    
    // Dohvati korisnika i njegov tip pretplate
    const { data: userData, error: userError } = await db
      .from('user_profiles')
      .select('subscription_type')
      .eq('user_id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user profile:', userError);
      return res.status(500).json({ success: false, error: "Greška pri dohvatanju korisničkog profila" });
    }
    
    const subscriptionType = userData?.subscription_type || 'free';
    
    // Postavi maksimalni broj pitanja na osnovu tipa pretplate
    const maxQuestions = subscriptionType === 'pro' ? PRO_USER_DAILY_QUESTION_LIMIT : FREE_USER_DAILY_QUESTION_LIMIT;
    
    // Trenutni datum (YYYY-MM-DD format)
    const today = new Date();
    const dateString = format(today, 'yyyy-MM-dd');
    
    // Dohvati broj pitanja za današnji dan
    const { data: usageData, error: usageError } = await db
      .from('ai_usage')
      .select('question_count')
      .eq('user_id', userId)
      .eq('usage_date', dateString)
      .single();
    
    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 je kod za "no rows returned"
      console.error('Error fetching AI usage:', usageError);
      return res.status(500).json({ success: false, error: "Greška pri dohvatanju podataka o korišćenju AI-a" });
    }
    
    // Broj iskorištenih pitanja danas (0 ako nema zapisa)
    const usedQuestions = usageData?.question_count || 0;
    
    // Izračunaj vreme do resetovanja (ponoć sledećeg dana)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const hoursUntilReset = Math.floor((tomorrow.getTime() - today.getTime()) / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor(((tomorrow.getTime() - today.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    
    const resetTime = `${hoursUntilReset}h ${minutesUntilReset}m`;
    
    return res.status(200).json({
      success: true,
      usedQuestions,
      maxQuestions,
      resetTime,
      subscriptionType
    });
  } catch (error) {
    console.error('Server error in daily AI usage endpoint:', error);
    return res.status(500).json({ success: false, error: "Serverska greška" });
  }
});

// Endpoint za inkrementiranje broja pitanja
router.post('/increment', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Niste prijavljeni" });
    }
    
    // Dohvati korisnika i njegov tip pretplate
    const { data: userData, error: userError } = await db
      .from('user_profiles')
      .select('subscription_type')
      .eq('user_id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user profile:', userError);
      return res.status(500).json({ success: false, error: "Greška pri dohvatanju korisničkog profila" });
    }
    
    const subscriptionType = userData?.subscription_type || 'free';
    const maxQuestions = subscriptionType === 'pro' ? PRO_USER_DAILY_QUESTION_LIMIT : FREE_USER_DAILY_QUESTION_LIMIT;
    
    // Trenutni datum (YYYY-MM-DD format)
    const today = new Date();
    const dateString = format(today, 'yyyy-MM-dd');
    
    // Dohvati trenutni broj pitanja
    const { data: usageData, error: usageError } = await db
      .from('ai_usage')
      .select('question_count, id')
      .eq('user_id', userId)
      .eq('usage_date', dateString)
      .single();
    
    // Ako nema zapisa, kreiraj novi
    if (usageError && usageError.code === 'PGRST116') {
      // Proveri da li korisnik može postaviti pitanje (samo za FREE korisnike)
      if (subscriptionType === 'free' && 1 > maxQuestions) {
        return res.status(403).json({
          success: false,
          error: "Dostignut dnevni limit pitanja",
          usedQuestions: 0,
          maxQuestions
        });
      }
      
      const { data: newUsage, error: insertError } = await db
        .from('ai_usage')
        .insert([
          { user_id: userId, usage_date: dateString, question_count: 1 }
        ])
        .select();
      
      if (insertError) {
        console.error('Error creating AI usage record:', insertError);
        return res.status(500).json({ success: false, error: "Greška pri kreiranju zapisa o korišćenju AI-a" });
      }
      
      return res.status(200).json({
        success: true,
        usedQuestions: 1,
        maxQuestions,
        limitReached: 1 >= maxQuestions
      });
    } else if (usageError) {
      console.error('Error fetching AI usage:', usageError);
      return res.status(500).json({ success: false, error: "Greška pri dohvatanju podataka o korišćenju AI-a" });
    }
    
    // Proveri da li korisnik može postaviti pitanje (samo za FREE korisnike)
    const currentCount = usageData?.question_count || 0;
    if (subscriptionType === 'free' && currentCount >= maxQuestions) {
      return res.status(403).json({
        success: false,
        error: "Dostignut dnevni limit pitanja",
        usedQuestions: currentCount,
        maxQuestions
      });
    }
    
    // Inkrementiraj broj pitanja
    const { error: updateError } = await db
      .from('ai_usage')
      .update({ question_count: currentCount + 1 })
      .eq('id', usageData.id);
    
    if (updateError) {
      console.error('Error updating AI usage:', updateError);
      return res.status(500).json({ success: false, error: "Greška pri ažuriranju podataka o korišćenju AI-a" });
    }
    
    const newCount = currentCount + 1;
    return res.status(200).json({
      success: true,
      usedQuestions: newCount,
      maxQuestions,
      limitReached: newCount >= maxQuestions
    });
  } catch (error) {
    console.error('Server error in increment AI usage endpoint:', error);
    return res.status(500).json({ success: false, error: "Serverska greška" });
  }
});

export default router;