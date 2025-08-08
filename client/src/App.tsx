import { Switch, Route } from "wouter";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/AuthContext";

// Pages
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import InternshipsPage from "@/pages/internships";
import GroupsPage from "@/pages/groups";
import EventsPage from "@/pages/events";
import ForumsPage from "@/pages/forums";
import ResourcesPage from "@/pages/resources";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";

function ProtectedRoute({ component: Component }: { component: React.FC }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }
  
  return user ? <Component /> : <Login />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/internships" component={() => <ProtectedRoute component={InternshipsPage} />} />
      <Route path="/groups" component={() => <ProtectedRoute component={GroupsPage} />} />
      <Route path="/events" component={() => <ProtectedRoute component={EventsPage} />} />
      <Route path="/forums" component={() => <ProtectedRoute component={ForumsPage} />} />
      <Route path="/resources" component={() => <ProtectedRoute component={ResourcesPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route component={NotFound} />
    </Switch>
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
