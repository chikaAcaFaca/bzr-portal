import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Users, 
  FileText, 
  Search, 
  User,
  PieChart,
  BarChart2, 
  BarChart4,
  CreditCard,
  Activity,
  BookOpen
} from "lucide-react";
import { BlogApproval } from "@/components/admin/blog-approval";
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
import PageHeader from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { AdminDocumentsViewer } from '@/components/admin/admin-documents-viewer';

// Mock podaci za demo
const userStats = {
  total: 256,
  free: 198,
  pro: 58,
  newToday: 3,
  activeToday: 42,
};

const activityStats = {
  aiQuestions: 847,
  documentsGenerated: 392,
  complianceAnalyses: 153,
  blogPostsCreated: 126,
};

const recentUsers = [
  { id: 1, name: "Marko Petrović", email: "marko@kompanija.rs", plan: "pro", registeredOn: "15.04.2023.", lastActive: "Danas" },
  { id: 2, name: "Ana Simić", email: "ana@firma.rs", plan: "free", registeredOn: "20.04.2023.", lastActive: "Juče" },
  { id: 3, name: "Jovan Nikolić", email: "jovan@biznis.rs", plan: "pro", registeredOn: "25.04.2023.", lastActive: "Pre 3 dana" },
  { id: 4, name: "Milica Pavlović", email: "milica@preduzeće.rs", plan: "free", registeredOn: "01.05.2023.", lastActive: "Danas" },
];

// Komponenta za prikaz statistike korisnika
const UserStatsCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Statistika korisnika</CardTitle>
        <CardDescription>Pregled registrovanih korisnika</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">Ukupno korisnika</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{userStats.free}</div>
            <p className="text-xs text-muted-foreground">FREE korisnika</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{userStats.pro}</div>
            <p className="text-xs text-muted-foreground">PRO korisnika</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{userStats.newToday}</div>
            <p className="text-xs text-muted-foreground">Novih danas</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{userStats.activeToday}</div>
            <p className="text-xs text-muted-foreground">Aktivnih danas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponenta za prikaz aktivnosti na portalu
const ActivityStatsCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Aktivnost na portalu</CardTitle>
        <CardDescription>Pregled aktivnosti korisnika</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">AI pitanja</span>
            </div>
            <span className="text-2xl font-bold">{activityStats.aiQuestions}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Dokumenti</span>
            </div>
            <span className="text-2xl font-bold">{activityStats.documentsGenerated}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Analize</span>
            </div>
            <span className="text-2xl font-bold">{activityStats.complianceAnalyses}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Blog postovi</span>
            </div>
            <span className="text-2xl font-bold">{activityStats.blogPostsCreated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponenta za prikaz nedavno registrovanih korisnika
const RecentUsersCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Nedavno registrovani korisnici</CardTitle>
            <CardDescription>Pregled novih korisnika</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/users">Pogledaj sve</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Korisnik</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Registrovan</TableHead>
              <TableHead>Aktivnost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'}>
                    {user.plan === 'pro' ? 'PRO' : 'FREE'}
                  </Badge>
                </TableCell>
                <TableCell>{user.registeredOn}</TableCell>
                <TableCell>{user.lastActive}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Komponenta za brze akcije administratora
const AdminQuickActions = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Administratorske akcije</CardTitle>
        <CardDescription>Česte administratorske operacije</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Upravljanje korisnicima
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline" 
            onClick={() => setActiveTab("blogovi")}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Odobravanje blog postova
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <PieChart className="mr-2 h-4 w-4" />
            Eksport izveštaja
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <CreditCard className="mr-2 h-4 w-4" />
            Pregled pretplata
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pregled");

  // Provera da li je korisnik admin
  if (user?.role !== 'admin') {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">Pristup ograničen</h2>
          <p className="text-muted-foreground mb-6">
            Nemate pristup administratorskom panelu. Ova stranica je dostupna samo administratorima.
          </p>
          <Button asChild>
            <a href="/">Povratak na Početnu</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Admin Dashboard" 
        description="Upravljanje BZR portalom i korisnicima" 
      />

      <div className="mb-8">
        <AdminDocumentsViewer />
      </div>

      <div className="mb-6">
        <Tabs defaultValue="pregled" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="pregled">Pregled</TabsTrigger>
              <TabsTrigger value="korisnici">Korisnici</TabsTrigger>
              <TabsTrigger value="blogovi">Blogovi</TabsTrigger>
              <TabsTrigger value="izveštaji">Izveštaji</TabsTrigger>
            </TabsList>

            <div className="flex items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pretraži..."
                  className="w-72 pl-8"
                />
              </div>
            </div>
          </div>

          <TabsContent value="pregled" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UserStatsCard />
              <ActivityStatsCard />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <RecentUsersCard />
              </div>
              <div>
                <AdminQuickActions />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="korisnici">
            <Card>
              <CardHeader>
                <CardTitle>Upravljanje korisnicima</CardTitle>
                <CardDescription>
                  Pregled i upravljanje korisničkim nalozima, pravima pristupa i pretplatama
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Ova sekcija će prikazati detaljni pregled korisnika sa opcijama za upravljanje.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blogovi">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Upravljanje blog postovima</CardTitle>
                    <CardDescription>
                      Odobravanje, odbijanje i upravljanje blog sadržajem
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/blog">Vidi blog</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BlogApproval />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="izveštaji">
            <Card>
              <CardHeader>
                <CardTitle>Izveštaji</CardTitle>
                <CardDescription>
                  Napredni izveštaji i statistika korišćenja portala
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Ova sekcija će prikazati različite izveštaje i metrike o korišćenju portala.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}