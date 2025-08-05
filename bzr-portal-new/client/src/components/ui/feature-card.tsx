import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { SubscriptionPrompt } from "@/components/subscription/subscription-prompt";

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  route: string;
  requiresAuth?: boolean;
  requiresPro?: boolean;
  children?: React.ReactNode;
}

export function FeatureCard({
  title,
  description,
  icon,
  borderColor,
  bgColor,
  iconColor,
  route,
  requiresAuth = true,
  requiresPro = false,
  children,
}: FeatureCardProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  const isAuthenticated = !!user;
  const isPro = user?.subscriptionType === "pro";
  const canAccess = !requiresAuth || isAuthenticated && (!requiresPro || isPro);

  const handleClick = () => {
    if (canAccess) {
      navigate(route);
    } else {
      // Odlaganje postavljanja stanja kako bi izbegli ažuriranje tokom renderovanja
      setTimeout(() => {
        setShowPrompt(true);
      }, 0);
    }
  };

  return (
    <>
      <Card 
        className={`${borderColor} cursor-pointer transition-all hover:shadow-md`}
        onClick={handleClick}
      >
        <CardHeader>
          <div className={`${bgColor} p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{description}</p>
          {children}
        </CardContent>
      </Card>

      <SubscriptionPrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        feature={title}
        requiresAuth={requiresAuth}
        requiresPro={requiresPro}
      />
    </>
  );
}