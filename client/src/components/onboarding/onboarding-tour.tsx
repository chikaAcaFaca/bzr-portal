import { useState, useEffect } from 'react';
import { TourProvider, useTour, type StepType } from '@reactour/tour';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';

// Tour koraci - definišu se ovde da bi se mogli koristiti i u drugim komponentama
export const tourSteps: StepType[] = [
  {
    selector: '#sidebar',
    content: 'Dobrodošli u BZR Sistem. Ovde možete pristupiti svim funkcionalnostima aplikacije.',
    position: 'right' as const
  },
  {
    selector: '[data-tour="dashboard"]',
    content: 'Dashboard vam pruža pregled ključnih metrika i nedavnih aktivnosti u sistemu.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="document-section"]',
    content: 'Ovde upravljate dokumentacijom, koristite AI asistenta i pristupate bazi znanja.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="document-processor"]',
    content: 'AI procesor automatski analizira sistematizaciju i druge dokumente, i popunjava bazu podataka.',
    position: 'bottom' as const
  },
  {
    selector: '[data-tour="ai-assistant"]',
    content: 'AI asistent vam može pomoći sa pitanjima iz oblasti bezbednosti i zdravlja na radu, kao i generisanjem dokumenata.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="employee-section"]',
    content: 'Ovde možete pratiti obuke zaposlenih i upravljati kategorijama rizika i merama zaštite.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="report-section"]',
    content: 'Statistički izveštaji i mogućnost generisanja dokumenata.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="settings-section"]',
    content: 'Podešavanja sistema i upravljanje korisničkim nalozima.',
    position: 'bottom' as const,
  },
  {
    selector: '.quick-actions',
    content: 'Brze akcije za najčešće korišćene funkcionalnosti.',
    position: 'bottom' as const,
  },
  {
    selector: '.recent-documents',
    content: 'Pregled nedavno učitanih dokumenata.',
    position: 'bottom' as const,
  },
  {
    selector: '.module-cards',
    content: 'Brzi pristup glavnim modulima aplikacije.',
    position: 'bottom' as const,
  },
  {
    selector: '.recent-trainings',
    content: 'Pregled nedavnih i predstojećih obuka zaposlenih.',
    position: 'bottom' as const,
  }
];

// Opcije za konfigurisanje izgleda i ponašanja tour-a
const tourOptions = {
  styles: {
    popover: (base: any) => ({
      ...base,
      '--reactour-accent': '#3182CE',
      borderRadius: 8,
      padding: 20,
    }),
    maskArea: (base: any) => ({ ...base, rx: 8 }),
    badge: (base: any) => ({ ...base, left: 'auto', right: 10, top: 10 }),
    controls: (base: any) => ({ ...base, marginTop: 20 }),
    close: (base: any) => ({ ...base, right: 8, top: 8 }),
  },
  padding: { mask: 8 },
  onClickHighlighted: (e: Event) => e.stopPropagation(),
  showNavigation: true,
  showCloseButton: true,
  showBadge: true
};

// Kontrole za tour - prikazuju se na dnu popper-a
const TourControls = () => {
  const { currentStep, steps, setCurrentStep, setIsOpen } = useTour();
  const isLastStep = currentStep === steps.length - 1;
  
  return (
    <div className="flex justify-between items-center pt-4 gap-4">
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => setIsOpen(false)}
      >
        Preskoči turu
      </Button>
      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setCurrentStep((prev) => prev - 1)}
          >
            Nazad
          </Button>
        )}
        <Button 
          size="sm"
          onClick={() => {
            if (isLastStep) {
              setIsOpen(false);
              // Sačuvaj u localStorage da je korisnik završio turu
              localStorage.setItem('bzr-tour-completed', 'true');
            } else {
              setCurrentStep((prev) => prev + 1);
            }
          }}
        >
          {isLastStep ? 'Završi' : 'Dalje'}
        </Button>
      </div>
    </div>
  );
};

// Wrapper komponenta koja pruža TourProvider
export function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider 
      steps={tourSteps}
      components={{ Controls: TourControls }}
      {...tourOptions}
    >
      {children}
      <OnboardingController />
    </TourProvider>
  );
}

// Komponenta koja kontroliše kada se tour prikazuje
function OnboardingController() {
  const { setIsOpen, setCurrentStep } = useTour();
  const [location] = useLocation();
  const [match] = useRoute('/');
  const [hasShownTour, setHasShownTour] = useState(false);

  useEffect(() => {
    // Proveri da li je korisnik već video turu
    const hasSeenTour = localStorage.getItem('bzr-tour-seen') === 'true';
    const tourCompleted = localStorage.getItem('bzr-tour-completed') === 'true';
    
    // Prikaži turu samo na dashboard stranici, prvi put kad korisnik poseti aplikaciju
    if (match && !hasSeenTour && !tourCompleted && !hasShownTour) {
      // Označi da je korisnik video turu
      localStorage.setItem('bzr-tour-seen', 'true');
      
      // Odloži pokretanje ture da bi se DOM elementi učitali
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsOpen(true);
        setHasShownTour(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [match, setIsOpen, setCurrentStep, hasShownTour]);

  // Resetuj na prvi korak kada se vratimo na dashboard
  useEffect(() => {
    if (location === '/' && hasShownTour) {
      setCurrentStep(0);
    }
  }, [location, hasShownTour, setCurrentStep]);

  return null;
}

// Hook za manuelno pokretanje ture
export function useOnboardingTour() {
  const { setIsOpen, setCurrentStep } = useTour();
  
  const startTour = (startStep = 0) => {
    setCurrentStep(startStep);
    setIsOpen(true);
  };
  
  const resetTourCompletion = () => {
    localStorage.removeItem('bzr-tour-completed');
  };
  
  return { startTour, resetTourCompletion };
}