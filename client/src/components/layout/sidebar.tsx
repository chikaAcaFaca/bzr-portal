import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

type NavItemProps = {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  "data-tour"?: string;
};

const NavItem = ({ href, icon, label, active, ...rest }: NavItemProps) => {
  return (
    <div>
      <Link href={href}>
        <div
          className={cn(
            "block py-2 px-4 rounded flex items-center gap-2 cursor-pointer",
            active
              ? "bg-primary-600 text-white"
              : "hover:bg-gray-700 text-gray-300"
          )}
          {...rest}
        >
          <i className={`${icon} w-5`}></i>
          <span>{label}</span>
        </div>
      </Link>
    </div>
  );
};

type NavSectionProps = {
  title: string;
  children: React.ReactNode;
};

const NavSection = ({ title, children }: NavSectionProps) => {
  return (
    <>
      <div className="text-xs text-gray-400 uppercase tracking-wider mt-6 mb-2">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Funkcija za zatvaranje sidebara kada pointer izađe
  const handleMouseLeave = () => {
    if (isMobile && sidebarRef.current) {
      const sidebar = sidebarRef.current;
      sidebar.classList.add('hidden');
      sidebar.classList.remove('fixed', 'inset-0', 'z-40');
      
      // Ažuriramo toggle dugme
      const mobileToggle = document.getElementById('mobile-toggle');
      if (mobileToggle) {
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    }
  };
  
  // Dodajemo event handler za klik izvan sidebar-a
  useEffect(() => {
    const closeSidebarOnClickOutside = (event: MouseEvent) => {
      if (
        isMobile && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        !sidebarRef.current.classList.contains('hidden')
      ) {
        const mobileToggle = document.getElementById('mobile-toggle');
        if (mobileToggle && !mobileToggle.contains(event.target as Node)) {
          sidebarRef.current.classList.add('hidden');
          sidebarRef.current.classList.remove('fixed', 'inset-0', 'z-40');
          
          if (mobileToggle) {
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
          }
        }
      }
    };
    
    // Dodajemo listener za resize da pratimo kada je mobilna verzija
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 1024;
      setIsMobile(newIsMobile);
      
      if (!newIsMobile && sidebarRef.current) {
        sidebarRef.current.classList.remove('hidden', 'fixed', 'inset-0', 'z-40');
      } else if (newIsMobile && sidebarRef.current) {
        sidebarRef.current.classList.add('hidden');
      }
    };
    
    // Dodajemo event listenere
    document.addEventListener('mousedown', closeSidebarOnClickOutside);
    window.addEventListener('resize', handleResize);
    
    // Cleanup kada se komponenta unmount-uje
    return () => {
      document.removeEventListener('mousedown', closeSidebarOnClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  return (
    <div
      id="sidebar"
      ref={sidebarRef}
      onMouseLeave={handleMouseLeave}
      className="bg-gray-800 text-white w-64 flex-shrink-0 hidden lg:block overflow-y-auto transition-all duration-300 z-40 fixed h-full lg:relative"
    >
      <div className="p-4">
        <div className="flex items-center mb-6">
          <span className="text-white mr-2">
            <i className="fas fa-shield-alt text-primary-400"></i>
          </span>
          <h1 className="text-xl font-bold">BZR Sistem</h1>
        </div>

        <nav className="mt-8">
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Glavni meni
            </div>
            <NavItem
              href="/"
              icon="fas fa-tachometer-alt"
              label="Dashboard"
              active={location === "/"}
              data-tour="dashboard"
            />
            <NavItem
              href="/blog"
              icon="fas fa-newspaper"
              label="Blog"
              active={location === "/blog" || location.startsWith("/blog/")}
            />

            <NavSection title="Dokumentacija" data-tour="document-section">
              <NavItem
                href="/document-processor"
                icon="fas fa-brain"
                label="AI Procesor"
                active={location === "/document-processor"}
                data-tour="document-processor"
              />
              <NavItem
                href="/ai-assistant"
                icon="fas fa-robot"
                label="AI Asistent za BZR"
                active={location === "/ai-assistant"}
                data-tour="ai-assistant"
              />
              <NavItem
                href="/knowledge-references"
                icon="fas fa-book"
                label="Reference znanja"
                active={location === "/knowledge-references"}
              />
              <NavItem
                href="/base-documents"
                icon="fas fa-file"
                label="Bazna dokumenta"
                active={location === "/base-documents"}
              />
              <NavItem
                href="/job-positions"
                icon="fas fa-sitemap"
                label="Sistematizacija"
                active={location === "/job-positions"}
              />
              <NavItem
                href="/job-descriptions"
                icon="fas fa-clipboard-list"
                label="Opisi poslova"
                active={location === "/job-descriptions"}
              />
              <NavItem
                href="/document-storage"
                icon="fas fa-folder-open"
                label="Skladište dokumenata"
                active={location === "/document-storage"}
              />
              <NavItem
                href="/file-utils"
                icon="fas fa-file-code"
                label="Алати за датотеке"
                active={location === "/file-utils"}
              />
            </NavSection>

            <NavSection title="Bezbednost" data-tour="employee-section">
              <NavItem
                href="/risk-categories"
                icon="fas fa-exclamation-triangle"
                label="Rizici i kategorije"
                active={location === "/risk-categories"}
              />
              <NavItem
                href="/safety-measures"
                icon="fas fa-hard-hat"
                label="Mere zaštite"
                active={location === "/safety-measures"}
              />
              <NavItem
                href="/employee-training"
                icon="fas fa-user-check"
                label="Obuke zaposlenih"
                active={location === "/employee-training"}
              />
              <NavItem
                href="/regulatory-updates"
                icon="fas fa-bell"
                label="Regulatorna ažuriranja"
                active={location === "/regulatory-updates"}
              />
            </NavSection>

            <NavSection title="Izveštaji" data-tour="report-section">
              <NavItem
                href="/reports"
                icon="fas fa-chart-bar"
                label="Statistika"
                active={location === "/reports" || (location.startsWith("/reports") && !location.includes("type=documents"))}
              />
              <NavItem
                href="/reports?type=documents"
                icon="fas fa-file-pdf"
                label="Generisanje dokumenata"
                active={location.startsWith("/reports") && location.includes("type=documents")}
              />
            </NavSection>

            <NavSection title="Korisnički nalog" data-tour="settings-section">
              <NavItem
                href="/settings"
                icon="fas fa-cog"
                label="Postavke"
                active={location === "/settings"}
              />
              <NavItem
                href="/user-profile"
                icon="fas fa-user"
                label="Profil korisnika"
                active={location === "/user-profile"}
              />
              <NavItem
                href="/referral-program"
                icon="fas fa-share-alt"
                label="Referalni program"
                active={location === "/referral-program"}
              />
            </NavSection>
            
            {/* Admin sekcija - vidljiva samo admin korisnicima */}
            {user?.role === 'admin' && (
              <NavSection title="Administracija">
                <NavItem
                  href="/admin-dashboard"
                  icon="fas fa-crown"
                  label="Admin panel"
                  active={location === "/admin-dashboard"}
                />
                <NavItem
                  href="/users"
                  icon="fas fa-users"
                  label="Upravljanje korisnicima"
                  active={location === "/users"}
                />
              </NavSection>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
