import PageHeader from "@/components/layout/page-header";
import StatisticsCards from "@/components/dashboard/statistics-cards";
import RecentTrainings from "@/components/dashboard/recent-trainings";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentDocuments from "@/components/dashboard/recent-documents";
import ModuleCards from "@/components/dashboard/module-cards";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ArrowUp, CheckCircle } from "lucide-react";

// Komponenta za poziv na akciju za nadogradnju na PRO
const ProUpgradeCard = () => {
  const { user } = useAuth();
  
  // Ne prikazujemo ovu komponentu za PRO korisnike
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
              <p className="text-sm text-muted-foreground">1GB prostora umesto 50MB za FREE korisnike</p>
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
};

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <>
      <PageHeader 
        title="Dashboard" 
        description="Pregled sistema za bezbednost i zdravlje na radu" 
      />
      
      <StatisticsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="recent-trainings lg:col-span-2">
          <RecentTrainings />
        </div>
        
        <div className="space-y-6">
          {/* Poziv na akciju za nadogradnju na PRO - prikazuje se samo FREE korisnicima */}
          <ProUpgradeCard />
          
          <div className="quick-actions">
            <QuickActions />
          </div>
          <div className="recent-documents">
            <RecentDocuments />
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Moduli sistema</h2>
        <div className="module-cards">
          <ModuleCards />
        </div>
      </div>
    </>
  );
}
