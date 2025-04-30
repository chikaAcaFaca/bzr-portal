import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Edit, Trash, Eye, TrendingUp, Users, FileText, BarChart4 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

// Definicije paketa i njihovih cena
const pricingPlans = [
  { id: 'free', name: 'Free', priceMonthly: 0, maxEmployees: 20, features: ['Generisanje dokumenata', 'Pretraživanje propisa', 'Blanko obrasci', 'Osnovni AI asistent'] },
  { id: 'basic', name: 'Basic', priceMonthly: 39.99, maxEmployees: 50, features: ['Sve iz Free paketa', 'Personalizovani dokumenti', 'Srednji AI asistent', 'Automatska analiza rizika'] },
  { id: 'pro', name: 'Pro', priceMonthly: 69.99, maxEmployees: 100, features: ['Sve iz Basic paketa', 'Napredna analiza dokumentacije', 'Potpuni AI asistent', 'Prioritetna podrška'] },
  { id: 'enterprise', name: 'Enterprise', priceMonthly: 149.99, maxEmployees: 500, features: ['Sve iz Pro paketa', 'Potpuna integracija sa vašim sistemima', 'Prilagođeni dokumenti', 'Napredna analitika'] }
];

// Podaci za grafikone
const generateMockData = () => {
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
};

// Komponente za grafikone
const SubscriptionChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Area type="monotone" dataKey="Ukupno" stackId="1" stroke="#8884d8" fill="#8884d8" />
    </AreaChart>
  </ResponsiveContainer>
);

