import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Users, 
  CreditCard, 
  Activity, 
  FileText, 
  Search, 
  BarChart4,
  BarChart2,
  PieChart,
  User,
  Calendar,
  Tag,
  ChevronDown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart as RechartsPieChart,
  Pie
} from "recharts";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const dataPlan = [
  { name: 'Free', value: 198, color: '#94a3b8' },
  { name: 'Basic', value: 37, color: '#0ea5e9' },
  { name: 'Pro', value: 18, color: '#8b5cf6' },
  { name: 'Enterprise', value: 3, color: '#f97316' },
];

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('sr-RS').format(value);
};

// Komponenta za prikaz statistike broja korisnika
const UserStatsCard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/user-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/user-stats');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        // U razvoju, prikazujemo mock podatke ako API još nije implementiran
        return {
          total: 256,
          free: 198,
          basic: 37,
          pro: 18,
          enterprise: 3
        };
      }
    }
  });

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Korisnici po planu</CardTitle>
          <CardDescription>Pregled pretplatnika po tipu plana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[230px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const freeUsers = stats.free;
  const paidUsers = stats.basic + stats.pro + stats.enterprise;
  const paidPercentage = (paidUsers / stats.total * 100).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Korisnici po planu</CardTitle>
        <CardDescription>Pregled pretplatnika po tipu plana</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
            <p className="text-xs text-muted-foreground">Ukupno korisnika</p>
            
            <div className="grid grid-cols-2 gap-2 pt-3">
              <div>
                <div className="text-sm font-medium">{formatNumber(freeUsers)}</div>
                <p className="text-xs text-muted-foreground">Free</p>
              </div>
              <div>
                <div className="text-sm font-medium">{formatNumber(paidUsers)}</div>
                <p className="text-xs text-muted-foreground">Plaćeni ({paidPercentage}%)</p>
              </div>
              
              {typeof stats.basic !== 'undefined' && (
                <>
                  <div>
                    <div className="text-sm font-medium">{formatNumber(stats.basic)}</div>
                    <p className="text-xs text-muted-foreground">Basic</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{formatNumber(stats.pro)}</div>
                    <p className="text-xs text-muted-foreground">Pro</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{formatNumber(stats.enterprise)}</div>
                    <p className="text-xs text-muted-foreground">Enterprise</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-center h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={dataPlan}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {dataPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value as number)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponenta za prikaz statistike aktivnosti na portalu
const ActivityStatsCard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/activity-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/activity-stats');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        // U razvoju, prikazujemo mock podatke ako API još nije implementiran
        return {
          aiQuestions: 847,
          documentsGenerated: 392,
          complianceAnalyses: 153,
          blogPostsCreated: 126,
          blogPostsPublished: 87,
          newUsers: 24,
        };
      }
    }
  });

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aktivnost na portalu</CardTitle>
          <CardDescription>Pregled aktivnosti korisnika</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[230px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Kreiranje podataka za prikaz aktivnosti
  const activityData = [
    { title: 'AI pitanja', value: stats.aiQuestions, icon: Activity },
    { title: 'Generisani dokumenti', value: stats.documentsGenerated, icon: FileText },
    { title: 'Analize usklađenosti', value: stats.complianceAnalyses, icon: Check },
    { title: 'Blog postovi kreirani', value: stats.blogPostsCreated, icon: FileText },
    { title: 'Blog postovi objavljeni', value: stats.blogPostsPublished, icon: FileText },
    { title: 'Novi korisnici', value: stats.newUsers, icon: Users },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Aktivnost na portalu</CardTitle>
        <CardDescription>Pregled aktivnosti korisnika</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {activityData.map((item, index) => (
            <div key={index} className="flex flex-col">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.title}</span>
              </div>
              <span className="text-2xl font-bold">{formatNumber(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Komponenta za prikaz mesečne statistike
const MonthlyStatsCard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/monthly-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/monthly-stats');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        // U razvoju, prikazujemo mock podatke ako API još nije implementiran
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        
        return months.map((month, i) => ({
          name: month,
          'Free': Math.floor(Math.random() * 25) + (i <= currentMonth ? 15 : 0),
          'Basic': Math.floor(Math.random() * 15) + (i <= currentMonth ? 10 : 0),
          'Pro': Math.floor(Math.random() * 10) + (i <= currentMonth ? 5 : 0),
          'Enterprise': Math.floor(Math.random() * 3) + (i <= currentMonth ? 2 : 0),
          'Ukupno': 0,
        })).map(item => ({
          ...item,
          'Ukupno': item.Free + item.Basic + item.Pro + item.Enterprise
        }));
      }
    }
  });

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mesečna statistika</CardTitle>
          <CardDescription>Pregled korisnika po mesecima</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mesečna statistika</CardTitle>
        <CardDescription>Pregled korisnika po mesecima</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value as number)} />
              <Legend />
              <Bar dataKey="Free" stackId="a" fill="#94a3b8" />
              <Bar dataKey="Basic" stackId="a" fill="#0ea5e9" />
              <Bar dataKey="Pro" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Enterprise" stackId="a" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponenta za prikaz prihoda
