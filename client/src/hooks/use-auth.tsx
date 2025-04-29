import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; data: { user: User | null; session: Session | null } }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null; data: { user: User | null; session: Session | null } }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicijalno dobijanje sesije
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Slušanje promena autentikacije
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = (email: string, password: string, userData?: any) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
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