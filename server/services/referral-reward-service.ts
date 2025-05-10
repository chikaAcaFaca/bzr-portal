import crypto from 'crypto';
import { db } from '../db';
import { supabase } from '../lib/supabase';

// Konstante za definisanje nagrade za referal
export const FREE_REFERRAL_REWARD_BYTES = 52428800; // 50MB za FREE korisnike
export const PRO_REFERRAL_REWARD_BYTES = 157286400; // 150MB za PRO korisnike
export const REFERRAL_EXPIRY_DAYS = 365; // Trajanje nagrade 12 meseci

// Fiksne vrednosti za posebne referalne kodove
export const SPECIAL_CODES = {
  NIKOLINA: 'NIKOLINA',
  ALEXBZR: 'ALEXBZR',
  ADMIN1: 'ADMIN123',
  ADMIN2: 'ADMIN456'
};

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
const FREE_USER_BASE_STORAGE_BYTES = 100 * 1024 * 1024; // 100MB (povećano sa 50MB)
const PRO_USER_BASE_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB (povećano sa 1GB)

const FREE_USER_MAX_ADDITIONAL_STORAGE_BYTES = 3 * 1024 * 1024 * 1024; // 3GB (za besplatne korisnike) 
const PRO_USER_MAX_ADDITIONAL_STORAGE_BYTES = 50 * 1024 * 1024 * 1024; // 50GB (za PRO korisnike)
const REFERRAL_EXPIRY_DAYS_AFTER_PRO_ENDS = 365; // 12 meseci nakon isteka PRO statusa

// Supabase klijent je već inicijalizovan u lib/supabase.ts

/**
 * Servis za upravljanje referalnim programom
 */
class ReferralRewardServiceClass {
  /**
   * Vraća ukupan raspoloživi prostor za korisnika, uključujući referalni bonus
   * @param user_id ID korisnika
   * @param is_pro Da li je korisnik PRO ili FREE
   * @returns Ukupan prostor u bajtovima
   */
  async getTotalAvailableStorage(user_id: string, is_pro: boolean): Promise<number> {
    // Osnovni prostor
    const base_storage = is_pro ? PRO_USER_BASE_STORAGE_BYTES : FREE_USER_BASE_STORAGE_BYTES;
    
    try {
      // Dobavljamo informacije o referalima
      const referral_stats = await this.getReferralStats(user_id);
      
      // Vraćamo ukupan prostor
      return base_storage + referral_stats.active_space;
    } catch (error) {
      console.error('Greška pri dobavljanju ukupno dostupnog prostora:', error);
      return base_storage; // U slučaju greške, vraćamo samo osnovni prostor
    }
  }
  
