import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";
import { OnboardingTourProvider } from "./components/onboarding/onboarding-tour";
import Dashboard from "./pages/dashboard";
import JobPositions from "./pages/job-positions";
import JobDescriptions from "./pages/job-descriptions";
import BaseDocuments from "./pages/base-documents";
import RiskCategories from "./pages/risk-categories";
import SafetyMeasures from "./pages/safety-measures";
import EmployeeTraining from "./pages/employee-training";
import Reports from "./pages/reports";
import DocumentProcessor from "./pages/document-processor";
import AIAssistant from "./pages/ai-assistant";
import KnowledgeReferences from "./pages/knowledge-references";
import Settings from "./pages/settings";
import Users from "./pages/users";
import AuthPage from "./pages/auth-page";
import Blog from "./pages/blog";
import BlogPost from "./pages/blog-post";
import UserProfile from "./pages/user-profile";
import AdminDashboard from "./pages/admin-dashboard";
import RegulatoryUpdates from "./pages/regulatory-updates";
import { AuthProvider, useAuth } from "@/lib/auth-context";


// Komponenta koja zahteva autentikaciju
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path: string }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Dok se proverava autentikacija, prikazujemo loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Ako korisnik nije prijavljen, preusmeravamo ga na auth stranicu
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  // Ako je korisnik prijavljen, prikazujemo komponentu
  return <Component />;
}

// Komponenta MainLayout za zajednički UI (sidebar, header)
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      
      <Route path="/job-positions">
        <MainLayout>
          <JobPositions />
        </MainLayout>
      </Route>
      
      <Route path="/job-descriptions">
        <MainLayout>
          <JobDescriptions />
        </MainLayout>
      </Route>
      
      <Route path="/base-documents">
        <MainLayout>
          <BaseDocuments />
        </MainLayout>
      </Route>
      
      <Route path="/risk-categories">
        <MainLayout>
          <RiskCategories />
        </MainLayout>
      </Route>
      
      <Route path="/safety-measures">
        <MainLayout>
          <SafetyMeasures />
        </MainLayout>
      </Route>
      
      <Route path="/employee-training">
        <MainLayout>
          <EmployeeTraining />
        </MainLayout>
      </Route>
      
      <Route path="/reports">
        <MainLayout>
          <Reports />
        </MainLayout>
      </Route>
      
      <Route path="/document-processor">
        <MainLayout>
          <DocumentProcessor />
        </MainLayout>
      </Route>
      
      <Route path="/ai-assistant">
        <MainLayout>
          <AIAssistant />
        </MainLayout>
      </Route>
      
      <Route path="/knowledge-references">
        <MainLayout>
          <KnowledgeReferences />
        </MainLayout>
      </Route>
      
      <Route path="/settings">
        <MainLayout>
          <Settings />
        </MainLayout>
      </Route>
      
      <Route path="/users">
        <MainLayout>
          <Users />
        </MainLayout>
      </Route>
      
      <Route path="/blog">
        <MainLayout>
          <Blog />
        </MainLayout>
      </Route>
      
      <Route path="/blog/:slug">
        <MainLayout>
          <BlogPost />
        </MainLayout>
      </Route>
      
      <Route path="/user-profile">
        <MainLayout>
          <UserProfile />
        </MainLayout>
      </Route>
      
      <Route path="/admin-dashboard">
        <MainLayout>
          <AdminDashboard />
        </MainLayout>
      </Route>

      <Route path="/regulatory-updates">
        <MainLayout>
          <RegulatoryUpdates />
        </MainLayout>
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <Toaster />
            <OnboardingTourProvider>
              <Router />
            </OnboardingTourProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;