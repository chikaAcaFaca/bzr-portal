import React from 'react';
import { ReferralStats } from '@/components/referrals/referral-stats';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function ReferralProgramPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Referalni Program</h1>
        <p className="text-muted-foreground mt-2">
          Pozovite prijatelje i poslovne saradnike da koriste BZR Portal i zaradite dodatni prostor za skladištenje dokumenata
        </p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReferralStats />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kako funkcioniše?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white font-medium flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Podelite svoj link</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Kopirajte vaš jedinstveni referalni link i podelite ga sa prijateljima i kolegama, ili napišite komentar sa vašim kodom na društvenim mrežama.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white font-medium flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Oni se registruju</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Kada neko klikne na vaš link i registruje se, automatski se povezuje sa vašim nalogom.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white font-medium flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Zaradite nagrade</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Za svakog novog FREE korisnika dobijate 50MB dodatnog prostora. Ako se vaš referral pretplati na PRO, dobijate čak 100MB prostora!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Ograničenja</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>Besplatni korisnici mogu da zarade do 2GB dodatnog prostora</li>
                <li>PRO korisnici mogu da zarade do 5GB dodatnog prostora</li>
                <li>Za svakog PRO referrala dobijate 100MB prostora</li>
                <li>Nagrade za besplatne korisnike traju neograničeno</li>
                <li>Nagrade za PRO korisnike traju dok god je pretplata aktivna + 12 meseci</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}