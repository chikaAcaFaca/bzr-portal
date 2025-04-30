import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Top navigation - Modernizovan */}
      <header className="bg-background border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm bg-background/95">
        {/* Mobile Navbar Toggle - Inline position */}
        <div className="lg:hidden absolute left-4 top-1/2 -translate-y-1/2">
          <button
            id="mobile-toggle"
            className="bg-white/80 p-2 rounded-md shadow-sm text-gray-600 hover:bg-white/95 transition-colors"
            onClick={() => {
              const sidebar = document.getElementById('sidebar');
              if (sidebar) {
                sidebar.classList.toggle('hidden');
              }
            }}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
        <div className="container-responsive flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="mr-4">
                <Link href="/">
                  <span className="font-bold text-xl gradient-heading cursor-pointer">BZR Portal</span>
                </Link>
              </div>
              <ol className="flex text-sm items-center">
                <li className="flex items-center">
                  <Link href="/">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Početna</span>
                  </Link>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-muted-foreground/50 mx-2 h-4 w-4"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </li>
                <li className="text-primary font-medium">Dashboard</li>
              </ol>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="text-muted-foreground p-2 hover:text-primary hover:bg-secondary/80 rounded-full transition-colors">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
            </button>
            
            <ThemeToggle />
            
            <div className="relative">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center text-sm focus:outline-none gap-2 hover:bg-secondary/80 p-1.5 px-2 rounded-lg transition-colors">
                      <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.username[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="font-medium">{user.username || 'Korisnik'}</span>
                        <span className="text-xs text-muted-foreground">{user.roles.includes('admin') ? 'Administrator' : 'Korisnik'}</span>
                      </div>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="ml-1 hidden md:block text-muted-foreground h-4 w-4"
                      >
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-1.5" align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="mr-2 h-4 w-4"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="mr-2 h-4 w-4"
                      >
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                        <path d="M19 3v4"></path>
                        <path d="M23 7h-4"></path>
                      </svg>
                      <span>Podešavanja</span>
                    </DropdownMenuItem>
                    <div className="border-t border-border my-1"></div>
                    <DropdownMenuItem 
                      onClick={() => logout()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="mr-2 h-4 w-4"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>Odjava</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button className="rounded-lg bg-primary hover:bg-primary/90 transition-colors">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Prijava
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
