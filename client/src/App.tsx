import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/internships" component={InternshipsPage} />
      <Route path="/groups" component={GroupsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/forums" component={ForumsPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
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
