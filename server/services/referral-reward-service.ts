import { STORAGE_QUOTA } from './user-storage-quota-service';

// Konstante za nagrade referala
export const REFERRAL_REWARDS = {
  // Nagrada za svakog novog referala (free user)
  REFERRAL_BONUS: 50 * 1024 * 1024, // 50MB u bajtovima
  
  // Nagrada za svakog novog PRO referala
  PRO_REFERRAL_BONUS: 100 * 1024 * 1024, // 100MB u bajtovima
  
  // Maksimalni bonus prostor za FREE korisnika kroz referale
  MAX_FREE_USER_REFERRAL_SPACE: 2 * 1024 * 1024 * 1024, // 2GB u bajtovima
  
  // Maksimalni bonus prostor za PRO korisnika kroz referale
  MAX_PRO_USER_BONUS_SPACE: 3 * 1024 * 1024 * 1024, // 3GB u bajtovima
};

// Tipovi izvora referala
export enum ReferralSource {
  BLOG_POST = 'blog_post',
  SOCIAL_COMMENT = 'social_comment',
  DIRECT_LINK = 'direct_link',
  UNKNOWN = 'unknown'
}

// Tipovi podataka
export interface ReferralInfo {
  referralCode: string;      // Jedinstveni referalni kod korisnika
  userId: string;            // ID korisnika koji je vlasnik koda
  totalReferrals: number;    // Ukupan broj uspešnih referala
  totalProReferrals: number; // Broj PRO referala
  earnedSpace: number;       // Ukupno zarađen prostor (u bajtovima)
  activeSpace: number;       // Trenutno aktivan dodatni prostor (u bajtovima)
  createdAt: Date;           // Datum kreiranja referalnog koda
}

export interface ReferralEntry {
  id: string;                // Jedinstveni ID referala
  referrerId: string;        // ID korisnika koji je izvršio referal
  referredId: string;        // ID korisnika koji je došao preko referala
  referralCode: string;      // Kod koji je korišćen za referal
  isProUser: boolean;        // Da li je referal postao PRO korisnik
  createdAt: Date;           // Datum registracije referala
  expiresAt: Date;           // Datum isteka nagrade (12 meseci od registracije ili duže ako je PRO)
  rewardSize: number;        // Veličina nagrade (u bajtovima)
  isActive: boolean;         // Da li je referal aktivan (za izračunavanje aktivnog prostora)
  source: ReferralSource;    // Izvor referala - odakle je korisnik došao
  socialPlatform?: string;   // Platforma društvene mreže (ako je izvor komentar na društvenoj mreži)
  postLink?: string;         // Link na post ili komentar (ako je dostupan)
}

// Simulacija baze podataka za referale (u produkciji bi ovo bilo u pravoj bazi)
class ReferralRewardService {
  private referralCodes: Map<string, ReferralInfo> = new Map();
  private userReferrals: Map<string, ReferralEntry[]> = new Map();
  private usedReferralCodes: Map<string, string> = new Map(); // referralCode -> userId
  
