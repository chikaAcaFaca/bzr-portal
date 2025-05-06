import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Redirect } from "wouter";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

// Validaciona šema za prijavu
const loginSchema = z.object({
  email: z.string().email({ message: "Unesite validnu email adresu" }),
  password: z.string().min(6, { message: "Lozinka mora imati najmanje 6 karaktera" }),
});

// Validaciona šema za registraciju
const registerSchema = z.object({
  email: z.string().email({ message: "Unesite validnu email adresu" }),
  password: z.string().min(6, { message: "Lozinka mora imati najmanje 6 karaktera" }),
  fullName: z.string().min(2, { message: "Ime mora imati najmanje 2 karaktera" }),
  companyName: z.string().min(2, { message: "Naziv kompanije mora imati najmanje 2 karaktera" }),
  companyPib: z.string().min(9, { message: "PIB mora imati tačno 9 cifara" }).max(9),
  companyRegNumber: z.string().min(8, { message: "Matični broj mora imati tačno 8 cifara" }).max(8),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading, signIn, signUp, signOut } = useAuth();
  
  // Uzimamo referalni kod iz URL-a
  useEffect(() => {
    // Dobavljanje referalnog koda iz URL parametra
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      console.log('Pronađen referalni kod:', refCode);
      setReferralCode(refCode);
      // Prebacujemo na tab za registraciju
      setActiveTab("register");
    }
  }, []);

  // Login forma - definisati pre uslovnih izjava
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register forma - definisati pre uslovnih izjava
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      companyName: "",
      companyPib: "",
      companyRegNumber: "",
    },
  });

  // Ako je korisnik već ulogovan, redirektujemo ga na glavnu stranicu
  if (user) {
    return <Redirect to="/" />;
  }
  
  // Dok se proverava autentikacija, prikazujemo loader
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Funkcija za prijavu
  async function onLoginSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      // Koristimo Supabase za prijavu korisnika
      const { error } = await signIn({ email: data.email, password: data.password });
      
      if (error) throw error;
      
      toast({
        title: "Uspešna prijava",
        description: "Uspešno ste se prijavili na sistem.",
      });
      
      // Ručno preusmeravamo na glavnu stranicu
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Greška pri prijavi",
        description: error.message || "Došlo je do greške pri prijavi. Pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Funkcija za registraciju
  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      // Koristeći Supabase za registraciju korisnika
      const { data: userData, error } = await signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            fullName: data.fullName,
            companyName: data.companyName,
            companyPib: data.companyPib,
            companyRegNumber: data.companyRegNumber,
            referral_code: referralCode || undefined // Dodajemo referalni kod ako postoji
          }
        }
      });
      
      if (error) throw error;
      
      // Ako postoji referalni kod, šaljemo ga na server
      if (referralCode && userData?.user?.id) {
        try {
          const response = await fetch('/api/referrals/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              user_id: userData.user.id,
              referral_code: referralCode
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            console.log('Referalni kod uspešno primenjen!');
          } else {
            console.error('Greška pri primeni referalnog koda:', result.error);
          }
        } catch (refError) {
          console.error('Greška pri slanju referalnog koda:', refError);
        }
      }
      
      toast({
        title: "Uspešna registracija",
        description: "Proverite email za verifikaciju naloga.",
      });

      // Prebacujemo na login tabelu
      setActiveTab("login");
    } catch (error: any) {
      toast({
        title: "Greška pri registraciji",
        description: error.message || "Došlo je do greške pri registraciji. Pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex-col items-center justify-center grid lg:grid-cols-2 lg:px-0 bg-gradient-to-br from-background to-secondary/40">
      <div className="relative hidden h-full flex-col lg:flex">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/90 to-accent/80 rounded-r-3xl overflow-hidden">
          {/* Dekorativni elementi */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-12 right-12 w-80 h-80 bg-white/10 rounded-full blur-xl"></div>
        </div>
        <div className="relative z-20 flex items-center text-2xl font-bold text-white p-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-3 h-8 w-8"
          >
            <path d="M15 6l-6 6l6 6" />
          </svg>
          BZR Portal
        </div>
        <div className="relative z-20 mt-auto p-10">
          <blockquote className="space-y-4">
            <p className="text-xl text-white font-medium">
              Sveobuhvatno rešenje za upravljanje bezbednošću i zdravljem na radu, 
              usklađeno sa najnovijim propisima Republike Srbije.
            </p>
            <footer className="text-white/90 pt-2 text-base">Bezbedno radno okruženje za sve zaposlene</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 flex items-center justify-center">
        <div className="mx-auto w-full max-w-md p-6 sm:p-8 bg-card rounded-2xl shadow-lg border border-border/40">
          <div className="flex flex-col space-y-3 text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-heading">
              Dobrodošli na BZR Portal
            </h1>
            <p className="text-muted-foreground">
              Prijavite se na svoj nalog ili se registrujte za novi nalog
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-secondary/70 rounded-lg mb-2">
              <TabsTrigger 
                value="login" 
                className="rounded-md font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Prijava
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-md font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Registracija
              </TabsTrigger>
            </TabsList>
            
            {/* Login forma */}
            <TabsContent value="login">
              <div className="p-1 mt-4">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Prijava na sistem</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unesite svoje podatke da biste se prijavili
                  </p>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/90">Email</FormLabel>
                          <FormControl>
                            <Input 
                              className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                              placeholder="vasa.email@kompanija.rs" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/90">Lozinka</FormLabel>
                          <FormControl>
                            <Input 
                              className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full mt-6 bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5" 
                      disabled={isLoading}
                    >
                      {isLoading ? 
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Prijava u toku...
                        </span> : 
                        "Prijavi se"
                      }
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 text-center">
                  <Button 
                    variant="link" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 p-0"
                    onClick={async () => {
                      const email = loginForm.getValues("email");
                      if (!email) {
                        toast({
                          title: "Unesite email",
                          description: "Molimo unesite email adresu za koju želite da resetujete lozinku.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setIsLoading(true);
                      try {
                        await signOut();
                        // Dobavljamo trenutni domen (ili Replit URL ili prilagođeni domen)
                        const currentSiteUrl = window.location.origin;
                        console.log("Reset password redirect URL:", `${currentSiteUrl}/reset-password`);
                        
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${currentSiteUrl}/reset-password`,
                        });
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Email za resetovanje poslat",
                          description: "Proverite svoj email za instrukcije za resetovanje lozinke.",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Greška",
                          description: error.message || "Došlo je do greške pri slanju zahteva za resetovanje lozinke.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Zaboravili ste lozinku?
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Register forma */}
            <TabsContent value="register">
              <div className="p-1 mt-4">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Registracija</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kreirajte svoj nalog i pristupite BZR portalu
                  </p>
                </div>
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/90">Email</FormLabel>
                          <FormControl>
                            <Input 
                              className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                              placeholder="vasa.email@kompanija.rs" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/90">Lozinka</FormLabel>
                          <FormControl>
                            <Input 
                              className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/90">Ime i prezime</FormLabel>
                          <FormControl>
                            <Input 
                              className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                              placeholder="Petar Petrović" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="my-4">
                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink mx-3 text-sm text-muted-foreground">Podaci o kompaniji</span>
                        <div className="flex-grow border-t border-border"></div>
                      </div>
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/90">Naziv kompanije</FormLabel>
                          <FormControl>
                            <Input 
                              className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                              placeholder="Vaša Kompanija DOO" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="companyPib"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/90">PIB</FormLabel>
                            <FormControl>
                              <Input 
                                className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                                placeholder="123456789" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="companyRegNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/90">Matični broj</FormLabel>
                            <FormControl>
                              <Input 
                                className="rounded-lg border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                                placeholder="12345678" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-6 bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5" 
                      disabled={isLoading}
                    >
                      {isLoading ? 
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registracija u toku...
                        </span> : 
                        "Registruj se"
                      }
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}