  /**
   * Vraća informacije o referalima za interni prikaz
   * @param user_id ID korisnika
   * @returns Informacije o referalima ili null ako ne postoje
   */
  async getUserReferralInfo(user_id: string): Promise<{ active_space: number } | null> {
    try {
      const stats = await this.getReferralStats(user_id);
      return {
        active_space: stats.active_space
      };
    } catch (error) {
      console.error('Greška pri dobavljanju referalnih informacija:', error);
      return null;
    }
  }
  /**
   * Generiše referalni kod za korisnika
   * @param user_id ID korisnika
   * @returns Generisani referalni kod
   */
  async generateReferralCode(user_id: string): Promise<string> {
    try {
      console.log('Generisanje referral koda za korisnika ID:', user_id);
      
      // Prvo proveri da li korisnik već ima referalni kod
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user_id)
        .single();
        
      if (existingCode) {
        console.log(`Korisnik ${user_id} već ima referalni kod:`, existingCode.code);
        return existingCode.code;
      }
      
      // Kategorije posebnih korisnika prema njihovim ID-jevima
      const specialCodes: Record<string, string> = {
        // Nikad ne koristiti iste kodove za različite korisnike!
        '1': 'ADMIN123',
        'test-user-id': 'TEST123',
        
        // Ovi kodovi su samo za Nikolinu i Aleksandra - različiti su!
        '32e7c918-1bd5-43aa-a0d3-5f2d7c8c3605': 'NIK2605', // UUID Nikoline 
        '71afd2d5-e0c4-49f9-891e-2d048f286f4c': 'ALE286F'  // UUID Aleksandra
      };
      
      // Proveri da li korisnik treba da dobije poseban kod
      if (specialCodes[user_id]) {
        const specialCode = specialCodes[user_id];
        console.log(`Dodeljivanje posebnog koda ${specialCode} korisniku ${user_id}`);
        
        try {
          await supabase
            .from('referral_codes')
            .insert([
              { user_id: user_id, code: specialCode }
            ]);
        } catch (insertError) {
          console.error('Greška pri čuvanju posebnog koda:', insertError);
        }
        
        return specialCode;
      }
      
      // JEDNOSTAVAN I PREDVIDIV ALGORITAM ZA REFERALNE KODOVE
      // Format: "REF" + "000" + ID korisnika * 12 + 1
      // Za primer: prvi korisnik (ID = 1) dobija kod REF00013, drugi korisnik (ID = 2) dobija REF00025, itd.
      
      // Parsiramo ID korisnika kao broj (čak i ako je u string formatu)
      // Koristimo regularni izraz da izvučemo samo numerički deo ID-a ako je u UUID formatu
      let numericId = parseInt(user_id.replace(/[^0-9]/g, ''), 10);
      
      // Ako nismo uspeli da izvučemo broj ili je rezultat 0, koristimo 1 kao defaultnu vrednost
      if (isNaN(numericId) || numericId === 0) {
        numericId = 1;
      }
      
      // Primenjujemo formulu: ID korisnika * 12 + 1
      const codeNumber = numericId * 12 + 1;
      
      // Formiramo konačni kod u formatu REF000XX
      const uniqueCode = `REF000${codeNumber}`;
      
      console.log(`Generisan novi jedinstveni kod za korisnika ${user_id}: ${uniqueCode}`);
      
      // Sačuvaj kod u bazi
      try {
        // Pre upisivanja, proverimo da li je kod već dodeljen (ekstremno mala verovatnoća)
        const { data: existingCodeCheck } = await supabase
          .from('referral_codes')
          .select('user_id')
          .eq('code', uniqueCode)
          .single();
        
        if (existingCodeCheck) {
          console.warn(`Detektovana kolizija koda ${uniqueCode}! Generisanje novog koda...`);
          // Ako se to ikad desi, rekurzivno pozovemo metodu još jednom
          return this.generateReferralCode(user_id);
        }
        
        // Ako kod nije dodeljen, upišemo ga
        const { error } = await supabase
          .from('referral_codes')
          .insert([
            { user_id: user_id, code: uniqueCode }
          ]);
          
        if (error) {
          console.error('Greška pri čuvanju jedinstvenog koda:', error);
        }
      } catch (dbError) {
        console.error('Greška pri radu sa bazom:', dbError);
      }
      
      return uniqueCode;
    } catch (error) {
      console.error('Neočekivana greška pri generisanju referalnog koda:', error);
      
      // U slučaju greške koristimo isti algoritam, ali sa fiksnim ID-om
      const backupNumericId = 999; // Koristimo fiksni ID za backup
      const backupCodeNumber = backupNumericId * 12 + 1;
      const backupCode = `REF000${backupCodeNumber}`;
      
      console.log(`Generisan rezervni kod za korisnika ${user_id}: ${backupCode}`);
      
      return backupCode;
    }
  }

  /**
   * Vraća referalni kod za korisnika
   * @param user_id ID korisnika
   * @returns Referalni kod ili null ako ne postoji
   */
  async getReferralCode(user_id: string): Promise<string | null> {
    try {
      // Proverimo prvo da li tabela referral_codes postoji
      const { error: tableCheckError } = await supabase
        .from('referral_codes')
        .select('count')
        .limit(1);
        
      if (tableCheckError) {
        console.error('Tabela referral_codes ne postoji u getReferralCode:', tableCheckError);
        
        // Koristimo isti algoritam kao u generateReferralCode
        // Parsiramo ID korisnika kao broj
        let numericId = parseInt(user_id.replace(/[^0-9]/g, ''), 10);
        
        // Ako nismo uspeli da izvučemo broj ili je rezultat 0, koristimo 1 kao defaultnu vrednost
        if (isNaN(numericId) || numericId === 0) {
          numericId = 1;
        }
        
        // Primenjujemo formulu: ID korisnika * 12 + 1
        const codeNumber = numericId * 12 + 1;
        
        // Formiramo konačni kod u formatu REF000XX
        const stableCode = `REF000${codeNumber}`;
        
        console.log(`Generisan stabilan kod za korisnika ${user_id}: ${stableCode}`);
          
        return stableCode;
      }
      
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Greška pri dobavljanju referalnog koda:', error);
      }
      
      if (data?.code) {
        return data.code;
      }
      
      // Ako nema koda, generišemo ga
      return await this.generateReferralCode(user_id);
    } catch (error) {
      console.error('Neočekivana greška pri dobavljanju referalnog koda:', error);
      // Generišemo stabilan kod
      const stableCode = crypto
        .createHash('md5')
        .update(user_id + '-bzr-portal')
        .digest('hex')
        .substring(0, 8)
        .toUpperCase();
        
      return stableCode;
    }
  }

  /**
   * Ručno kreira referalni kod za korisnika (koristi se za administratore)
   * @param user_id ID korisnika 
   * @param code Ručno definisan kod
   * @returns Status operacije
   */
  async manuallyCreateReferralCode(user_id: string, code: string): Promise<boolean> {
    try {
      console.log(`Ručno kreiranje koda ${code} za korisnika ${user_id}`);
      
      // Provera da li korisnik već ima kod
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user_id)
        .single();
      
      if (existingCode) {
        console.log(`Korisnik ${user_id} već ima kod ${existingCode.code}, ažuriranje na ${code}`);
        // Ažuriranje postojećeg koda
        const { error } = await supabase
          .from('referral_codes')
          .update({ code })
          .eq('user_id', user_id);
        
        if (error) {
          console.error('Greška pri ažuriranju koda:', error);
          return false;
        }
        
        return true;
      }
      
      // Kreiranje novog koda ako ne postoji
      const { error } = await supabase
        .from('referral_codes')
        .insert([
          { user_id, code }
        ]);
      
      if (error) {
        console.error('Greška pri kreiranju koda:', error);
        return false;
      }
      
      console.log(`Uspešno kreiran poseban kod ${code} za korisnika ${user_id}`);
      return true;
    } catch (error) {
      console.error('Neočekivana greška pri ručnom kreiranju koda:', error);
      return false;
    }
  }

  /**
   * Vraća referalni URL za korisnika
   * @param user_id ID korisnika
   * @returns Referalni URL sa kodom
   */
  async getReferralUrl(user_id: string): Promise<string | null> {
    try {
      const code = await this.getReferralCode(user_id);
      
      if (!code) {
        return null;
      }
      
      // Generisanje URL-a sa referalnim kodom
      // Uvek koristimo bzr-portal.com kao baznu adresu
      const baseUrl = 'https://bzr-portal.com';
      
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
   * @param referrer_id ID korisnika koji je pozvao
   * @param referred_id ID korisnika koji se registrovao
   * @param referral_code Korišćeni referalni kod
   * @param is_pro_user Da li je novi korisnik PRO
   * @param source Izvor referala (blog_post, social_comment, direct_link)
   * @param social_platform Platforma za društvene mreže (opciono)
   * @param post_link Link na post (opciono)
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
      // Nagrada zavisi od tipa korisnika
      const reward_size = is_pro_user ? PRO_REFERRAL_REWARD_BYTES : FREE_REFERRAL_REWARD_BYTES;
      
      // Računanje datuma isteka nagrade (12 meseci za sve)
      const now = new Date();
      // Za sve korisnike nagrada traje 12 meseci
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + REFERRAL_EXPIRY_DAYS);
      
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
   * @param user_id ID korisnika
   * @param reward_size_bytes Veličina nagrade u bajtovima
   */
  async addReferralRewardStorage(user_id: string, reward_size_bytes: number): Promise<void> {
    try {
      // Dobavljanje podataka o skladištenju korisnika
      const { data: userStorage } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', user_id)
        .single();

      // Provera da li korisnik ima PRO status
      const { data: userData } = await supabase
        .from('users')
        .select('is_pro')
        .eq('id', user_id)
        .single();

      const is_pro = userData?.is_pro || false;
      const max_additional_storage = is_pro ? 
        PRO_USER_MAX_ADDITIONAL_STORAGE_BYTES : 
        FREE_USER_MAX_ADDITIONAL_STORAGE_BYTES;

      if (!userStorage) {
        // Ako korisnik nema podatke o skladištenju, kreiramo početni zapis
        const base_storage = is_pro ? PRO_USER_BASE_STORAGE_BYTES : FREE_USER_BASE_STORAGE_BYTES;
        
        // Ograničavamo dodatni prostor na maksimum
        const additional_storage = Math.min(reward_size_bytes, max_additional_storage);
        
        await supabase
          .from('user_storage')
          .insert([
            {
              user_id: user_id,
              base_storage_bytes: base_storage,
              additional_storage_bytes: additional_storage,
              total_used_bytes: 0
            }
          ]);
      } else {
        // Ograničavamo dodatni prostor na maksimum
        const new_additional_storage = Math.min(
          userStorage.additional_storage_bytes + reward_size_bytes,
          max_additional_storage
        );
        
        await supabase
          .from('user_storage')
          .update({
            additional_storage_bytes: new_additional_storage,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', user_id);
      }
    } catch (error) {
      console.error('Greška pri dodavanju nagradnog prostora:', error);
      throw error;
    }
  }

  /**
   * Procesira registraciju korisnika preko referalnog koda
   * @param referred_user_id ID novog korisnika
   * @param referral_code Korišćeni referalni kod
   * @param is_pro_user Da li je novi korisnik PRO
   * @param source Izvor referala
   * @param social_platform Platforma za društvene mreže (opciono)
   * @param post_link Link na post (opciono)
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
   * @param user_id ID korisnika
   * @returns Lista referala
   */
  async getUserReferrals(user_id: string): Promise<Referral[]> {
    try {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user_id)
        .order('created_at', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Greška pri dobavljanju referala korisnika:', error);
      return [];
    }
  }

  /**
   * Vraća statistiku referala za korisnika
   * @param user_id ID korisnika
   * @returns Statistika referala
   */
  async getReferralStats(user_id: string): Promise<{
    total_referrals: number;
    total_pro_referrals: number;
    earned_space: number;
    active_space: number;
    total_used_bytes: number;
    created_at: string;
  }> {
    try {
      // Dobavljanje svih referala korisnika
      const referrals = await this.getUserReferrals(user_id);
      
      // Računanje statistike
      const total_referrals = referrals.length;
      const total_pro_referrals = referrals.filter(ref => ref.is_pro_user).length;
      
      // Računanje zarađenog prostora
      const earned_space = referrals.reduce((total, ref) => total + ref.reward_size, 0);
      
      // Računanje aktivnog prostora
      const now = new Date().toISOString();
      const active_referrals = referrals.filter(ref => ref.is_active && ref.expires_at > now);
      const active_space = active_referrals.reduce((total, ref) => total + ref.reward_size, 0);
      
      // Datum prvog referala
      const created_at = referrals.length > 0 ? 
        referrals[referrals.length - 1].created_at : 
        new Date().toISOString();
      
      // Dobavljanje informacija o korišćenom prostoru
      const { data: storage } = await supabase
        .from('user_storage')
        .select('total_used_bytes')
        .eq('user_id', user_id)
        .single();
      
      const total_used_bytes = storage?.total_used_bytes || 0;
      
      return {
        total_referrals,
        total_pro_referrals,
        earned_space,
        active_space,
        total_used_bytes,
        created_at
      };
    } catch (error) {
      console.error('Greška pri dobavljanju statistike referala:', error);
      throw error;
    }
  }

  /**
   * Ažurira status PRO korisnika i prilagođava referale
   * @param user_id ID korisnika
   * @param is_pro_user Novi PRO status korisnika
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
          // Nagrada zavisi od tipa korisnika
          const reward_size = is_pro_user ? PRO_REFERRAL_REWARD_BYTES : FREE_REFERRAL_REWARD_BYTES;
          
          // Računanje novog datuma isteka (12 meseci za sve)
          const now = new Date();
          const expiryDate = new Date(now);
          expiryDate.setDate(expiryDate.getDate() + REFERRAL_EXPIRY_DAYS);
          
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
   * @param user_id ID korisnika
   * @param adjustment_bytes Prilagođavanje u bajtovima (pozitivno za dodavanje, negativno za oduzimanje)
   */
  private async adjustReferralRewardStorage(user_id: string, adjustment_bytes: number): Promise<void> {
    try {
      const { data: storage } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', user_id)
        .single();
      
      if (storage) {
        const new_additional_storage = Math.max(0, storage.additional_storage_bytes + adjustment_bytes);
        
        await supabase
          .from('user_storage')
          .update({
            additional_storage_bytes: new_additional_storage,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', user_id);
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

// Eksportujemo klasu da bi mogla biti instancirana gde je potrebno
export { ReferralRewardServiceClass };

// Kreiramo instancu servisa koju ćemo koristiti u celoj aplikaciji
const ReferralRewardService = new ReferralRewardServiceClass();

// Exportujemo je kao default za jednostavnije korišćenje u ostatku aplikacije
export default ReferralRewardService;