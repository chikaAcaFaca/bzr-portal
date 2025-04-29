import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";
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
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <ProtectedContent />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// Komponenta koja zahteva autentikaciju
function ProtectedContent() {
  const { user, isLoading } = useAuth();
  
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
    return <Redirect to="/auth" />;
  }
  
  // Ako je korisnik prijavljen, prikazujemo glavni interfejs
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Header />
        <main className="p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/job-positions" component={JobPositions} />
            <Route path="/job-descriptions" component={JobDescriptions} />
            <Route path="/base-documents" component={BaseDocuments} />
            <Route path="/risk-categories" component={RiskCategories} />
            <Route path="/safety-measures" component={SafetyMeasures} />
            <Route path="/employee-training" component={EmployeeTraining} />
            <Route path="/reports" component={Reports} />
            <Route path="/document-processor" component={DocumentProcessor} />
            <Route path="/ai-assistant" component={AIAssistant} />
            <Route path="/knowledge-references" component={KnowledgeReferences} />
            <Route path="/settings" component={Settings} />
            <Route path="/users" component={Users} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  useMobileSidebar();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;