import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
  lastLogin: string | null;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Uzimamo hardkodirane podatke pošto još nemamo API za korisnike
  const users: User[] = [
    {
      id: 1,
      email: "admin@example.com",
      fullName: "Administrator Sistema",
      role: "admin",
      createdAt: "2023-06-15T10:00:00Z",
      lastLogin: "2024-04-29T08:45:12Z"
    },
    {
      id: 2,
      email: "marko@kompanija.rs",
      fullName: "Marko Marković",
      role: "editor",
      createdAt: "2023-10-25T14:30:00Z",
      lastLogin: "2024-04-28T16:22:45Z"
    },
    {
      id: 3,
      email: "jovana@kompanija.rs",
      fullName: "Jovana Jovanović",
      role: "viewer",
      createdAt: "2024-02-01T09:15:00Z",
      lastLogin: "2024-04-27T11:05:33Z"
    }
  ];
  
  // Funkcija za formatiranje datuma
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nikada";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Prevodi uloge na srpski
  const translateRole = (role: string) => {
    switch (role) {
      case "admin": return "Administrator";
      case "editor": return "Urednik";
      case "viewer": return "Pregled";
      default: return role;
    }
  };
  
  const handleAddUser = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Novi korisnik",
      description: "Funkcionalnost dodavanja korisnika će biti implementirana uskoro.",
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Korisnici sistema</h2>
          <p className="text-muted-foreground">
            Upravljanje korisnicima i njihovim pristupnim pravima
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="theme-transition">
              <i className="fas fa-plus mr-2"></i>
              Dodaj korisnika
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Dodaj novog korisnika</DialogTitle>
              <DialogDescription>
                Unesite podatke za novog korisnika sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email adresa</Label>
                <Input id="email" type="email" required placeholder="email@kompanija.rs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Ime i prezime</Label>
                <Input id="fullName" required placeholder="Petar Petrović" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Uloga</Label>
                <Select defaultValue="viewer">
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Izaberite ulogu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="editor">Urednik</SelectItem>
                    <SelectItem value="viewer">Pregled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Privremena lozinka</Label>
                <Input id="password" type="password" required />
              </div>
              
              <DialogFooter>
                <Button type="submit">Kreiraj korisnika</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="theme-transition">
        <CardHeader className="pb-3">
          <CardTitle>Upravljanje korisnicima</CardTitle>
          <CardDescription>
            Spisak svih korisnika sistema i njihove pristupne uloge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Korisnik</TableHead>
                <TableHead>Uloga</TableHead>
                <TableHead>Kreiran</TableHead>
                <TableHead>Poslednja prijava</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {translateRole(user.role)}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <i className="fas fa-edit text-muted-foreground"></i>
                      <span className="sr-only">Izmeni</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}