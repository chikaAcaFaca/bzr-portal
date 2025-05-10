/**
 * Admin Layout komponenta
 * Pruža konzistentni layout za sve admin stranice
 */

import { ReactNode } from 'react';
import { Link } from 'wouter';
import { 
  Home,
  Users,
  FileText,
  Settings,
  ShieldAlert,
  Database,
  Bot,
  LogOut
} from '@/lib/icons';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { toast } = useToast();
  const auth = useAuth();

  // Provera da li je korisnik admin
  if (auth.user && !auth.user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ShieldAlert className="text-destructive h-16 w-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Pristup zabranjen</h1>
        <p className="text-muted-foreground text-center mb-6">
          Nemate administratorske privilegije za pristup ovoj stranici.
        </p>
        <Button asChild>
          <Link href="/">Povratak na početnu stranicu</Link>
        </Button>
      </div>
    );
  }
  
  const handleLogout = async () => {
    try {
      await auth.logoutMutation.mutateAsync();
      toast({
        title: 'Odjavljeni ste',
        description: 'Uspešno ste se odjavili sa admin panela',
      });
    } catch (error: any) {
      toast({
        title: 'Greška pri odjavljivanju',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const adminItems = [
    { icon: Home, label: 'Kontrolna tabla', href: '/admin' },
    { icon: Users, label: 'Korisnici', href: '/admin/users' },
    { icon: FileText, label: 'Dokumenti', href: '/admin/documents' },
    { icon: Database, label: 'Supabase Auth', href: '/admin/supabase-auth' },
    { icon: Bot, label: 'AI podešavanja', href: '/admin/ai-settings' },
    { icon: Settings, label: 'Podešavanja', href: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <Link href="/admin" className="flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Panel</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminItems.map(item => (
            <Link key={item.href} href={item.href}>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                // Aktivni stil za trenutnu rutu
                data-active={location.pathname === item.href}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        
        {/* User section */}
        <div className="border-t p-4">
          <div className="mb-2 px-4 py-2">
            <div className="text-sm font-medium truncate">
              {auth.user?.email}
            </div>
            <div className="text-xs text-muted-foreground">
              Administrator
            </div>
          </div>
          <Separator className="my-2" />
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Odjava
          </Button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-muted/20">
        {children}
      </main>
    </div>
  );
}