const PlanDistributionChart = ({ data }: { data: any[] }) => {
  // Izračunaj proseke za poslednjih 3 meseca
  const lastData = data.slice(Math.max(data.length - 3, 0));
  const avgData = [
    {
      name: 'Prosek pretplatnika',
      Free: Math.round(lastData.reduce((sum, item) => sum + item.Free, 0) / lastData.length),
      Basic: Math.round(lastData.reduce((sum, item) => sum + item.Basic, 0) / lastData.length),
      Pro: Math.round(lastData.reduce((sum, item) => sum + item.Pro, 0) / lastData.length),
      Enterprise: Math.round(lastData.reduce((sum, item) => sum + item.Enterprise, 0) / lastData.length)
    }
  ];
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={avgData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Free" fill="#10b981" />
        <Bar dataKey="Basic" fill="#3b82f6" />
        <Bar dataKey="Pro" fill="#8b5cf6" />
        <Bar dataKey="Enterprise" fill="#f43f5e" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Helper funkcija za formatiranje datuma
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Status badge helper
const StatusBadge = ({ status }: { status: string }) => {
  let variant: "outline" | "secondary" | "destructive" | "default" = "outline";
  let label = status;
  
  switch (status) {
    case "pending_approval":
      variant = "outline";
      label = "Čeka odobrenje";
      break;
    case "approved":
      variant = "secondary";
      label = "Odobreno";
      break;
    case "published":
      variant = "default";
      label = "Objavljeno";
      break;
    case "rejected":
      variant = "destructive";
      label = "Odbijeno";
      break;
    default:
      variant = "outline";
  }
  
  return <Badge variant={variant}>{label}</Badge>;
};

// Glavna komponenta admin dashboard-a
const AdminDashboard = () => {
  const [blogReviewDialogOpen, setBlogReviewDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [activeTab, setActiveTab] = useState("blog-posts");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Generisani podaci za grafikon
  const chartData = generateMockData();
  
  // Dohvatanje blog postova koji čekaju odobrenje
  const { data: pendingPosts = [], isLoading: isLoadingBlogs } = useQuery({
    queryKey: ['/api/blog', 'pending_approval'],
    queryFn: async () => {
      const response = await apiRequest('/api/blog', {
        method: 'GET',
        params: { status: 'pending_approval' }
      });
      return response;
    }
  });
  
  // Dohvatanje statistike korisnika
  const { data: userStats = { total: 0, free: 0, paid: 0 }, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/user-stats'],
    queryFn: async () => {
      // U stvarnoj implementaciji, ovo bi dohvatalo podatke sa servera
      return {
        total: 256,
        free: 198,
        basic: 37,
        pro: 18,
        enterprise: 3
      };
    }
  });
  
  // Mutacija za odobravanje/odbijanje blog posta
  const blogStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminFeedback, title }: any) => {
      return apiRequest(`/api/blog/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminFeedback }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      setBlogReviewDialogOpen(false);
      setSelectedBlog(null);
      setFeedbackText("");
      
      toast({
        title: "Status blog posta ažuriran",
        description: "Uspešno ste ažurirali status blog posta.",
      });
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju statusa blog posta.",
        variant: "destructive"
      });
    }
  });
  
  // Mutacija za uređivanje blog posta
  const blogEditMutation = useMutation({
    mutationFn: async ({ id, title, content }: any) => {
      return apiRequest(`/api/blog/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      
      toast({
        title: "Blog post ažuriran",
        description: "Uspešno ste ažurirali blog post.",
      });
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju blog posta.",
        variant: "destructive"
      });
    }
  });
  
  // Funkcija za odobravanje blog posta
  const handleApprove = () => {
    if (!selectedBlog) return;
    
    // Ako je naslov uređen, prvo ažuriraj naslov
    if (editTitle !== selectedBlog.title) {
      blogEditMutation.mutate({
        id: selectedBlog.id,
        title: editTitle,
        content: selectedBlog.content
      });
    }
    
    blogStatusMutation.mutate({
      id: selectedBlog.id,
      status: "published",
      adminFeedback: feedbackText
    });
  };
  
  // Funkcija za odbijanje blog posta
  const handleReject = () => {
    if (!selectedBlog) return;
    
    if (!feedbackText.trim()) {
      toast({
        title: "Potreban feedback",
        description: "Molimo unesite razlog odbijanja pre nego što odbijete blog post.",
        variant: "destructive"
      });
      return;
    }
    
    blogStatusMutation.mutate({
      id: selectedBlog.id,
      status: "rejected",
      adminFeedback: feedbackText
    });
  };
  
  // Funkcija za otvaranje dijaloga za pregled
  const openReviewDialog = (blog: any) => {
    setSelectedBlog(blog);
    setEditTitle(blog.title);
    setFeedbackText("");
    setBlogReviewDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="blog-posts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="blog-posts" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Blog postovi
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Korisnici
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center">
            <BarChart4 className="mr-2 h-4 w-4" />
            Statistika
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Planovi i cene
          </TabsTrigger>
        </TabsList>
        
        {/* Tab za blog postove koji čekaju odobrenje */}
        <TabsContent value="blog-posts">
          <Card>
            <CardHeader>
              <CardTitle>Blog postovi koji čekaju odobrenje</CardTitle>
              <CardDescription>
                Pregledajte i odobrite blog postove koji su automatski generisani od AI asistenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBlogs ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nema blog postova koji čekaju odobrenje.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPosts.map((post: any) => (
                    <div key={post.id} className="border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Kreirano: {formatDate(post.createdAt)}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <StatusBadge status={post.status} />
                            <span className="text-sm px-2 py-0.5 bg-muted rounded-full">
                              {post.category}
                            </span>
                          </div>
                          <p className="mt-3 text-sm line-clamp-2">{post.excerpt}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openReviewDialog(post)}>
                            <Eye className="h-4 w-4 mr-1" /> Pregledaj
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab za korisnike */}
        <TabsContent value="users">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ukupno korisnika</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.total}</div>
                <p className="text-muted-foreground text-xs mt-1">
                  +24% u odnosu na prethodni mesec
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Free korisnici</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.free}</div>
                <p className="text-muted-foreground text-xs mt-1">
                  {Math.round((userStats.free / userStats.total) * 100)}% svih korisnika
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Plaćeni korisnici</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.basic + userStats.pro + userStats.enterprise}</div>
                <p className="text-muted-foreground text-xs mt-1">
                  {Math.round(((userStats.basic + userStats.pro + userStats.enterprise) / userStats.total) * 100)}% svih korisnika
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Konverzija Free u Pro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(((userStats.basic + userStats.pro + userStats.enterprise) / userStats.free) * 100)}%
                </div>
                <p className="text-muted-foreground text-xs mt-1">
                  Prosečna stopa konverzije
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribucija korisnika po paketima</CardTitle>
              </CardHeader>
              <CardContent>
                <PlanDistributionChart data={chartData} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Rast korisnika kroz vreme</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionChart data={chartData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab za statistiku */}
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Statistika portala</CardTitle>
              <CardDescription>
                Pregled aktivnosti na portalu tokom vremena
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold mb-4">Aktivnost korisnika u poslednjih 30 dana</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold">847</div>
                      <div className="text-sm text-muted-foreground">AI pitanja</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold">392</div>
                      <div className="text-sm text-muted-foreground">Generisani dokumenti</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold">153</div>
                      <div className="text-sm text-muted-foreground">Analize usklađenosti</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-4">Popularne kategorije blog postova</h4>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold">32%</div>
                      <div className="text-sm text-muted-foreground">Zakonska regulativa</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold">27%</div>
                      <div className="text-sm text-muted-foreground">Procena rizika</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold">18%</div>
                      <div className="text-sm text-muted-foreground">Obuke zaposlenih</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold">23%</div>
                      <div className="text-sm text-muted-foreground">Ostalo</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab za cenovnik i planove */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Planovi i cene</CardTitle>
              <CardDescription>
                Upravljajte dostupnim paketima i cenama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pricingPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-xl font-bold mt-1">
                          {plan.priceMonthly === 0 ? "Besplatno" : `${plan.priceMonthly} € / mesečno`}
                        </p>
                        <p className="text-sm mt-1">Do {plan.maxEmployees} zaposlenih</p>
                        <ul className="mt-3 space-y-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="text-sm flex items-start">
                              <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" /> Izmeni
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog za pregled i odobravanje/odbijanje blog posta */}
      <Dialog open={blogReviewDialogOpen} onOpenChange={setBlogReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pregled blog posta</DialogTitle>
            <DialogDescription>
              Pregledajte sadržaj i odobrite ili odbijte blog post
            </DialogDescription>
          </DialogHeader>
          
          {selectedBlog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Naslov</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Originalno pitanje</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {selectedBlog.originalQuestion}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Sadržaj</Label>
                <div className="p-4 border rounded-md h-64 overflow-y-auto whitespace-pre-wrap">
                  {selectedBlog.content}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Kategorija i tagovi</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedBlog.category}</Badge>
                  {selectedBlog.tags && selectedBlog.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback">Komentar / Feedback (obavezan za odbijanje)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Unesite komentar ili razlog odbijanja..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={blogStatusMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" /> Odbij
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setBlogReviewDialogOpen(false)}
              >
                Otkaži
              </Button>
              <Button
                onClick={handleApprove}
                disabled={blogStatusMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" /> Odobri i objavi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;