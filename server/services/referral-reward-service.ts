import crypto from 'crypto';
import { db } from '../db';
import { createClient } from '@supabase/supabase-js';

// Tipovi za Supabase bazu
interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  is_pro_user: boolean;
  created_at: string;
  expires_at: string;
  reward_size: number;
  is_active: boolean;
  source: string;
  social_platform?: string;
  post_link?: string;
}

interface UserStorage {
  id: string;
  user_id: string;
  base_storage_bytes: number;
  additional_storage_bytes: number;
  total_used_bytes: number;
  last_updated: string;
}

// Konstante za referralni program
const FREE_USER_BASE_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB
const PRO_USER_BASE_STORAGE_BYTES = 1024 * 1024 * 1024; // 1GB

const BASE_REFERRAL_REWARD_BYTES = 50 * 1024 * 1024; // 50MB za svakog novog korisnika (FREE ili PRO)
const PRO_REFERRAL_BONUS_BYTES = 50 * 1024 * 1024; // Dodatnih 50MB ako je korisnik PRO

const FREE_USER_MAX_ADDITIONAL_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const PRO_USER_MAX_ADDITIONAL_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

const REFERRAL_EXPIRY_DAYS_AFTER_PRO_ENDS = 365; // 12 meseci

// Inicijalizacija Supabase klijenta
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL i anonimni ključ moraju biti definisani u env varijablama');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Servis za upravljanje referalnim programom
 */
class ReferralRewardService {
  /**
   * Vraća ukupan raspoloživi prostor za korisnika, uključujući referalni bonus
   * @param userId ID korisnika
   * @param isPro Da li je korisnik PRO ili FREE
   * @returns Ukupan prostor u bajtovima
   */
  async getTotalAvailableStorage(userId: string, isPro: boolean): Promise<number> {
    // Osnovni prostor
    const baseStorage = isPro ? PRO_USER_BASE_STORAGE_BYTES : FREE_USER_BASE_STORAGE_BYTES;
    
    try {
      // Dobavljamo informacije o referalima
      const referralStats = await this.getReferralStats(userId);
      
      // Vraćamo ukupan prostor
      return baseStorage + referralStats.activeSpace;
    } catch (error) {
      console.error('Greška pri dobavljanju ukupno dostupnog prostora:', error);
      return baseStorage; // U slučaju greške, vraćamo samo osnovni prostor
    }
  }
  