const RevenueStatsCard = () => {
  const [period, setPeriod] = useState('mesecno');
  
  const data = [
    { mesec: 'Jan', prihod: 4200 },
    { mesec: 'Feb', prihod: 4900 },
    { mesec: 'Mar', prihod: 5400 },
    { mesec: 'Apr', prihod: 6100 },
    { mesec: 'Maj', prihod: 5800 },
    { mesec: 'Jun', prihod: 6700 },
    { mesec: 'Jul', prihod: 7500 },
    { mesec: 'Avg', prihod: 7900 },
    { mesec: 'Sep', prihod: 8400 },
    { mesec: 'Okt', prihod: 9100 },
    { mesec: 'Nov', prihod: 9500 },
    { mesec: 'Dec', prihod: 0 },
  ];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">Prihodi</CardTitle>
            <CardDescription>Pregled prihoda od pretplata</CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mesecno">Mesečno</SelectItem>
              <SelectItem value="kvartalno">Kvartalno</SelectItem>
              <SelectItem value="godisnje">Godišnje</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mesec" />
              <YAxis tickFormatter={(value) => `${value}€`} />
              <Tooltip formatter={(value) => `${formatNumber(value as number)}€`} />
              <Area type="monotone" dataKey="prihod" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <span className="text-sm text-muted-foreground">Ovaj mesec</span>
            <div className="text-xl font-semibold mt-1">9.500€</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Prošli mesec</span>
            <div className="text-xl font-semibold mt-1">9.100€</div>
            <span className="text-xs text-emerald-500">+4.4%</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Ove godine</span>
            <div className="text-xl font-semibold mt-1">70.500€</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Projekcija</span>
            <div className="text-xl font-semibold mt-1">80.000€</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponenta za prikaz novih korisnika
const RecentUsersCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { page: 1, limit: 5 }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      try {
        const response = await fetch(`${url}?page=${params.page}&limit=${params.limit}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        // U razvoju, prikazujemo mock podatke ako API još nije implementiran
        return {
          total: 256,
          page: 1,
          totalPages: 52,
          users: Array(5).fill(null).map((_, i) => ({
            id: i + 1,
            name: `Korisnik ${i + 1}`,
            email: `korisnik${i + 1}@example.com`,
            company: `Kompanija ${i + 1}`,
            role: i === 0 ? "admin" : "user",
            plan: i % 2 === 0 ? "free" : i % 3 === 0 ? "pro" : "basic",
            employeeCount: Math.floor(Math.random() * 100) + 5,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
            lastLogin: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
          }))
        };
      }
    }
  });

  if (isLoading || !data || !data.users) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nedavno registrovani korisnici</CardTitle>
          <CardDescription>Lista novih korisnika</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[285px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nedavno registrovani korisnici</CardTitle>
        <CardDescription>Lista novih korisnika</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="bg-primary/10">
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.company}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={user.plan === 'free' ? 'outline' : 'default'}>
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(user.createdAt), 'dd.MM.yyyy')}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="link" className="text-xs">
            Pogledaj sve korisnike
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponenta za prikaz blog postova koji čekaju na odobrenje
const PendingBlogPostsCard = () => {
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Upit za dohvatanje blog postova koji čekaju na odobrenje
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/blog/pending'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/blog/pending');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        // U razvoju, prikazujemo mock podatke ako API još nije implementiran
        return Array(3).fill(null).map((_, i) => ({
          id: i + 1,
          title: `Blog post naslov #${i + 1}`,
          excerpt: `Ovo je kratak opis blog posta broj ${i + 1} koji treba da bude odobren pre objavljivanja.`,
          authorUser: {
            name: "AI Generator",
            role: "system"
          },
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          imageUrl: "",
          status: "pending"
        }));
      }
    }
  });
  
  // Funkcija za odobravanje blog posta
  const handleApprove = async (postId: number) => {
    try {
      await apiRequest(`/api/blog/${postId}/approve`, {
        method: 'PUT'
      });
      refetch();
      toast({
        title: "Blog post odobren",
        description: "Blog post je uspešno odobren i objavljen.",
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom odobravanja blog posta.",
        variant: "destructive"
      });
    }
  };
  
  // Funkcija za odbijanje blog posta
  const handleReject = async (postId: number) => {
    try {
      await apiRequest(`/api/blog/${postId}/reject`, {
        method: 'PUT'
      });
      refetch();
      toast({
        title: "Blog post odbijen",
        description: "Blog post je uspešno odbijen.",
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom odbijanja blog posta.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Blog postovi koji čekaju na odobrenje</CardTitle>
          <CardDescription>Upravljajte čekajućim blog postovima</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[285px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Blog postovi koji čekaju na odobrenje</CardTitle>
          <CardDescription>Upravljajte čekajućim blog postovima</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[285px] flex flex-col items-center justify-center text-center p-6">
            <Check className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-medium">Nema čekajućih blog postova</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Trenutno nema blog postova koji čekaju na odobrenje.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Blog postovi koji čekaju na odobrenje</CardTitle>
          <CardDescription>Upravljajte čekajućim blog postovima</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((post: any) => (
              <div key={post.id} className="space-y-2">
                <div className="font-medium">{post.title}</div>
                <div className="text-sm text-muted-foreground">{post.excerpt}</div>
                <div className="text-xs text-muted-foreground">
                  Kreirano: {format(new Date(post.createdAt), 'dd.MM.yyyy HH:mm')}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedPost(post);
                      setIsPreviewOpen(true);
                    }}
                  >
                    Pregledaj
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(post.id)}
                  >
                    Odobri
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleReject(post.id)}
                  >
                    Odbij
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Dijalog za pregled blog posta */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              Pregled blog posta pre objavljivanja
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {selectedPost?.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={selectedPost.imageUrl} 
                  alt={selectedPost.title} 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            <div className="prose prose-sm max-w-none">
              <p>{selectedPost?.excerpt}</p>
              <div dangerouslySetInnerHTML={{ __html: selectedPost?.content || '' }} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Zatvori
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                handleReject(selectedPost?.id);
                setIsPreviewOpen(false);
              }}
            >
              Odbij
            </Button>
            <Button 
              onClick={() => {
                handleApprove(selectedPost?.id);
                setIsPreviewOpen(false);
              }}
            >
              Odobri i objavi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Komponenta za upravljanje korisnicima
const UserManagementTab = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { page, limit: 10, search, plan: planFilter }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey[1];
      try {
        let queryUrl = `${url}?page=${params.page}&limit=${params.limit}`;
        if (params.search) queryUrl += `&search=${params.search}`;
        if (params.plan) queryUrl += `&plan=${params.plan}`;
        
        const response = await fetch(queryUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        // U razvoju, prikazujemo mock podatke ako API još nije implementiran
        return {
          total: 256,
          page: params.page,
          totalPages: 26,
          users: Array(10).fill(null).map((_, i) => ({
            id: (params.page - 1) * 10 + i + 1,
            name: `Korisnik ${(params.page - 1) * 10 + i + 1}`,
            email: `korisnik${(params.page - 1) * 10 + i + 1}@example.com`,
            company: `Kompanija ${(params.page - 1) * 10 + i + 1}`,
            role: i === 0 && params.page === 1 ? "admin" : "user",
            plan: i % 10 === 0 ? "enterprise" : i % 5 === 0 ? "pro" : i % 3 === 0 ? "basic" : "free",
            employeeCount: Math.floor(Math.random() * 500) + 1,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
            lastLogin: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
          }))
        };
      }
    }
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Resetujemo stranicu na 1 kada korisnik pretražuje
    setPage(1);
  };
  
  const handlePlanFilterChange = (value: string) => {
    setPlanFilter(value);
    setPage(1); // Resetujemo stranicu na 1 kada se filter promeni
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upravljanje korisnicima</CardTitle>
          <CardDescription>
            Pregledajte i upravljajte korisnicima portala
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pretraži korisnike..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>
            
            <div className="w-full md:w-[200px]">
              <Select value={planFilter} onValueChange={handlePlanFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi planovi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi planovi</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !data || !data.users ? (
            <div className="text-center py-8">
              <p>Nema podataka za prikaz</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ime</TableHead>
                      <TableHead>Kompanija</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Broj zaposlenih</TableHead>
                      <TableHead>Datum registracije</TableHead>
                      <TableHead>Poslednja prijava</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {user.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.company}</TableCell>
                        <TableCell>
                          <Badge variant={user.plan === 'free' ? 'outline' : 'default'}>
                            {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.employeeCount}</TableCell>
                        <TableCell>{format(new Date(user.createdAt), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>{format(new Date(user.lastLogin), 'dd.MM.yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex items-center justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      const pageNumber = i + 1;
                      
                      if (data.totalPages <= 5) {
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              isActive={pageNumber === page}
                              onClick={() => setPage(pageNumber)}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      if (page <= 3) {
                        if (i < 4) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                isActive={pageNumber === page}
                                onClick={() => setPage(pageNumber)}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                      } else if (page >= data.totalPages - 2) {
                        if (i === 0) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink onClick={() => setPage(1)}>
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (i === 1) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        } else {
                          const pageNum = data.totalPages - 4 + i;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={pageNum === page}
                                onClick={() => setPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      } else {
                        if (i === 0) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink onClick={() => setPage(1)}>
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (i === 1) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        } else if (i === 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink isActive onClick={() => {}}>
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (i === 3) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        } else {
                          return (
                            <PaginationItem key={data.totalPages}>
                              <PaginationLink onClick={() => setPage(data.totalPages)}>
                                {data.totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      }
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(prev => Math.min(data.totalPages, prev + 1))}
                        disabled={page === data.totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Komponenta za upravljanje planovima/cenovnikom
const PlanManagementTab = () => {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<any>(null);
  
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/plans');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        // U razvoju, prikazujemo mock podatke ako API još nije implementiran
        return [
          {
            id: "free",
            name: "Free",
            priceMonthly: 0,
            maxEmployees: 20,
            features: ["Generisanje dokumenata", "Pretraživanje propisa", "Blanko obrasci", "Osnovni AI asistent"],
            isActive: true
          },
          {
            id: "basic",
            name: "Basic",
            priceMonthly: 39.99,
            maxEmployees: 50,
            features: ["Sve iz Free paketa", "Personalizovani dokumenti", "Srednji AI asistent", "Automatska analiza rizika"],
            isActive: true
          },
          {
            id: "pro",
            name: "Pro",
            priceMonthly: 69.99,
            maxEmployees: 100,
            features: ["Sve iz Basic paketa", "Napredna analiza dokumentacije", "Potpuni AI asistent", "Prioritetna podrška"],
            isActive: true
          },
          {
            id: "enterprise",
            name: "Enterprise",
            priceMonthly: 149.99,
            maxEmployees: 500,
            features: ["Sve iz Pro paketa", "Potpuna integracija sa vašim sistemima", "Prilagođeni dokumenti", "Napredna analitika"],
            isActive: true
          }
        ];
      }
    }
  });
  
  const handleUpdatePlan = async () => {
    if (!editingPlan) return;
    
    try {
      await apiRequest(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingPlan),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setEditingPlan(null);
      refetch();
      toast({
        title: "Plan ažuriran",
        description: "Plan je uspešno ažuriran.",
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja plana.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upravljanje planovima</CardTitle>
          <CardDescription>
            Pregledajte i ažurirajte planove i cene
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plans && plans.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.id === "free" ? "Besplatan plan" : `${plan.priceMonthly.toFixed(2)}€ mesečno`}
                      </CardDescription>
                    </div>
                    <div>
                      <Badge variant={plan.isActive ? "default" : "destructive"}>
                        {plan.isActive ? "Aktivan" : "Neaktivan"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Detalji</h4>
                      <div className="text-sm">Maksimalan broj zaposlenih: {plan.maxEmployees}</div>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-semibold mb-2">Funkcionalnosti</h4>
                      <ul className="space-y-1">
                        {plan.features.map((feature: string, i: number) => (
                          <li key={i} className="flex text-sm">
                            <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingPlan(plan)}
                  >
                    Izmeni plan
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog za uređivanje plana */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Izmeni plan: {editingPlan?.name}</DialogTitle>
            <DialogDescription>
              Ažurirajte detalje pretplatničkog plana.
            </DialogDescription>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Naziv plana</Label>
                <Input 
                  id="plan-name" 
                  value={editingPlan.name} 
                  onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-price">Cena (mesečno u €)</Label>
                <Input 
                  id="plan-price" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={editingPlan.priceMonthly} 
                  onChange={(e) => setEditingPlan({...editingPlan, priceMonthly: parseFloat(e.target.value)})}
                  disabled={editingPlan.id === "free"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-employees">Maksimalan broj zaposlenih</Label>
                <Input 
                  id="plan-employees" 
                  type="number" 
                  min="1" 
                  value={editingPlan.maxEmployees} 
                  onChange={(e) => setEditingPlan({...editingPlan, maxEmployees: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Funkcionalnosti</Label>
                <div className="space-y-2">
                  {editingPlan.features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input 
                        value={feature} 
                        onChange={(e) => {
                          const newFeatures = [...editingPlan.features];
                          newFeatures[i] = e.target.value;
                          setEditingPlan({...editingPlan, features: newFeatures});
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          const newFeatures = editingPlan.features.filter((_: string, idx: number) => idx !== i);
                          setEditingPlan({...editingPlan, features: newFeatures});
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M18 6 6 18"></path>
                          <path d="m6 6 12 12"></path>
                        </svg>
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      setEditingPlan({
                        ...editingPlan, 
                        features: [...editingPlan.features, "Nova funkcionalnost"]
                      });
                    }}
                  >
                    Dodaj funkcionalnost
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Label htmlFor="plan-active">Aktivan</Label>
                <input 
                  type="checkbox" 
                  id="plan-active" 
                  checked={editingPlan.isActive} 
                  onChange={(e) => setEditingPlan({...editingPlan, isActive: e.target.checked})}
                  className="h-4 w-4"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>Otkaži</Button>
            <Button onClick={handleUpdatePlan}>Sačuvaj izmene</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Glavna komponenta admin dashboard-a
const AdminDashboard = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Upravljajte korisnicima, pretplatama i sadržajem portala
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Pregled</TabsTrigger>
          <TabsTrigger value="users">Korisnici</TabsTrigger>
          <TabsTrigger value="plans">Planovi</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UserStatsCard />
            <ActivityStatsCard />
            <PendingBlogPostsCard />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <MonthlyStatsCard />
            <RevenueStatsCard />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <RecentUsersCard />
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>
        
        <TabsContent value="plans">
          <PlanManagementTab />
        </TabsContent>
        
        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>Upravljanje blogom</CardTitle>
              <CardDescription>
                Pregledajte i upravljajte blog postovima
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-2">Postovi koji čekaju na odobrenje</h3>
                  <PendingBlogPostsCard />
                </div>
                
                {/* Ovde bi išla tabela sa svim blog postovima */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;