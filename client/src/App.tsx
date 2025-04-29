import { Switch, Route } from "wouter";
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
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'


// Import Supabase client from our lib
import { supabase } from './lib/supabase';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const session = supabase.auth.session();
    setSession(session);

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => {
      authListener.unsubscribe();
    }
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google' // Or another provider
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};


const useAuth = () => {
  return useContext(AuthContext);
};


function Router() {
  const { session } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      {session && <Sidebar />} {/* Show sidebar only if logged in */}
      <div className="flex-1 overflow-y-auto">
        {session && <Header />} {/* Show header only if logged in */}
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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