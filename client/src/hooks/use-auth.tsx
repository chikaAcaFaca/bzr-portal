import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User as SupabaseUser, AuthError, AuthResponse, AuthTokenResponsePassword } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Prošireni tip korisnika sa dodatnim poljima koja dobijamo iz profila
export interface User extends SupabaseUser {
  role?: 'admin' | 'user';
  subscriptionType?: 'free' | 'pro';
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
  signIn: (credentials: { email: string; password: string }) => Promise<AuthTokenResponsePassword>;
  signUp: (credentials: { email: string; password: string; options?: { data: any } }) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserProfile(user: SupabaseUser) {
      try {
        // Supabase auth podaci se skladište u user metapodacima
        // Koristiće se user.app_metadata za čuvanje informacija o tipu pretplate i ulozi
        const metadata = user.app_metadata || {};
        
        // Proverava se da li je korisnik jedan od predefinisanih administratora
        const adminEmails = [
          'chika.aca.cool.faca@gmail.com',
          'nikolina.jovanovic@gmail.com'
        ];
        
        // Ako je email u listi admin email-ova, dodeljujemo admin ulogu
        const isAdmin = adminEmails.includes(user.email || '');
        
        // Dobavimo ulogu i tip pretplate iz metapodataka, ako postoje
        // Ukoliko je email u adminEmails listi, dobija ulogu admina bez obzira na ostalo
        const role = isAdmin ? 'admin' : (metadata.role || 'user');
        const subscriptionType = metadata.subscription_type || 'free';
        
        return {
          role,
          subscriptionType
        };
      } catch (error) {
        console.error("Greška pri dobavljanju korisničkog profila:", error);
        // Default vrednosti ako dođe do greške
        return {
          role: 'user',
          subscriptionType: 'free'
        };
      }
    }
    
    // Inicijalno dobijanje sesije
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        // Dohvati dodatne informacije o korisniku
        const profileData = await loadUserProfile(session.user);
        
        // Proširi korisnika sa dodatnim informacijama
        const enhancedUser: User = {
          ...session.user,
          role: profileData?.role || 'user',
          subscriptionType: profileData?.subscriptionType || 'free'
        };
        
        setUser(enhancedUser);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    // Slušanje promena autentikacije
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session?.user) {
        // Dohvati dodatne informacije o korisniku
        const profileData = await loadUserProfile(session.user);
        
        // Proširi korisnika sa dodatnim informacijama
        const enhancedUser: User = {
          ...session.user,
          role: profileData?.role || 'user',
          subscriptionType: profileData?.subscriptionType || 'free'
        };
        
        setUser(enhancedUser);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (credentials: { email: string; password: string }) => {
    return supabase.auth.signInWithPassword(credentials);
  };

  const signUp = (credentials: { email: string; password: string; options?: { data: any } }) => {
    return supabase.auth.signUp(credentials);
  };

  const value: AuthContextProps = {
    session,
    user,
    isLoading,
    signOut: () => supabase.auth.signOut(),
    signIn,
    signUp
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}