import { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// Komponenta koja štiti rute koje zahtevaju autentikaciju
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Dok se proverava autentikacija, prikazujemo loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Ako korisnik nije prijavljen, preusmeravamo ga na auth stranicu
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  // Ako je korisnik prijavljen, prikazujemo komponentu
  return <>{children}</>;
}

// Komponenta koja štiti admin rute
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Dok se proverava autentikacija, prikazujemo loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Ako korisnik nije prijavljen ili nije admin, preusmeravamo ga
  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }
  
  // Ako je korisnik admin, prikazujemo komponentu
  return <>{children}</>;
}

// Komponenta koja štiti PRO funkcionalnosti
export function RequirePro({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  const { user, isLoading } = useAuth();
  
  // Dok se proverava autentikacija, prikazujemo loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Ako korisnik nije PRO, prikazujemo alternativni sadržaj ili redirect
  if (!user || user.subscriptionType !== "pro") {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Ako nema fallback komponente, prikazujemo poruku o nadogradnji
    return (
      <div className="p-6 bg-muted rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">PRO funkcionalnost</h3>
        <p className="mb-4 text-muted-foreground">
          Ova funkcionalnost je dostupna samo PRO korisnicima. Nadogradite svoj nalog da biste pristupili ovoj funkciji.
        </p>
        <a 
          href="/settings" 
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Nadogradi na PRO
        </a>
      </div>
    );
  }
  
  // Ako je korisnik PRO, prikazujemo komponentu
  return <>{children}</>;
}

// Komponenta koja usmerava već autentifikovane korisnike na glavnu stranicu
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Dok se proverava autentikacija, prikazujemo loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Ako je korisnik prijavljen, preusmeravamo ga na glavnu stranicu
  if (user) {
    navigate("/");
    return null;
  }
  
  // Ako korisnik nije prijavljen, prikazujemo komponentu
  return <>{children}</>;
}

// Komponenta koja ograničava AI asistenta za FREE korisnike
export function LimitedAIAssistant({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  
  // Dok se proverava autentikacija, prikazujemo loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Ovde će se implementirati logika ograničavanja AI asistenta za FREE korisnike
  // Potrebna je dodatna logika da se proveri da li je pitanje vezano za BZR PORTAL
  
  return <>{children}</>;
}