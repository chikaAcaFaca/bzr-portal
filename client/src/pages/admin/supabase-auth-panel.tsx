import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, RefreshCw, UserPlus, UserX, MailCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interface za korisnika iz Supabase Auth
interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata?: any;
  app_metadata?: any;
}

// Komponenta za prikaz panela za upravljanje Supabase autentikacijom
export default function SupabaseAuthPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resendVerificationEmail, setResendVerificationEmail] = useState("");

  // Provera da li je korisnik admin
  if (!user?.role || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  // Učitavanje korisnika pri prvom renderovanju
  useEffect(() => {
    fetchUsers();
  }, []);

  // Funkcija za dobavljanje korisnika iz Supabase Auth
  async function fetchUsers() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/supabase-auth/list-users');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Greška pri dobavljanju korisnika');
      }
      
      setUsers(data.users || []);
    } catch (error: any) {
      setError(error.message || 'Došlo je do greške pri učitavanju korisnika');
      console.error('Greška pri dobavljanju korisnika:', error);
    } finally {
      setLoading(false);
    }
  }

  // Funkcija za potpuno brisanje korisnika
  async function deleteUser(userId: string) {
    try {
      const response = await fetch(`/api/supabase-auth/users/${userId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Greška pri brisanju korisnika');
      }
      
      // Uklanjamo korisnika iz liste
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: "Korisnik je uspešno izbrisan",
        description: "Korisnik je izbrisan iz baze i autentikacionog sistema",
      });
    } catch (error: any) {
      toast({
        title: "Greška pri brisanju korisnika",
        description: error.message || 'Došlo je do greške pri brisanju korisnika',
        variant: "destructive",
      });
      console.error('Greška pri brisanju korisnika:', error);
    } finally {
      setDeleteUserId(null);
      setIsDeleteDialogOpen(false);
    }
  }

  // Funkcija za sinhronizaciju korisnika
  async function syncUsers() {
    try {
      const response = await fetch('/api/supabase-auth/sync-users', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Greška pri sinhronizaciji korisnika');
      }
      
      toast({
        title: "Korisnici su uspešno sinhronizovani",
        description: `${data.results?.length || 0} korisnika je sinhronizovano`,
      });
      
      // Osvežavamo listu korisnika
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Greška pri sinhronizaciji korisnika",
        description: error.message || 'Došlo je do greške pri sinhronizaciji korisnika',
        variant: "destructive",
      });
      console.error('Greška pri sinhronizaciji korisnika:', error);
    }
  }

  // Funkcija za slanje verifikacionog emaila
  async function sendVerificationEmail(email: string) {
    if (!email) {
      toast({
        title: "Greška",
        description: "Email adresa je obavezna",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/supabase-auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Greška pri slanju verifikacionog emaila');
      }
      
      toast({
        title: "Verifikacioni email je poslat",
        description: `Verifikacioni email je poslat na ${email}`,
      });
      
      // Resetujemo polje za email
      setResendVerificationEmail("");
    } catch (error: any) {
      toast({
        title: "Greška pri slanju verifikacionog emaila",
        description: error.message || 'Došlo je do greške pri slanju verifikacionog emaila',
        variant: "destructive",
      });
      console.error('Greška pri slanju verifikacionog emaila:', error);
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Upravljanje korisnicima (Supabase Auth)</CardTitle>
          <CardDescription>
            Ovde možete videti i upravljati korisnicima u Supabase Auth sistemu.
            Ova stranica omogućava potpuno brisanje korisnika i iz baze i iz autentikacionog sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Osveži listu korisnika
            </Button>
            
            <Button 
              variant="outline" 
              onClick={syncUsers}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Sinhronizuj korisnike
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-muted/40 p-4 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="verification-email" className="mb-2 block">Email za slanje verifikacije</Label>
              <div className="flex gap-2">
                <Input 
                  id="verification-email"
                  value={resendVerificationEmail}
                  onChange={(e) => setResendVerificationEmail(e.target.value)}
                  placeholder="korisnik@example.com"
                  className="flex-1"
                />
                <Button 
                  variant="default" 
                  onClick={() => sendVerificationEmail(resendVerificationEmail)}
                  className="whitespace-nowrap flex items-center gap-2"
                >
                  <MailCheck className="w-4 h-4" />
                  Pošalji
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Koristite ovu funkciju da pošaljete verifikacioni email korisnicima koji se ne mogu prijaviti.
              </p>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Greška</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Kreirano</TableHead>
                  <TableHead>Poslednja prijava</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nema korisnika u sistemu
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell className="text-xs truncate max-w-[120px]">{user.id}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nije se prijavljivao'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog 
                          open={isDeleteDialogOpen && deleteUserId === user.id} 
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setDeleteUserId(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setDeleteUserId(user.id)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Izbriši
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Potvrda brisanja korisnika</DialogTitle>
                              <DialogDescription>
                                Da li ste sigurni da želite da izbrišete korisnika <strong>{user.email}</strong> iz sistema?
                                Ova akcija je nepovratna i izbrisaće korisnika i iz baze podataka i iz Supabase Auth sistema.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setIsDeleteDialogOpen(false);
                                  setDeleteUserId(null);
                                }}
                              >
                                Otkaži
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => deleteUser(user.id)}
                                className="flex items-center gap-2"
                              >
                                <UserX className="w-4 h-4" />
                                Izbriši korisnika
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => sendVerificationEmail(user.email)}
                          className="ml-2 flex items-center gap-2"
                        >
                          <MailCheck className="w-4 h-4" />
                          Verifikuj
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}