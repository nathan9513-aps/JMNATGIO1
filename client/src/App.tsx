import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import TimeTracking from "@/pages/time-tracking";
import Clients from "@/pages/clients";
import Projects from "@/pages/projects";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AdminSetup from "@/pages/admin-setup";
import OAuthCallback from "@/pages/oauth-callback";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 w-full min-w-0">
        {/* Prerelease Banner */}
        <Alert className="rounded-none border-l-0 border-r-0 border-t-0 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
            ⚠️ Build Prerelease - Versione di sviluppo 1.14621.0_zinc_prerelease
          </AlertDescription>
        </Alert>
        
        <Header />
        <main className="p-4 w-full full-width-layout">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/time-tracking" component={TimeTracking} />
            <Route path="/clients" component={Clients} />
            <Route path="/projects" component={Projects} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route path="/admin/setup" component={AdminSetup} />
            <Route path="/oauth/callback" component={OAuthCallback} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
