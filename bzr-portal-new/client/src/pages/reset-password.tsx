import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Redirect } from "wouter";
import { supabase } from "@/lib/supabase";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

// Validaciona šema za promenu lozinke
const resetPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Lozinka mora imati najmanje 6 karaktera",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lozinke se ne podudaraju",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Proveravamo da li postoji access token u URL-u
  useEffect(() => {
    const handleHashChange = async () => {
      // Parsiranje URL hash-a za dobijanje parametra za reset lozinke
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        console.log("Found access token in URL for password reset");
      }
    };

    // Proveravamo odmah, pa onda i na promene hash-a
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Funkcija za resetovanje lozinke
  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      // Resetovanje lozinke korišćenjem Supabase-a
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) throw error;
      
      toast({
        title: "Lozinka je uspešno promenjena",
        description: "Vaša lozinka je uspešno promenjena. Bićete preusmereni na stranicu za prijavu.",
      });
      
      // Postavljamo brojač za preusmeravanje
      setRedirectCountdown(5);
      
      // Pokrenuti odbrojavanje za preusmeravanje na login stranicu
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          const newValue = prev ? prev - 1 : null;
          if (newValue === 0) {
            clearInterval(interval);
            setLocation('/auth');
          }
          return newValue;
        });
      }, 1000);
      
    } catch (error: any) {
      toast({
        title: "Greška pri promeni lozinke",
        description: error.message || "Došlo je do greške pri promeni lozinke. Pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Ako nema korisnika i nema access_token u URL-u, možda je istekla veza za reset
  const hasResetToken = window.location.hash.includes("access_token");
  if (!user && !hasResetToken) {
    return (
      <div className="min-h-screen flex-col items-center justify-center flex">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link je istekao</CardTitle>
            <CardDescription>
              Link za resetovanje lozinke je istekao ili nije validan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Molimo vas da zatražite novi link za resetovanje lozinke na stranici za prijavu.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation('/auth')}
            >
              Povratak na prijavu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ako je korisnik već ulogovan i nema token za reset, preusmeravamo ga na glavnu stranicu
  if (user && !hasResetToken) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex-col items-center justify-center flex bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Resetovanje lozinke</CardTitle>
          <CardDescription>
            Unesite novu lozinku za vaš nalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redirectCountdown !== null ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p>Vaša lozinka je uspešno promenjena.</p>
              <p className="text-sm text-muted-foreground">
                Bićete preusmereni na stranicu za prijavu za {redirectCountdown} sekundi.
              </p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => setLocation('/auth')}
              >
                Idi odmah na prijavu
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova lozinka</FormLabel>
                      <FormControl>
                        <Input
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
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potvrda lozinke</FormLabel>
                      <FormControl>
                        <Input
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
                  className="w-full mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Promena lozinke u toku...
                    </span>
                  ) : (
                    "Promeni lozinku"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="link" onClick={() => setLocation('/auth')}>
            Povratak na prijavu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}