  /**
   * Vraća informacije o referalima za interni prikaz
   * @param userId ID korisnika
   * @returns Informacije o referalima ili null ako ne postoje
   */
  async getUserReferralInfo(userId: string): Promise<{ activeSpace: number } | null> {
    try {
      const stats = await this.getReferralStats(userId);
      return {
        activeSpace: stats.activeSpace
      };
    } catch (error) {
      console.error('Greška pri dobavljanju referalnih informacija:', error);
      return null;
    }
  }
  /**
   * Generiše referalni kod za korisnika
   * @param userId ID korisnika
   * @returns Generisani referalni kod
   */
  async generateReferralCode(userId: string): Promise<string> {
    try {
      // Proveriti da li korisnik već ima referalni kod
      const { data: existingCodes } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingCodes) {
        return existingCodes.code;
      }

      // Generisanje novog koda
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();

      // Čuvanje koda u bazi
      const { data, error } = await supabase
        .from('referral_codes')
        .insert([
          { user_id: userId, code }
        ])
        .select();

      if (error) {
        throw new Error(`Greška prilikom čuvanja referalnog koda: ${error.message}`);
      }

      return code;
    } catch (error) {
      console.error('Greška pri generisanju referalnog koda:', error);
      throw error;
    }
  }

  /**
   * Vraća referalni kod za korisnika
   * @param userId ID korisnika
   * @returns Referalni kod ili null ako ne postoji
   */
  async getReferralCode(userId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      return data?.code || null;
    } catch (error) {
      console.error('Greška pri dobavljanju referalnog koda:', error);
      return null;
    }
  }

  /**
   * Vraća referalni URL za korisnika
   * @param userId ID korisnika
   * @returns Referalni URL sa kodom
   */
  async getReferralUrl(userId: string): Promise<string | null> {
    try {
      const code = await this.getReferralCode(userId);
      
      if (!code) {
        return null;
      }
      
      // Generisanje URL-a sa referalnim kodom
      // U produkciji, koristićemo pravu URL adresu sajta
      const baseUrl = process.env.APP_URL || 'https://bzrportal.com';
      return `${baseUrl}/auth?ref=${code}`;
    } catch (error) {
      console.error('Greška pri generisanju referalnog URL-a:', error);
      return null;
    }
  }

  /**
   * Pronalazi korisnika po referalnom kodu
   * @param code Referalni kod
   * @returns ID korisnika ili null ako kod ne postoji
   */
  async findUserByReferralCode(code: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', code)
        .single();

      return data?.user_id || null;
    } catch (error) {
      console.error('Greška pri pronalaženju korisnika po referalnom kodu:', error);
      return null;
    }
  }

  /**
   * Kreira novu referalnu vezu između dva korisnika
   * @param referrerId ID korisnika koji je pozvao
   * @param referredId ID korisnika koji se registrovao
   * @param referralCode Korišćeni referalni kod
   * @param isProUser Da li je novi korisnik PRO
   * @param source Izvor referala (blog_post, social_comment, direct_link)
   * @param socialPlatform Platforma za društvene mreže (opciono)
   * @param postLink Link na post (opciono)
   */
  async createReferral(
    referrer_id: string,
    referred_id: string,
    referral_code: string,
    is_pro_user: boolean = false,
    source: 'blog_post' | 'social_comment' | 'direct_link' | 'unknown' = 'direct_link',
    social_platform?: string,
    post_link?: string
  ): Promise<Referral | null> {
    try {
      // Nagrada je uvek 50MB osnovnih + dodatnih 50MB ako je korisnik PRO
      const reward_size = BASE_REFERRAL_REWARD_BYTES + (is_pro_user ? PRO_REFERRAL_BONUS_BYTES : 0);
      
      // Računanje datuma isteka nagrade
      // Za besplatne korisnike, nagrada nikad ne ističe (30 godina u budućnost)
      // Za PRO korisnike, nagrada ističe nakon isteka PRO pretplate + dodatnih 12 meseci
      const now = new Date();
      const expiryDate = is_pro_user
        ? new Date(now.setDate(now.getDate() + REFERRAL_EXPIRY_DAYS_AFTER_PRO_ENDS))
        : new Date(now.setFullYear(now.getFullYear() + 30));
      
      const { data, error } = await supabase
        .from('referrals')
        .insert([
          {
            referrer_id,
            referred_id,
            referral_code,
            is_pro_user,
            reward_size,
            expires_at: expiryDate.toISOString(),
            is_active: true,
            source,
            social_platform,
            post_link
          }
        ])
        .select();

      if (error) {
        throw new Error(`Greška prilikom kreiranja referala: ${error.message}`);
      }

      // Dodavanje nagradnog prostora za skladištenje
      await this.addReferralRewardStorage(referrer_id, reward_size);

      return data[0] || null;
    } catch (error) {
      console.error('Greška pri kreiranju referala:', error);
      throw error;
    }
  }

  /**
   * Dodaje nagradni prostor za skladištenje korisniku
   * @param userId ID korisnika
   * @param rewardSizeBytes Veličina nagrade u bajtovima
   */
  async addReferralRewardStorage(userId: string, rewardSizeBytes: number): Promise<void> {
    try {
      // Dobavljanje podataka o skladištenju korisnika
      const { data: userStorage } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Provera da li korisnik ima PRO status
      const { data: userData } = await supabase
        .from('users')
        .select('is_pro')
        .eq('id', userId)
        .single();

      const isPro = userData?.is_pro || false;
      const maxAdditionalStorage = isPro ? 
        PRO_USER_MAX_ADDITIONAL_STORAGE_BYTES : 
        FREE_USER_MAX_ADDITIONAL_STORAGE_BYTES;

      if (!userStorage) {
        // Ako korisnik nema podatke o skladištenju, kreiramo početni zapis
        const baseStorage = isPro ? PRO_USER_BASE_STORAGE_BYTES : FREE_USER_BASE_STORAGE_BYTES;
        
        // Ograničavamo dodatni prostor na maksimum
        const additionalStorage = Math.min(rewardSizeBytes, maxAdditionalStorage);
        
        await supabase
          .from('user_storage')
          .insert([
            {
              user_id: userId,
              base_storage_bytes: baseStorage,
              additional_storage_bytes: additionalStorage,
              total_used_bytes: 0
            }
          ]);
      } else {
        // Ograničavamo dodatni prostor na maksimum
        const newAdditionalStorage = Math.min(
          userStorage.additional_storage_bytes + rewardSizeBytes,
          maxAdditionalStorage
        );
        
        await supabase
          .from('user_storage')
          .update({
            additional_storage_bytes: newAdditionalStorage,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Greška pri dodavanju nagradnog prostora:', error);
      throw error;
    }
  }

  /**
   * Procesira registraciju korisnika preko referalnog koda
   * @param referredUserId ID novog korisnika
   * @param referralCode Korišćeni referalni kod
   * @param isProUser Da li je novi korisnik PRO
   * @param source Izvor referala
   * @param socialPlatform Platforma za društvene mreže (opciono)
   * @param postLink Link na post (opciono)
   * @returns true ako je uspešno, false ako ne
   */
  async processReferral(
    referred_user_id: string,
    referral_code: string,
    is_pro_user: boolean = false,
    source: 'blog_post' | 'social_comment' | 'direct_link' | 'unknown' = 'direct_link',
    social_platform?: string,
    post_link?: string
  ): Promise<boolean> {
    try {
      // Pronalaženje korisnika koji je dao referral
      const referrer_id = await this.findUserByReferralCode(referral_code);
      
      if (!referrer_id) {
        return false;
      }
      
      // Provera da li referral već postoji
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', referred_user_id)
        .single();
      
      if (existingReferral) {
        // Referral već postoji, ne možemo imati duplikate
        return false;
      }
      
      // Kreiranje novog referrala
      await this.createReferral(
        referrer_id,
        referred_user_id,
        referral_code,
        is_pro_user,
        source,
        social_platform,
        post_link
      );
      
      return true;
    } catch (error) {
      console.error('Greška pri procesiranju referala:', error);
      return false;
    }
  }

  /**
   * Vraća sve referale za korisnika
   * @param userId ID korisnika
   * @returns Lista referala
   */
  async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Greška pri dobavljanju referala korisnika:', error);
      return [];
    }
  }

  /**
   * Vraća statistiku referala za korisnika
   * @param userId ID korisnika
   * @returns Statistika referala
   */
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalProReferrals: number;
    earnedSpace: number;
    activeSpace: number;
    createdAt: string;
  }> {
    try {
      // Dobavljanje svih referala korisnika
      const referrals = await this.getUserReferrals(userId);
      
      // Računanje statistike
      const totalReferrals = referrals.length;
      const totalProReferrals = referrals.filter(ref => ref.is_pro_user).length;
      
      // Računanje zarađenog prostora
      const earnedSpace = referrals.reduce((total, ref) => total + ref.reward_size, 0);
      
      // Računanje aktivnog prostora
      const now = new Date().toISOString();
      const activeReferrals = referrals.filter(ref => ref.is_active && ref.expires_at > now);
      const activeSpace = activeReferrals.reduce((total, ref) => total + ref.reward_size, 0);
      
      // Datum prvog referala
      const createdAt = referrals.length > 0 ? 
        referrals[referrals.length - 1].created_at : 
        new Date().toISOString();
      
      return {
        totalReferrals,
        totalProReferrals,
        earnedSpace,
        activeSpace,
        createdAt
      };
    } catch (error) {
      console.error('Greška pri dobavljanju statistike referala:', error);
      throw error;
    }
  }

  /**
   * Ažurira status PRO korisnika i prilagođava referale
   * @param userId ID korisnika
   * @param isProUser Novi PRO status korisnika
   */
  async updateUserProStatus(user_id: string, is_pro_user: boolean): Promise<void> {
    try {
      // Ažuriranje korisnikovog PRO statusa
      await supabase
        .from('users')
        .update({ is_pro: is_pro_user })
        .eq('id', user_id);
      
      // Ako korisnik postaje PRO, treba da ažuriramo njegovo bazno skladište
      if (is_pro_user) {
        const { data: storage } = await supabase
          .from('user_storage')
          .select('*')
          .eq('user_id', user_id)
          .single();
        
        if (storage) {
          await supabase
            .from('user_storage')
            .update({
              base_storage_bytes: PRO_USER_BASE_STORAGE_BYTES,
              last_updated: new Date().toISOString()
            })
            .eq('user_id', user_id);
        } else {
          // Ako ne postoji zapis, kreiramo novi
          await supabase
            .from('user_storage')
            .insert([{
              user_id: user_id,
              base_storage_bytes: PRO_USER_BASE_STORAGE_BYTES,
              additional_storage_bytes: 0,
              total_used_bytes: 0
            }]);
        }
      }
      
      // Ažuriranje postojećih referala gde je ovaj korisnik referral
      // Potrebno je ažurirati is_pro_user status i rewards
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', user_id);
      
      if (referrals && referrals.length > 0) {
        const referral = referrals[0];
        
        if (referral.is_pro_user !== is_pro_user) {
          // Ažuriranje statusa referala
          // Nagrada je uvek 50MB osnovnih + dodatnih 50MB ako je korisnik PRO
          const reward_size = BASE_REFERRAL_REWARD_BYTES + (is_pro_user ? PRO_REFERRAL_BONUS_BYTES : 0);
          
          // Računanje novog datuma isteka
          const now = new Date();
          const expiryDate = is_pro_user
            ? new Date(now.setDate(now.getDate() + REFERRAL_EXPIRY_DAYS_AFTER_PRO_ENDS))
            : new Date(now.setFullYear(now.getFullYear() + 30));
          
          await supabase
            .from('referrals')
            .update({
              is_pro_user: is_pro_user,
              reward_size: reward_size,
              expires_at: expiryDate.toISOString(),
              is_active: true
            })
            .eq('id', referral.id);
          
          // Ažuriranje nagrade za referrera
          // Prvo oduzimamo staru nagradu
          await this.adjustReferralRewardStorage(referral.referrer_id, -referral.reward_size);
          
          // Zatim dodajemo novu nagradu
          await this.adjustReferralRewardStorage(referral.referrer_id, reward_size);
        }
      }
    } catch (error) {
      console.error('Greška pri ažuriranju PRO statusa korisnika:', error);
      throw error;
    }
  }

  /**
   * Prilagođava nagradni prostor za skladištenje korisnika
   * @param userId ID korisnika
   * @param adjustmentBytes Prilagođavanje u bajtovima (pozitivno za dodavanje, negativno za oduzimanje)
   */
  private async adjustReferralRewardStorage(userId: string, adjustmentBytes: number): Promise<void> {
    try {
      const { data: storage } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (storage) {
        const newAdditionalStorage = Math.max(0, storage.additional_storage_bytes + adjustmentBytes);
        
        await supabase
          .from('user_storage')
          .update({
            additional_storage_bytes: newAdditionalStorage,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Greška pri prilagođavanju nagradnog prostora:', error);
      throw error;
    }
  }

  /**
   * Proverava i ažurira istekle referale
   * Ova funkcija bi trebalo da se poziva periodično (npr. jednom dnevno)
   */
  async checkExpiredReferrals(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Pronalaženje svih isteklih referala koji su još uvek aktivni
      const { data: expiredReferrals } = await supabase
        .from('referrals')
        .select('*')
        .lt('expires_at', now)
        .eq('is_active', true);
      
      if (!expiredReferrals || expiredReferrals.length === 0) {
        return;
      }
      
      // Ažuriranje statusa referala i skladišta korisnika
      for (const referral of expiredReferrals) {
        // Prvo označiti referral kao neaktivan
        await supabase
          .from('referrals')
          .update({ is_active: false })
          .eq('id', referral.id);
        
        // Zatim oduzeti nagradu od skladišta korisnika
        await this.adjustReferralRewardStorage(referral.referrer_id, -referral.reward_size);
      }
    } catch (error) {
      console.error('Greška pri proveri isteklih referala:', error);
      throw error;
    }
  }
}

export default new ReferralRewardService();