import React from "react";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface SubscriptionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiresAuth?: boolean;
  requiresPro?: boolean;
}

export function SubscriptionPrompt({
  isOpen,
  onClose,
  feature,
  requiresAuth = true,
  requiresPro = false,
}: SubscriptionPromptProps) {
  const { user } = useAuth();

  const isAuthenticated = !!user;
  const isPro = user?.subscriptionType === "pro";

  const getTitle = () => {
    if (!isAuthenticated) return "Prijavite se za korišćenje ove funkcije";
    if (requiresPro && !isPro) return "Nadogradite na PRO pretplatu";
    return `Pristupite funkciji: ${feature}`;
  };

  const getDescription = () => {
    if (!isAuthenticated) {
      return `Da biste koristili funkciju "${feature}", potrebno je da se prijavite ili registrujete.`;
    }
    if (requiresPro && !isPro) {
      return `Funkcija "${feature}" je dostupna samo korisnicima sa PRO pretplatom. Nadogradite svoj nalog da biste dobili pristup svim funkcionalnostima.`;
    }
    return `Funkcija "${feature}" vam je dostupna, kliknite na dugme za nastavak.`;
  };

  const getPrimaryButtonText = () => {
    if (!isAuthenticated) return "Prijavite se";
    if (requiresPro && !isPro) return "Nadogradite na PRO";
    return "Nastavi";
  };

  const getPrimaryButtonAction = () => {
    if (!isAuthenticated) {
      return "/auth";
    }
    if (requiresPro && !isPro) {
      return "/settings?tab=subscription";
    }
    return "";
  };

  const primaryButtonAction = getPrimaryButtonAction();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Otkaži</AlertDialogCancel>
          {primaryButtonAction ? (
            <Button asChild>
              <Link 
                href={primaryButtonAction} 
                onClick={() => setTimeout(onClose, 0)}
              >
                {getPrimaryButtonText()}
              </Link>
            </Button>
          ) : (
            <AlertDialogAction onClick={onClose}>
              {getPrimaryButtonText()}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}