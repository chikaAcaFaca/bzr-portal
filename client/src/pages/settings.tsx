import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  const handleSaveChanges = () => {
    toast({
      title: "Postavke sačuvane",
      description: "Vaše promene su sačuvane uspešno."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sistemske postavke</h2>
        <p className="text-muted-foreground">
          Upravljanje sistemskim postavkama i podešavanjima aplikacije
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general" className="transition-all">Opšte</TabsTrigger>
          <TabsTrigger value="appearance" className="transition-all">Izgled</TabsTrigger>
          <TabsTrigger value="integrations" className="transition-all">Integracije</TabsTrigger>
        </TabsList>
        
        {/* Opšte postavke */}
        <TabsContent value="general" className="space-y-4">
          <Card className="theme-transition">
            <CardHeader>
              <CardTitle>Podaci o kompaniji</CardTitle>
              <CardDescription>
                Osnovna podešavanja kompanije i sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Naziv kompanije</Label>
                <Input id="companyName" defaultValue="Vaša Kompanija DOO" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Adresa</Label>
                <Input id="companyAddress" defaultValue="Beogradska 123, 11000 Beograd" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPIB">PIB</Label>
                  <Input id="companyPIB" defaultValue="123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyMB">Matični broj</Label>
                  <Input id="companyMB" defaultValue="12345678" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Telefon</Label>
                <Input id="companyPhone" defaultValue="+381 11 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email</Label>
                <Input id="companyEmail" type="email" defaultValue="info@vasakompanija.rs" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="theme-transition">
            <CardHeader>
              <CardTitle>Sistemska podešavanja</CardTitle>
              <CardDescription>
                Osnovna sistemska podešavanja i automatizacija
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="automaticReports">Automatski izveštaji</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatski generiši mesečne izveštaje
                  </p>
                </div>
                <Switch id="automaticReports" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email notifikacije</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatski šalji email notifikacije o obukama
                  </p>
                </div>
                <Switch id="emailNotifications" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="logRetention">Čuvanje logova (dana)</Label>
                  <p className="text-sm text-muted-foreground">
                    Broj dana za čuvanje sistemskih logova
                  </p>
                </div>
                <Input id="logRetention" defaultValue="90" className="w-24" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Izgled */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="theme-transition">
            <CardHeader>
              <CardTitle>Tema sistema</CardTitle>
              <CardDescription>
                Vizuelna podešavanja korisničkog interfejsa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode">Izbor teme</Label>
                  <p className="text-sm text-muted-foreground">
                    Odaberite svetlu, tamnu ili sistemsku temu
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Prilagođene boje</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primarna boja</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="primaryColor" 
                        type="color" 
                        defaultValue="#0091D7" 
                        className="w-12 h-8 p-0" 
                      />
                      <Input defaultValue="#0091D7" className="h-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Sekundarna</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="secondaryColor" 
                        type="color" 
                        defaultValue="#FEEFE5" 
                        className="w-12 h-8 p-0" 
                      />
                      <Input defaultValue="#FEEFE5" className="h-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Akcentna</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="accentColor" 
                        type="color" 
                        defaultValue="#FFE985" 
                        className="w-12 h-8 p-0" 
                      />
                      <Input defaultValue="#FFE985" className="h-8" />
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animations">Animacije</Label>
                  <p className="text-sm text-muted-foreground">
                    Uključi animacije za bolje korisničko iskustvo
                  </p>
                </div>
                <Switch id="animations" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Integracije */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="theme-transition">
            <CardHeader>
              <CardTitle>API Integracije</CardTitle>
              <CardDescription>
                Povezivanje sa eksternim sistemima i servisima
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openAIKey">OpenAI API ključ</Label>
                <div className="flex gap-2">
                  <Input id="openAIKey" type="password" placeholder="sk-..." className="flex-1" />
                  <Button variant="outline">Verifikuj</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  API ključ za pristup OpenAI servisima
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="geminiKey">Google Gemini API ključ</Label>
                <div className="flex gap-2">
                  <Input id="geminiKey" type="password" placeholder="AI..." className="flex-1" />
                  <Button variant="outline">Verifikuj</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  API ključ za pristup Google Gemini servisima
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input id="webhookUrl" placeholder="https://" />
                <p className="text-xs text-muted-foreground">
                  URL za webhook notifikacije
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpSettings">SMTP Podešavanja</Label>
                <Textarea id="smtpSettings" placeholder="host=smtp.example.com
port=587
username=username
password=password
encryption=tls" rows={5} />
                <p className="text-xs text-muted-foreground">
                  Podešavanja za SMTP server za slanje email notifikacija
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-4">
        <Button variant="outline">Otkaži</Button>
        <Button onClick={handleSaveChanges}>Sačuvaj promene</Button>
      </div>
    </div>
  )
}