import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, CreditCard, Lock, User, Building, Shield } from "lucide-react";

// Tipovi planova za pretplatu
type SubscriptionPlan = "free" | "basic" | "pro" | "enterprise";

// Simulirani podaci o korisniku - u produkciji bi se dohvatali sa servera
const mockUserData = {
  id: 1,
  name: "Marko Petrović",
  email: "marko@example.com",
  company: "Bezbednost Plus d.o.o.",
  position: "Savetnik za bezbednost",
  employeeCount: 15,
  plan: "free" as SubscriptionPlan,
  createdAt: "2023-10-15T12:00:00Z",
  avatarUrl: null
};

// Definicije planova
const plans = [
  {
    id: "free",
    name: "Free",
    description: "Za male kompanije sa do 20 zaposlenih",
    price: "0 €",
    features: [
      "Generisanje dokumenata u standardnom formatu",
      "Pristup osnovnim pravnim informacijama",
      "Blanko obrasci za štampanje",
      "Pristup bazičnoj AI asistenciji"
    ],
    limits: [
      "Do 20 zaposlenih",
      "Samo blanko obrasci bez personalizacije",
      "Ograničen broj AI upita (10 dnevno)",
      "Osnovna analiza rizika"
    ],
    isPopular: false
  },
  {
    id: "basic",
    name: "Basic",
    description: "Za rastuće kompanije sa do 50 zaposlenih",
    price: "39,99 €",
    features: [
      "Sve iz Free paketa",
      "Personalizovani dokumenti sa podacima kompanije",
      "Pristup dodatnim pravnim informacijama",
      "Srednji nivo AI asistencije",
      "Automatska analiza rizika",
      "Osnovna statistika i izveštaji"
    ],
    limits: [
      "Do 50 zaposlenih",
      "Srednji broj AI upita (50 dnevno)",
      "Osnovno prilagođavanje obrazaca"
    ],
    isPopular: true
  },
  {
    id: "pro",
    name: "Pro",
    description: "Za srednje kompanije sa do 100 zaposlenih",
    price: "69,99 €",
    features: [
      "Sve iz Basic paketa",
      "Potpuno prilagođeni dokumenti",
      "Napredna analiza dokumenata",
      "Prioritetna AI asistencija",
      "Prilagođeni izveštaji",
      "Automatsko obaveštavanje o isteku dokumenata",
      "Napredna statistika i izveštaji"
    ],
    limits: [
      "Do 100 zaposlenih",
      "Neograničen broj AI upita",
      "Prioritetna podrška"
    ],
    isPopular: false
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Za velike kompanije sa preko 100 zaposlenih",
    price: "149,99 €",
    features: [
      "Sve iz Pro paketa",
      "Potpuna integracija sa vašim sistemima",
      "Potpuno prilagođeni dokumenti i izveštaji",
      "Dedikovan konsultant za bezbednost",
      "Napredna analitika i predviđanje rizika",
      "API pristup",
      "Neograničena podrška i obuka zaposlenih"
    ],
    limits: [
      "Do 500 zaposlenih",
      "Enterprise korisnici mogu kontaktirati za specifične potrebe"
    ],
    isPopular: false
  }
];