  /**
   * Generiše jedinstveni referalni kod za korisnika
   * @param userId ID korisnika
   * @returns Referalni kod
   */
  generateReferralCode(userId: string): string {
    // Generišemo random string od 8 karaktera
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = '';
    for (let i = 0; i < 8; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Kreiramo informacije o referalu
    const referralInfo: ReferralInfo = {
      referralCode,
      userId,
      totalReferrals: 0,
      totalProReferrals: 0,
      earnedSpace: 0,
      activeSpace: 0,
      createdAt: new Date()
    };
    
    // Čuvamo u lokalnoj mapi (u produkciji bi bilo u bazi)
    this.referralCodes.set(referralCode, referralInfo);
    this.usedReferralCodes.set(referralCode, userId);
    this.userReferrals.set(userId, []);
    
    return referralCode;
  }
  
  /**
   * Dobija referalni kod korisnika, ili kreira novi ako ne postoji
   * @param userId ID korisnika
   * @returns Referalni kod korisnika
   */
  getUserReferralCode(userId: string): string {
    // Tražimo postojeći kod ovog korisnika
    let existingCode: string | undefined;
    
    // Koristimo .forEach umesto for...of za kompatibilnost
    this.referralCodes.forEach((info, code) => {
      if (info.userId === userId) {
        existingCode = code;
      }
    });
    
    if (existingCode) {
      return existingCode;
    }
    
    // Ako ne postoji, generišemo novi
    return this.generateReferralCode(userId);
  }
  
  /**
   * Registruje novi referal i dodeljuje nagradu
   * @param referralCode Korišćeni referalni kod
   * @param newUserId ID novog korisnika koji se registrovao putem referala
   * @param isProUser Da li je novi korisnik PRO
   * @param source Izvor referala (blog post, komentar na društvenoj mreži, direktan link)
   * @param socialPlatform Opcioni naziv platforme društvene mreže
   * @param postLink Opcioni link na post ili komentar
   * @returns true ako je referal uspešno registrovan, false ako nije
   */
  registerReferral(
    referralCode: string, 
    newUserId: string, 
    isProUser: boolean, 
    source: ReferralSource = ReferralSource.UNKNOWN,
    socialPlatform?: string,
    postLink?: string
  ): boolean {
    // Proveravamo da li kod postoji
    if (!this.usedReferralCodes.has(referralCode)) {
      return false;
    }
    
    // Dobavljamo ID korisnika koji je referisao
    const referrerId = this.usedReferralCodes.get(referralCode)!;
    
    // Proveravamo da li korisnik pokušava da referira samog sebe
    if (referrerId === newUserId) {
      return false;
    }
    
    // Dobavljamo informacije o referalu
    const referralInfo = this.referralCodes.get(referralCode)!;
    
    // Kreiramo novi referal entry
    const entry: ReferralEntry = {
      id: Math.random().toString(36).substring(2, 15),
      referrerId,
      referredId: newUserId,
      referralCode,
      isProUser,
      createdAt: new Date(),
      // Postavljamo datum isteka na 12 meseci od danas
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      rewardSize: isProUser ? REFERRAL_REWARDS.PRO_REFERRAL_BONUS : REFERRAL_REWARDS.REFERRAL_BONUS,
      isActive: true,
      source,
      socialPlatform,
      postLink
    };
    
    // Akumuliramo statistike
    referralInfo.totalReferrals++;
    if (isProUser) {
      referralInfo.totalProReferrals++;
    }
    
    // Dodajemo zarađeni prostor, uz proveru limita
    const additionalSpace = isProUser ? 
      REFERRAL_REWARDS.PRO_REFERRAL_BONUS : 
      REFERRAL_REWARDS.REFERRAL_BONUS;
    
    // Računamo maksimalno moguć prostor za ovog korisnika
    const isPro = this.isUserPro(referrerId);
    const maxSpace = isPro ? 
      REFERRAL_REWARDS.MAX_PRO_USER_BONUS_SPACE : 
      REFERRAL_REWARDS.MAX_FREE_USER_REFERRAL_SPACE;
    
    // Dodajemo zarađeni prostor, ali ne preko limita
    referralInfo.earnedSpace = Math.min(referralInfo.earnedSpace + additionalSpace, maxSpace);
    referralInfo.activeSpace = Math.min(referralInfo.activeSpace + additionalSpace, maxSpace);
    
    // Ažuriramo referalni kod
    this.referralCodes.set(referralCode, referralInfo);
    
    // Dodajemo entry u listu referala za korisnika
    if (!this.userReferrals.has(referrerId)) {
      this.userReferrals.set(referrerId, []);
    }
    this.userReferrals.get(referrerId)!.push(entry);
    
    return true;
  }
  
  /**
   * Proverava da li je korisnik PRO (u produkciji bi ovo proveravalo pravu bazu)
   * @param userId ID korisnika
   * @returns true ako je korisnik PRO, false ako nije
   */
  isUserPro(userId: string): boolean {
    // Ovo je mock implementacija, u produkciji bi proverilo pravu bazu
    // Ovde pretpostavljamo da su neki korisnici PRO za testiranje
    return userId.includes('pro');
  }
  
  /**
   * Ažurira status referala, poebno za PRO korisnike
   * @param referredUserId ID korisnika koji je došao preko referala
   * @param isProActive Da li je PRO pretplata aktivna
   */
  updateReferralStatus(referredUserId: string, isProActive: boolean): void {
    // Prolazimo kroz sve referale da nađemo entry za ovog korisnika
    this.userReferrals.forEach((entries, referrerId) => {
      for (const entry of entries) {
        if (entry.referredId === referredUserId && entry.isProUser) {
          // Ako je referal postao PRO, ažuriramo datum isteka
          if (isProActive) {
            // Postavljamo datum isteka na 12 meseci od DANAS
            entry.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            entry.isActive = true;
          } else {
            // Ostavljamo datum isteka, ali označavamo da nije aktivan
            entry.isActive = false;
          }
          
          // Ponovo izračunavamo aktivni prostor za korisnika koji je referisao
          this.recalculateActiveSpace(referrerId);
          break;
        }
      }
    });
  }
  
  /**
   * Ponovno izračunavanje aktivnog prostora za korisnika
   * @param userId ID korisnika
   */
  recalculateActiveSpace(userId: string): void {
    // Dobavljanje svih referala korisnika
    const entries = this.userReferrals.get(userId) || [];
    
    // Trenutni datum
    const now = new Date();
    
    // Pronalazimo referalni kod korisnika
    let referralInfo: ReferralInfo | undefined;
    let referralCode: string | undefined;
    
    this.referralCodes.forEach((info, code) => {
      if (info.userId === userId) {
        referralInfo = info;
        referralCode = code;
      }
    });
    
    if (!referralInfo || !referralCode) {
      return;
    }
    
    // Resetujemo aktivni prostor
    referralInfo.activeSpace = 0;
    
    // Računamo aktivni prostor na osnovu aktivnih referala
    for (const entry of entries) {
      // Proveravamo da li je referal istekao
      if (entry.expiresAt > now && entry.isActive) {
        referralInfo.activeSpace += entry.rewardSize;
      }
    }
    
    // Ograničavamo na maksimalni prostor
    const isPro = this.isUserPro(userId);
    const maxSpace = isPro ? 
      REFERRAL_REWARDS.MAX_PRO_USER_BONUS_SPACE : 
      REFERRAL_REWARDS.MAX_FREE_USER_REFERRAL_SPACE;
    
    referralInfo.activeSpace = Math.min(referralInfo.activeSpace, maxSpace);
    
    // Ažuriramo referalni kod
    this.referralCodes.set(referralCode, referralInfo);
  }
  
  /**
   * Dobija ukupan dostupan prostor za korisnika, uključujući osnovni i referalni
   * @param userId ID korisnika
   * @param isPro Da li je korisnik PRO
   * @returns Ukupan dostupan prostor u bajtovima
   */
  getTotalAvailableStorage(userId: string, isPro: boolean): number {
    // Osnovni prostor za korisnika
    const baseStorage = isPro ? STORAGE_QUOTA.PRO_USER : STORAGE_QUOTA.FREE_USER;
    
    // Dodajemo referalni prostor
    let referralBonus = 0;
    
    this.referralCodes.forEach((info) => {
      if (info.userId === userId) {
        referralBonus = info.activeSpace;
      }
    });
    
    return baseStorage + referralBonus;
  }
  
  /**
   * Dobija informacije o referalima korisnika
   * @param userId ID korisnika
   * @returns Informacije o referalima ili undefined ako korisnik nema referalni kod
   */
  getUserReferralInfo(userId: string): ReferralInfo | undefined {
    let referralInfo: ReferralInfo | undefined;
    let referralCode: string | undefined;
    
    this.referralCodes.forEach((info, code) => {
      if (info.userId === userId) {
        referralInfo = info;
        referralCode = code;
      }
    });
    
    if (referralInfo) {
      // Pre vraćanja, proveravamo da li je potrebno ažurirati aktivni prostor
      this.recalculateActiveSpace(userId);
      return this.referralCodes.get(referralCode);
    }
    
    return undefined;
  }
  
  /**
   * Dobija sve referale korisnika
   * @param userId ID korisnika
   * @returns Lista referalnih unosa ili prazna lista ako nema referala
   */
  getUserReferrals(userId: string): ReferralEntry[] {
    return this.userReferrals.get(userId) || [];
  }
  
  /**
   * Dobija informacije o referalu na osnovu koda
   * @param referralCode Referalni kod
   * @returns Informacije o referalu ili undefined ako kod ne postoji
   */
  getReferralInfoByCode(referralCode: string): ReferralInfo | undefined {
    return this.referralCodes.get(referralCode);
  }
}

// Kreiramo instancu servisa
const referralRewardService = new ReferralRewardService();

export { ReferralRewardService, referralRewardService };