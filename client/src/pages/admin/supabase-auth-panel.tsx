import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  UserPlus, 
  Trash, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  UserCheck,
  Database,
  Plus,
  Trash2
} from '@/lib/icons';

interface SupabaseUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  lastSignIn: string | null;
  createdAt: string;
  updatedAt: string;
  existsInDb: boolean;
  userMetadata: Record<string, any>;
}

interface NewUserData {
  email: string;
  password: string;
}

export default function SupabaseAuthPanel() {
  return <SupabaseAuthPanelContent />;
}

function SupabaseAuthPanelContent() {
  const { toast } = useToast();
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SupabaseUser | null>(null);
  const [newUser, setNewUser] = useState<NewUserData>({ email: '', password: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  
  // Funkcija za učitavanje korisnika
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supabase-auth/supabase-users');
      
      if (!response.ok) {
        throw new Error('Nije moguće pribaviti Supabase korisnike');
      }
      
      const data = await response.json();
      // Provera da li je data.users niz, ako nije, koristimo prazan niz
      const userArray = Array.isArray(data.users) ? data.users : [];
      setUsers(userArray);
      setFilteredUsers(userArray);
      
      // Prikazujemo poruku ako postoji
      if (data.message) {
        toast({
          title: 'Informacija',
          description: data.message,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Greška pri učitavanju',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Učitavanje korisnika pri prvom renderovanju
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Filtriranje korisnika
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);
  
  // Funkcija za sinhronizaciju korisnika
  const syncUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/supabase-auth/sync-user/${userId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Greška pri sinhronizaciji korisnika');
      }
      
      toast({
        title: 'Korisnik sinhronizovan',
        description: 'Korisnik je uspešno dodat u bazu podataka aplikacije',
        variant: 'default'
      });
      
      // Osvežavanje liste korisnika
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Greška pri sinhronizaciji',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Funkcija za brisanje korisnika
  const deleteUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/supabase-auth/delete-auth-user/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Greška pri brisanju korisnika');
      }
      
      toast({
        title: 'Korisnik obrisan',
        description: 'Korisnik je uspešno obrisan iz Supabase Auth baze',
        variant: 'default'
      });
      
      // Osvežavanje liste korisnika
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Greška pri brisanju',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Funkcija za kreiranje novog korisnika
  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: 'Nedostaju podaci',
        description: 'Email i lozinka su obavezni',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await fetch('/api/supabase-auth/create-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Greška pri kreiranju korisnika');
      }
      
      toast({
        title: 'Korisnik kreiran',
        description: 'Novi korisnik je uspešno kreiran u Supabase Auth bazi',
        variant: 'default'
      });
      
      // Resetovanje podataka novog korisnika
      setNewUser({ email: '', password: '' });
      setShowAddUserDialog(false);
      
      // Osvežavanje liste korisnika
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Greška pri kreiranju',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Formatiranje datuma
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nikad';
    return new Date(dateString).toLocaleString('sr-RS');
  };
  
  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Supabase Auth Panel</h1>
          <Button onClick={fetchUsers} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Osveži
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pretraži korisnike..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Dodaj korisnika
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj novog korisnika</DialogTitle>
                <DialogDescription>
                  Kreirajte novog korisnika direktno u Supabase Auth bazi.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="email" className="text-right">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="password" className="text-right">
                    Lozinka
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddUserDialog(false)}
                  disabled={actionLoading}
                >
                  Otkaži
                </Button>
                <Button 
                  onClick={createUser} 
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kreiranje...
                    </>
                  ) : 'Kreiraj korisnika'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card className="overflow-hidden rounded-lg">
          <Table>
            <TableCaption>Lista Supabase Auth korisnika</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Email potvrđen</TableHead>
                <TableHead>Poslednja prijava</TableHead>
                <TableHead>Kreiran</TableHead>
                <TableHead>U bazi</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nema pronađenih korisnika
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.emailConfirmed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.lastSignIn)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      {user.existsInDb ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!user.existsInDb && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncUser(user.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1"
                          >
                            {actionLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserCheck className="h-3 w-3" />
                            )}
                            Sinhronizuj
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading}
                              className="flex items-center gap-1"
                            >
                              <Trash className="h-3 w-3" />
                              Obriši
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ova akcija će trajno obrisati korisnika <strong>{user.email}</strong> iz Supabase Auth baze.
                                Ovaj postupak je nepovratna operacija.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Otkaži</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {actionLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Brisanje...
                                  </>
                                ) : 'Obriši korisnika'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}