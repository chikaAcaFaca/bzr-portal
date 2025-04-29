import { useState } from "react";
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
import { useAuth } from "../hooks/use-auth";

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
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();

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
      const { error } = await signIn(data.email, data.password);

      if (error) {
        throw error;
      }

      toast({
        title: "Uspešna prijava",
        description: "Uspešno ste se prijavili na sistem.",
      });
      
      // Navigacija će se izvršiti automatski zbog useAuth hook-a
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
      // Kreiramo korisnika pomoću hook-a
      const userData = {
        full_name: data.fullName,
        company_name: data.companyName,
        company_pib: data.companyPib,
        company_reg_number: data.companyRegNumber,
      };
      
      const { error, data: authData } = await signUp(data.email, data.password, userData);

      if (error) {
        throw error;
      }

      // Ako je verifikacija email-a isključena, možemo odmah kreirati profil
      if (authData?.user) {
        // Ovde možemo kreirati novi red u tabeli companies i povezati ga sa korisnikom
        // Ovo će biti implementirano kroz REST API na backend-u
      }

      toast({
        title: "Uspešna registracija",
        description: "Uspešno ste se registrovali na sistem. Proverite email za verifikaciju.",
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
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-800" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6l-6 6l6 6" />
          </svg>
          BZR Portal
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Sveobuhvatno rešenje za upravljanje bezbednošću i zdravljem na radu, 
              usklađeno sa najnovijim propisima Republike Srbije.
            </p>
            <footer className="text-sm">Bezbedno radno okruženje za sve zaposlene</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Dobrodošli na BZR Portal
            </h1>
            <p className="text-sm text-muted-foreground">
              Prijavite se na svoj nalog ili se registrujte za novi nalog
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Prijava</TabsTrigger>
              <TabsTrigger value="register">Registracija</TabsTrigger>
            </TabsList>
            
            {/* Login forma */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Prijava na sistem</CardTitle>
                  <CardDescription>
                    Unesite svoje podatke da biste se prijavili
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="vasa.email@kompanija.rs" {...field} />
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
                            <FormLabel>Lozinka</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Prijava u toku..." : "Prijavi se"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <div className="text-sm text-muted-foreground text-center">
                    <a href="#" className="underline underline-offset-4 hover:text-primary">
                      Zaboravili ste lozinku?
                    </a>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Register forma */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Registracija</CardTitle>
                  <CardDescription>
                    Kreirajte svoj nalog i pristupite BZR portalu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="vasa.email@kompanija.rs" {...field} />
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
                            <FormLabel>Lozinka</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
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
                            <FormLabel>Ime i prezime</FormLabel>
                            <FormControl>
                              <Input placeholder="Petar Petrović" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="border-t pt-4 my-2">
                        <h4 className="text-sm font-medium mb-2">Podaci o kompaniji</h4>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Naziv kompanije</FormLabel>
                            <FormControl>
                              <Input placeholder="Vaša Kompanija DOO" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="companyPib"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PIB</FormLabel>
                              <FormControl>
                                <Input placeholder="123456789" {...field} />
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
                              <FormLabel>Matični broj</FormLabel>
                              <FormControl>
                                <Input placeholder="12345678" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Registracija u toku..." : "Registruj se"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}