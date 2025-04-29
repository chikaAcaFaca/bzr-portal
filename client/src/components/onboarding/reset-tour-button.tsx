import { Button } from '@/components/ui/button';
import { useOnboardingTour } from './onboarding-tour';
import { useToast } from '@/hooks/use-toast';

export function ResetTourButton() {
  const { resetTourCompletion, startTour } = useOnboardingTour();
  const { toast } = useToast();
  
  const handleResetTour = () => {
    resetTourCompletion();
    toast({
      title: 'Onboarding vodič je resetovan',
      description: 'Vodič će se prikazati prilikom sledeće posete početnoj stranici.',
    });
  };
  
  const handleStartTourNow = () => {
    startTour(0);
    toast({
      title: 'Onboarding vodič započet',
      description: 'Sledite instrukcije za upoznavanje sa sistemom.',
    });
  };
  
  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
      <Button 
        variant="outline" 
        onClick={handleResetTour}
      >
        Resetuj onboarding vodič
      </Button>
      <Button 
        variant="default" 
        onClick={handleStartTourNow}
      >
        Pokreni vodič odmah
      </Button>
    </div>
  );
}