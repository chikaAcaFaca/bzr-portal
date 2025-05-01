import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

/**
 * Komponenta koja štiti rute koje zahtevaju autentikaciju
 * Preusmeriće korisnika na /auth ako nije prijavljen
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // useEffect će preusmeriti korisnika
  }

  return <>{children}</>;
}

/**
 * Komponenta koja štiti admin rute
 * Preusmeriće korisnika na početnu stranicu ako nije admin
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else if (user.role !== "admin") {
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // useEffect će preusmeriti korisnika
  }

  return <>{children}</>;
}

/**
 * Komponenta koja štiti PRO rute
 * Prikazuje rezervni sadržaj (fallback) ako korisnik nije PRO
 */
export function RequirePro({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Ako korisnik nije prijavljen ili nije PRO, prikaži rezervni sadržaj
  if (!user || user.subscriptionType !== "pro") {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Komponenta koja preusmerava autentifikovane korisnike
 * Koristi se za stranice kao što je /auth koje ne bi trebale biti dostupne prijavljenim korisnicima
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null; // useEffect će preusmeriti korisnika
  }

  return <>{children}</>;
}

/**
 * Komponenta koja ograničava AI asistenta za FREE korisnike
 * FREE korisnici mogu koristiti AI asistenta samo za BZR teme
 */
export function LimitedAIAssistant({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // AI asistent je dostupan svim prijavljenim korisnicima, ali FREE korisnici imaju ograničenja
  if (!user) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-700">
        Morate biti prijavljeni da biste koristili AI asistenta. 
        <a href="/auth" className="ml-2 underline font-semibold">Prijavite se</a>
      </div>
    );
  }

  return <>{children}</>;
}