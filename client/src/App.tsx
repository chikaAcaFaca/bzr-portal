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
import DocumentStorage from "./pages/document-storage";
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
import ReferralProgram from "./pages/referral-program";
import ResetPassword from "./pages/reset-password";
import FileUtils from "./pages/file-utils";
import LandingPage from "./pages/landing-page";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireAuth, RequireAdmin, RedirectIfAuthenticated } from "@/lib/route-guards";

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
      {/* Javna stranica - Landing Page */}
      <Route path="/">
        {({ match }) => {
          if (match) {
            return <LandingPage />;
          }
          return null;
        }}
      </Route>
      
      {/* Javna stranica - autentifikacija */}
      <Route path="/auth">
        <RedirectIfAuthenticated>
          <AuthPage />
        </RedirectIfAuthenticated>
      </Route>
      
      {/* Javne stranice - blog */}
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
      
      {/* Stranice zaštićene za registrovane korisnike */}
      <Route path="/dashboard">
        <RequireAuth>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/job-positions">
        <RequireAuth>
          <MainLayout>
            <JobPositions />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/job-descriptions">
        <RequireAuth>
          <MainLayout>
            <JobDescriptions />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/base-documents">
        <RequireAuth>
          <MainLayout>
            <BaseDocuments />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/risk-categories">
        <RequireAuth>
          <MainLayout>
            <RiskCategories />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/safety-measures">
        <RequireAuth>
          <MainLayout>
            <SafetyMeasures />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/employee-training">
        <RequireAuth>
          <MainLayout>
            <EmployeeTraining />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/reports">
        <RequireAuth>
          <MainLayout>
            <Reports />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/document-processor">
        <RequireAuth>
          <MainLayout>
            <DocumentProcessor />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/document-storage">
        <RequireAuth>
          <MainLayout>
            <DocumentStorage />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/ai-assistant">
        <RequireAuth>
          <MainLayout>
            <AIAssistant />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/knowledge-references">
        <RequireAuth>
          <MainLayout>
            <KnowledgeReferences />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/settings">
        <RequireAuth>
          <MainLayout>
            <Settings />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/user-profile">
        <RequireAuth>
          <MainLayout>
            <UserProfile />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/referral-program">
        <RequireAuth>
          <MainLayout>
            <ReferralProgram />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/reset-password">
        <ResetPassword />
      </Route>
      
      <Route path="/file-utils">
        <RequireAuth>
          <MainLayout>
            <FileUtils />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      <Route path="/regulatory-updates">
        <RequireAuth>
          <MainLayout>
            <RegulatoryUpdates />
          </MainLayout>
        </RequireAuth>
      </Route>
      
      {/* Admin stranice */}
      <Route path="/admin-dashboard">
        <RequireAdmin>
          <MainLayout>
            <AdminDashboard />
          </MainLayout>
        </RequireAdmin>
      </Route>
      
      <Route path="/users">
        <RequireAdmin>
          <MainLayout>
            <Users />
          </MainLayout>
        </RequireAdmin>
      </Route>
      
      {/* 404 stranica */}
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