// Komponenta za prikaz plana
const PlanCard = ({
  plan,
  isActive,
  onSelect
}: {
  plan: typeof plans[0];
  isActive: boolean;
  onSelect: () => void;
}) => (
  <Card className={`relative ${isActive ? "border-primary shadow-md" : ""}`}>
    {plan.isPopular && (
      <Badge className="absolute -top-2 -right-2 px-3">Najpopularniji</Badge>
    )}
    <CardHeader>
      <CardTitle>{plan.name}</CardTitle>
      <CardDescription>{plan.description}</CardDescription>
      <div className="mt-2 text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground"> / mesečno</span></div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Uključeno:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex text-sm">
                <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Ograničenja:</h4>
          <ul className="space-y-2">
            {plan.limits.map((limit, i) => (
              <li key={i} className="flex text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                <span>{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button 
        className="w-full" 
        variant={isActive ? "outline" : "default"}
        onClick={onSelect}
      >
        {isActive ? "Trenutni plan" : "Izaberi ovaj plan"}
      </Button>
    </CardFooter>
  </Card>
);

// Komponenta za prikaz dokumenta dostupnog u određenom planu
type DocumentAccessLevel = "full" | "blank" | "none";

interface DocumentTypeProps {
  name: string;
  description: string;
  accessLevels: Record<SubscriptionPlan, DocumentAccessLevel>;
  userPlan: SubscriptionPlan;
}

const DocumentTypeCard = ({ name, description, accessLevels, userPlan }: DocumentTypeProps) => {
  const accessLevel = accessLevels[userPlan];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {accessLevel === "full" ? (
            <div className="flex">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">Potpun pristup</Badge>
            </div>
          ) : accessLevel === "blank" ? (
            <div className="space-y-2">
              <Badge variant="outline">Samo blanko obrasci</Badge>
              <p className="text-sm text-muted-foreground">
                Možete preuzeti blanko verziju dokumenta, ali ne i personalizovanu verziju.
                <br />
                <span className="text-primary">Nadogradite se na Pro ili viši plan za potpuni pristup.</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="destructive">Nedostupno</Badge>
              <p className="text-sm text-muted-foreground">
                Ovaj tip dokumenta nije dostupan u vašem trenutnom planu.
                <br />
                <span className="text-primary">Nadogradite se na Basic ili viši plan za pristup.</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Glavni komponent profila korisnika
const UserProfile = () => {
  const { toast } = useToast();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<typeof plans[0] | null>(null);
  const { user } = useAuth();
  
  // U produkciji bi se podaci dohvatali sa servera
  const userData = user || mockUserData;
  
  // Query za dohvatanje podataka o korisniku
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      // U produkciji bi se podaci dohvatali sa servera
      return userData;
    }
  });
  
  // Mutacija za ažuriranje korisničkog profila
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Profil ažuriran",
        description: "Vaš profil je uspešno ažuriran.",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju profila.",
        variant: "destructive"
      });
    }
  });
  
  // Mutacija za promenu pretplatničkog plana
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest('/api/user/subscription', {
        method: 'PUT',
        body: JSON.stringify({ planId }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      setIsUpgradeDialogOpen(false);
      toast({
        title: "Plan ažuriran",
        description: "Vaš pretplatnički plan je uspešno ažuriran.",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Došlo je do greške pri promeni plana.",
        variant: "destructive"
      });
    }
  });
  
  // Funkcija za otvaranje dijaloga za nadogradnju
  const handleOpenUpgradeDialog = (plan: typeof plans[0]) => {
    setSelectedUpgradePlan(plan);
    setIsUpgradeDialogOpen(true);
  };
  
  // Funkcija za promenu plana
  const handleChangePlan = () => {
    if (!selectedUpgradePlan) return;
    changePlanMutation.mutate(selectedUpgradePlan.id);
  };
  
  // Definicija dostupnosti dokumenata prema planu
  const documentTypes: DocumentTypeProps[] = [
    {
      name: "Obrazac 6 - Evidencija o zaposlenima osposobljenim za bezbedan i zdrav rad",
      description: "Zakonski obavezan obrazac za praćenje obuke zaposlenih",
      accessLevels: {
        free: "blank",
        basic: "full",
        pro: "full",
        enterprise: "full"
      },
      userPlan: userData.plan
    },
    {
      name: "Akt o proceni rizika",
      description: "Kompletna procena rizika za radna mesta",
      accessLevels: {
        free: "blank",
        basic: "blank",
        pro: "full",
        enterprise: "full"
      },
      userPlan: userData.plan
    },
    {
      name: "Program osposobljavanja",
      description: "Program obuke zaposlenih za bezbedan i zdrav rad",
      accessLevels: {
        free: "blank",
        basic: "full",
        pro: "full",
        enterprise: "full"
      },
      userPlan: userData.plan
    },
    {
      name: "Uputstvo za bezbedan rad",
      description: "Detaljna uputstva za bezbedno korišćenje opreme",
      accessLevels: {
        free: "blank",
        basic: "full",
        pro: "full",
        enterprise: "full"
      },
      userPlan: userData.plan
    },
    {
      name: "Izveštaj o pregledu i ispitivanju opreme za rad",
      description: "Dokumentacija o pregledu i ispitivanju opreme",
      accessLevels: {
        free: "none",
        basic: "blank",
        pro: "full",
        enterprise: "full"
      },
      userPlan: userData.plan
    },
    {
      name: "Periodični izveštaj o stanju bezbednosti",
      description: "Analiza stanja bezbednosti i zdravlja na radu u određenom periodu",
      accessLevels: {
        free: "none",
        basic: "none",
        pro: "full",
        enterprise: "full"
      },
      userPlan: userData.plan
    }
  ];
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar sa informacijama o korisniku */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userData.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold">{userData.name}</h2>
                  <p className="text-muted-foreground">{userData.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{userData.company}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{userData.position}</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  <Badge variant="outline" className="font-normal">
                    {plans.find(p => p.id === userData.plan)?.name} Plan
                  </Badge>
                </span>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Izmeni profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Glavni sadržaj */}
        <div className="w-full md:w-3/4">
          <Tabs defaultValue="documents">
            <TabsList className="mb-6">
              <TabsTrigger value="documents">Dostupni dokumenti</TabsTrigger>
              <TabsTrigger value="subscription">Pretplata</TabsTrigger>
              <TabsTrigger value="settings">Podešavanja</TabsTrigger>
            </TabsList>
            
            {/* Tab za dokumente dostupne korisniku */}
            <TabsContent value="documents">
              <div className="grid gap-4 md:grid-cols-2">
                {documentTypes.map((doc, i) => (
                  <DocumentTypeCard key={i} {...doc} />
                ))}
              </div>
            </TabsContent>
            
            {/* Tab za upravljanje pretplatom */}
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle>Vaš trenutni plan</CardTitle>
                  <CardDescription>Pregledajte svoj trenutni pretplatnički plan i mogućnosti nadogradnje</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">
                      Trenutno koristite: <Badge variant="outline" className="ml-2 font-normal">
                        {plans.find(p => p.id === userData.plan)?.name} Plan
                      </Badge>
                    </h3>
                    {userData.plan === "free" && (
                      <p className="mt-2 text-muted-foreground">
                        Nadogradite se na plaćeni plan da biste dobili pristup dodatnim funkcionalnostima, 
                        personalizovanim dokumentima i naprednoj AI asistenciji.
                      </p>
                    )}
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {plans
                      .filter(plan => plan.id !== userData.plan) // Prikaži samo planove koji nisu trenutno aktivni
                      .map(plan => (
                        <div key={plan.id} className="flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{plan.name}</h3>
                            <p className="text-2xl font-bold mt-2">{plan.price}<span className="text-sm font-normal text-muted-foreground"> / mesečno</span></p>
                            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                            <ul className="mt-4 space-y-2">
                              {plan.features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="flex text-sm">
                                  <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                              {plan.features.length > 3 && (
                                <li className="text-sm text-muted-foreground">+ još {plan.features.length - 3} funkcionalnosti</li>
                              )}
                            </ul>
                          </div>
                          <div className="mt-4">
                            <Button 
                              className="w-full" 
                              onClick={() => handleOpenUpgradeDialog(plan)}
                            >
                              Nadogradi na {plan.name}
                            </Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Istorija plaćanja</CardTitle>
                  <CardDescription>Pregledajte svoje prethodne uplate i fakture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Još uvek nemate evidentiranih plaćanja.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab za podešavanja naloga */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Podešavanja naloga</CardTitle>
                  <CardDescription>Upravljajte svojim nalogom i podešavanjima privatnosti</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications">Email obaveštenja</Label>
                        <Switch id="email-notifications" defaultChecked />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Primajte obaveštenja o važnim događajima, rokovima i ažuriranjima putem email-a.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="newsletter">Newsletter</Label>
                        <Switch id="newsletter" defaultChecked />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Primajte mesečni newsletter sa najnovijim informacijama o zakonskim promenama.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="data-collection">Prikupljanje podataka o korišćenju</Label>
                        <Switch id="data-collection" defaultChecked />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Dozvolite prikupljanje podataka o načinu korišćenja za poboljšanje usluga.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Button className="w-full">Sačuvaj podešavanja</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Sigurnost</CardTitle>
                  <CardDescription>Upravljajte podešavanjima sigurnosti vašeg naloga</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Trenutna lozinka</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova lozinka</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Potvrda nove lozinke</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    
                    <div className="pt-4">
                      <Button className="w-full">Promeni lozinku</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Dialog za nadogradnju plana */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nadogradnja na {selectedUpgradePlan?.name} plan</DialogTitle>
            <DialogDescription>
              Unesite podatke o plaćanju da biste nadogradili svoj plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="card-number">Broj kartice</Label>
              <Input id="card-number" placeholder="1234 5678 9012 3456" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Datum isteka</Label>
                <Input id="expiry" placeholder="MM/GG" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Ime na kartici</Label>
              <Input id="name" placeholder="Marko Petrović" />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="agreement" defaultChecked />
              <Label htmlFor="agreement" className="text-sm">
                Prihvatam <a href="#" className="text-primary">uslove korišćenja</a> i <a href="#" className="text-primary">politiku privatnosti</a>
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>Otkaži</Button>
            <Button 
              className="flex items-center" 
              onClick={handleChangePlan}
              disabled={changePlanMutation.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Nadogradi za {selectedUpgradePlan?.price}/mesečno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;