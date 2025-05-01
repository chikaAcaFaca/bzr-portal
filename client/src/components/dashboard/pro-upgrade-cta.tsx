import { ArrowUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export function ProUpgradeCta() {
  const { user } = useAuth();
  
  // Ne prikazujemo CTA za PRO korisnike
  if (user?.subscriptionType === 'pro') {
    return null;
  }
  
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Unapredite na PRO plan</CardTitle>
        <CardDescription>
          Otključajte sve mogućnosti BZR portala i unapredite bezbednost vašeg poslovanja
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Automatsko generisanje dokumenata</p>
              <p className="text-sm text-muted-foreground">Uštedite vreme i resurse</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Neograničen AI asistent</p>
              <p className="text-sm text-muted-foreground">Pitajte sve što vas zanima bez ograničenja</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Veći prostor za skladište</p>
              <p className="text-sm text-muted-foreground">1GB prostora za sve vaše dokumente</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full mt-2" 
          size="lg"
          asChild
        >
          <Link href="/settings">
            <ArrowUp className="mr-2 h-5 w-5" />
            Nadogradi odmah
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}