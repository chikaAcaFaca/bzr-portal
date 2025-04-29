import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
};

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
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
  const [location, navigate] = useLocation();

  return (
    <div
      id="sidebar"
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
            />

            <NavSection title="Dokumentacija">
              <NavItem
                href="/document-processor"
                icon="fas fa-brain"
                label="AI Procesor"
                active={location === "/document-processor"}
              />
              <NavItem
                href="/ai-assistant"
                icon="fas fa-robot"
                label="AI Asistent za BZR"
                active={location === "/ai-assistant"}
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
            </NavSection>

            <NavSection title="Bezbednost">
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
            </NavSection>

            <NavSection title="Izveštaji">
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

            <NavSection title="Sistemske postavke">
              <NavItem
                href="/settings"
                icon="fas fa-cog"
                label="Postavke"
                active={location === "/settings"}
              />
              <NavItem
                href="/users"
                icon="fas fa-users"
                label="Korisnici"
                active={location === "/users"}
              />
            </NavSection>
          </div>
        </nav>
      </div>
    </div>
  );
}
