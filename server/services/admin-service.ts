import { supabase } from '../lib/supabase';

/**
 * Servis za upravljanje administratorskim pravima
 */
class AdminService {
  /**
   * Proverava i dodeljuje admin prava prvom korisniku
   * @returns Promise<boolean> - True ako je dodela uspešna
   */
  public async setupFirstUserAsAdmin(): Promise<boolean> {
    try {
      // Dohvati ukupan broj korisnika
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Greška pri brojanju korisnika:', countError);
        return false;
      }
      
      // Ako postoji samo jedan korisnik, dodeli mu admin prava
      if (count === 1) {
        // Dohvati tog jednog korisnika
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        if (userError || !users || users.length === 0) {
          console.error('Greška pri dobavljanju prvog korisnika:', userError);
          return false;
        }
        
        const firstUser = users[0];
        
        // Ažuriraj korisnika sa admin rolom
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', firstUser.id);
        
        if (updateError) {
          console.error('Greška pri ažuriranju prvog korisnika:', updateError);
          return false;
        }
        
        // Ažuriraj korisničke metapodatke u auth tabeli
        const { error: metadataError } = await supabase.auth.admin.updateUserById(
          firstUser.id,
          { app_metadata: { role: 'admin' } }
        );
        
        if (metadataError) {
          console.error('Greška pri ažuriranju metapodataka:', metadataError);
          // Čak i ako ovo ne uspe, korisnik će i dalje biti admin u users tabeli
        }
        
        console.log(`Uspešno dodeljena admin prava prvom korisniku (ID: ${firstUser.id})`);
        return true;
      }
      
      // Ako postoji više korisnika, ne radi ništa
      return false;
    } catch (error) {
      console.error('Neočekivana greška pri dodeljivanju admin prava:', error);
      return false;
    }
  }

  /**
   * Dohvata broj admina u sistemu
   * @returns Promise<number> - Broj admina
   */
  public async getAdminCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      
      if (error) {
        console.error('Greška pri brojanju admin korisnika:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Neočekivana greška pri brojanju admin korisnika:', error);
      return 0;
    }
  }

  /**
   * Dodeljuje admin prava korisniku
   * @param userId ID korisnika
   * @returns Promise<boolean> - True ako je dodela uspešna
   */
  public async assignAdminRole(userId: string): Promise<boolean> {
    try {
      // Ažuriraj korisnika sa admin rolom
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Greška pri ažuriranju korisnika:', updateError);
        return false;
      }
      
      // Ažuriraj korisničke metapodatke u auth tabeli
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        userId,
        { app_metadata: { role: 'admin' } }
      );
      
      if (metadataError) {
        console.error('Greška pri ažuriranju metapodataka:', metadataError);
        // Čak i ako ovo ne uspe, korisnik će i dalje biti admin u users tabeli
      }
      
      console.log(`Uspešno dodeljena admin prava korisniku (ID: ${userId})`);
      return true;
    } catch (error) {
      console.error('Neočekivana greška pri dodeljivanju admin prava:', error);
      return false;
    }
  }
}

// Exportujemo pojedinačnu instancu servisa
export default new AdminService();