import { wasabiStorageService } from './wasabi-storage-service';

// Konstante za kvote skladištenja
export const STORAGE_QUOTA = {
  FREE_USER: 50 * 1024 * 1024, // 50MB u bajtovima
  PRO_USER: 1024 * 1024 * 1024, // 1GB u bajtovima
};

export interface UserStorageInfo {
  totalSize: number;
  usedSize: number;
  remainingSize: number;
  usedPercentage: number;
  quota: number;
  userType: 'free' | 'pro';
}

class UserStorageQuotaService {
  /**
   * Izračunava veličinu iskorišćenog prostora za određenog korisnika
   * @param userId ID korisnika
   * @returns Ukupna veličina u bajtovima
   */
  async calculateUserStorageSize(userId: string): Promise<number> {
    try {
      // Pribavljanje svih fajlova korisnika rekurzivno
      const allFiles = await this.getAllUserFiles(userId);
      
      // Suma veličina svih fajlova
      let totalSize = 0;
      for (const file of allFiles) {
        if (file.Size !== undefined) {
          totalSize += file.Size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error(`Greška pri izračunavanju veličine skladišta za korisnika ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Pribavlja sve fajlove korisnika rekurzivno, uključujući one u podfolderima
   * @param userId ID korisnika
   * @param prefix Opcioni prefiks za stazu (po defaultu koristi se osnovni folder korisnika)
   * @returns Lista svih fajlova
   */
  private async getAllUserFiles(userId: string, prefix?: string): Promise<any[]> {
    const userPrefix = prefix || `${userId}/`;
    const files = await wasabiStorageService.listFiles(userPrefix);
    
    let allFiles = [...files.filter(file => !file.Key.endsWith('/'))]; // Samo fajlovi, ne folderi
    
    // Rekurzivno prolazi kroz sve podfoldere
    const folders = files.filter(file => file.Key.endsWith('/'));
    for (const folder of folders) {
      if (folder.Key !== userPrefix) {
        const subFiles = await this.getAllUserFiles(userId, folder.Key);
        allFiles = [...allFiles, ...subFiles];
      }
    }
    
    return allFiles;
  }
  
  /**
   * Proverava da li korisnik ima dovoljno prostora za skladištenje novog fajla
   * @param userId ID korisnika
   * @param fileSize Veličina fajla u bajtovima
   * @param isPro Da li je korisnik PRO ili FREE
   * @returns true ako korisnik ima dovoljno prostora, false ako nema
   */
  async hasEnoughSpace(userId: string, fileSize: number, isPro: boolean): Promise<boolean> {
    try {
      const usedSize = await this.calculateUserStorageSize(userId);
      const userQuota = isPro ? STORAGE_QUOTA.PRO_USER : STORAGE_QUOTA.FREE_USER;
      
      return (usedSize + fileSize) <= userQuota;
    } catch (error) {
      console.error(`Greška pri proveri raspoloživog prostora za korisnika ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Pribavlja detaljne informacije o skladištu za korisnika
   * @param userId ID korisnika
   * @param isPro Da li je korisnik PRO ili FREE
   * @returns Informacije o skladištu
   */
  async getUserStorageInfo(userId: string, isPro: boolean): Promise<UserStorageInfo> {
    try {
      const usedSize = await this.calculateUserStorageSize(userId);
      const quota = isPro ? STORAGE_QUOTA.PRO_USER : STORAGE_QUOTA.FREE_USER;
      const remainingSize = Math.max(0, quota - usedSize);
      const usedPercentage = (usedSize / quota) * 100;
      
      return {
        totalSize: quota,
        usedSize,
        remainingSize,
        usedPercentage,
        quota,
        userType: isPro ? 'pro' : 'free'
      };
    } catch (error) {
      console.error(`Greška pri pribavljanju informacija o skladištu za korisnika ${userId}:`, error);
      throw error;
    }
  }
}

// Kreiramo instancu servisa
const userStorageQuotaService = new UserStorageQuotaService();

export { UserStorageQuotaService, userStorageQuotaService };