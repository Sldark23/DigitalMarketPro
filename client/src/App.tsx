import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { useEffect } from "react";

// Pages
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Products from "@/pages/products";
import CreateProduct from "@/pages/products/create";
import Affiliates from "@/pages/affiliates";
import Sales from "@/pages/sales";
import Marketplace from "@/pages/marketplace";
import Profile from "@/pages/profile";
import Withdrawals from "@/pages/withdrawals";
import Plans from "@/pages/plans";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";

// Components
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { NotificationToast } from "@/components/ui/notification-toast";

function AuthenticatedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component {...rest} />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Header />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
      <NotificationToast />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/checkout/:productId?" component={(params) => <AuthenticatedRoute component={Checkout} params={params} />} />
      
      <Route path="/">
        <AuthenticatedRoute component={Dashboard} />
      </Route>
      
      <Route path="/dashboard">
        <AuthenticatedRoute component={Dashboard} />
      </Route>
      
      <Route path="/products">
        <AuthenticatedRoute component={Products} />
      </Route>
      
      <Route path="/products/create">
        <AuthenticatedRoute component={CreateProduct} />
      </Route>
      
      <Route path="/affiliates">
        <AuthenticatedRoute component={Affiliates} />
      </Route>
      
      <Route path="/sales">
        <AuthenticatedRoute component={Sales} />
      </Route>
      
      <Route path="/marketplace">
        <AuthenticatedRoute component={Marketplace} />
      </Route>
      
      <Route path="/profile">
        <AuthenticatedRoute component={Profile} />
      </Route>
      
      <Route path="/withdrawals">
        <AuthenticatedRoute component={Withdrawals} />
      </Route>
      
      <Route path="/plans">
        <AuthenticatedRoute component={Plans} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithAuth() {
  return (
    <AppLayout>
      <Router />
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppWithAuth />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
