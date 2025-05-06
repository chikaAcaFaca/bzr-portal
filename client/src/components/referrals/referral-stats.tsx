import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareIcon, Copy, Users, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Format bytes to human readable size (KB, MB, GB)
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface ReferralInfo {
  referral_code: string;
  total_referrals: number;
  total_pro_referrals: number;
  earned_space: number;
  active_space: number;
  created_at: string;
}

interface ReferralEntry {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  is_pro_user: boolean;
  created_at: string;
  expires_at: string;
  reward_size: number;
  is_active: boolean;
  source: string;
  social_platform?: string;
  post_link?: string;
}

interface ReferralStatsProps {
  className?: string;
}

export function ReferralStats({ className }: ReferralStatsProps) {
  const { toast } = useToast();
  
  // Definicije tipova za API odgovore
  interface CodeResponse {
    success: boolean;
    referral_code: string;
    referral_url: string;
    message?: string;
  }
  
  interface InfoResponse {
    success: boolean;
    referral_info: ReferralInfo;
    referrals: ReferralEntry[];
    message?: string;
  }
  
  // Dobavljanje referalnog koda
  const { data: codeData, isLoading: isCodeLoading } = useQuery<CodeResponse>({
    queryKey: ['/api/referrals/code'],
    retry: false,
  });
  
  // Dobavljanje referalnih informacija
  const { data: infoData, isLoading: isInfoLoading } = useQuery<InfoResponse>({
    queryKey: ['/api/referrals/info'],
    retry: false,
  });
  
  const referralInfo = infoData?.success ? infoData.referral_info : null;
  const referrals = infoData?.success ? infoData.referrals : [];
  
  const referralCode = codeData?.success ? codeData.referral_code : '';
  const referralUrl = codeData?.success ? codeData.referral_url : '';
  
  // Funkcija za kopiranje referalnog URL-a
  const copyReferralLink = () => {
    if (!referralUrl) return;
    
    navigator.clipboard.writeText(referralUrl).then(() => {
      toast({
        title: 'Link kopiran!',
        description: 'Referalni link je kopiran u clipboard.',
      });
    }).catch(() => {
      toast({
        title: 'Greška',
        description: 'Nije moguće kopirati link. Pokušajte ponovo.',
        variant: 'destructive',
      });
    });
  };
  
  // Mapa izvora referala
  const sourceLabels: Record<string, string> = {
    'blog_post': 'Blog post',
    'social_comment': 'Društvene mreže',
    'direct_link': 'Direktan link',
    'unknown': 'Nepoznat'
  };
  
  // Formatiranje datuma
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const isLoading = isCodeLoading || isInfoLoading;
  
  return (
    <div className={className}>
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Vaš Referalni Program</CardTitle>
            <CardDescription>
              Delite vaš jedinstveni referalni link sa prijateljima i kolegama da bi dobili dodatni prostor za skladištenje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : referralCode ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Vaš referalni link</p>
                    <div className="relative">
                      <div className="p-3 bg-muted rounded-md text-sm break-all">
                        {referralUrl}
                      </div>
                    </div>
                  </div>
                  <Button onClick={copyReferralLink} className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Kopiraj link
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ShareIcon className="w-4 h-4" />
                    Podeli
                  </Button>
                </div>
                
                {referralInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Ukupni referali</p>
                            <p className="text-2xl font-bold mt-1">{referralInfo.total_referrals}</p>
                          </div>
                          <Users className="text-primary w-8 h-8" />
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            Od toga PRO korisnika: {referralInfo.total_pro_referrals}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Ukupno zarađeno</p>
                            <p className="text-2xl font-bold mt-1">{formatBytes(referralInfo.earned_space)}</p>
                          </div>
                          <HardDrive className="text-primary w-8 h-8" />
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            Trenutno aktivno: {formatBytes(referralInfo.active_space)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-muted-foreground">Iskorišćenost</p>
                          <p className="text-2xl font-bold mt-1">
                            {referralInfo.total_referrals > 0 ? 
                              `${(referralInfo.active_space / referralInfo.earned_space * 100).toFixed(1)}%` : 
                              '0%'}
                          </p>
                          <Progress 
                            value={referralInfo.total_referrals > 0 ? 
                              (referralInfo.active_space / referralInfo.earned_space * 100) : 0} 
                            className="h-2 mt-2" 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Nije moguće učitati vaš referalni kod. Molimo pokušajte ponovo kasnije.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Lista referala */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vaši referali</CardTitle>
            <CardDescription>Pregled svih korisnika koji su se registrovali preko vašeg linka</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">ID Korisnika</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Izvor</th>
                    <th scope="col" className="px-6 py-3">Datum</th>
                    <th scope="col" className="px-6 py-3">Nagrada</th>
                    <th scope="col" className="px-6 py-3">Ističe</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {referral.referred_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        {referral.is_pro_user ? (
                          <Badge className="bg-indigo-500">PRO</Badge>
                        ) : (
                          <Badge variant="secondary">FREE</Badge>
                        )}
                        {!referral.is_active && <Badge variant="outline" className="ml-2">Neaktivan</Badge>}
                      </td>
                      <td className="px-6 py-4">
                        {sourceLabels[referral.source] || 'Nepoznat'}
                        {referral.social_platform && <div className="text-xs mt-1">{referral.social_platform}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(referral.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {formatBytes(referral.reward_size)}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(referral.expires_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}