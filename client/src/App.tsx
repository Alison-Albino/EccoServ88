import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Login from "@/pages/login";
import ClientDashboard from "@/pages/client-dashboard";
import ProviderDashboard from "@/pages/provider-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!allowedRoles.includes(user.userType)) {
    return <NotFound />;
  }

  return <Component />;
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/">
        {user.userType === "client" && <ClientDashboard />}
        {user.userType === "provider" && <ProviderDashboard />}
        {user.userType === "admin" && <AdminDashboard />}
      </Route>
      
      <Route path="/client">
        <ProtectedRoute component={ClientDashboard} allowedRoles={["client"]} />
      </Route>
      
      <Route path="/provider">
        <ProtectedRoute component={ProviderDashboard} allowedRoles={["provider"]} />
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
