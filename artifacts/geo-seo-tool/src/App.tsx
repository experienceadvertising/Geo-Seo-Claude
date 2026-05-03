import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Results from "@/pages/results";
import Simulate from "@/pages/simulate";
import Admin from "@/pages/admin";
import Pricing from "@/pages/pricing";
import Methodology from "@/pages/methodology";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import VerifyEmailPage from "@/pages/verify-email";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import UnsubscribePage from "@/pages/unsubscribe";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) {
    // Remember where the user was trying to go so we can return them after
    // they sign in. wouter strips the BASE_URL prefix from window.location,
    // so use the relative path here.
    const next = window.location.pathname + window.location.search;
    const target = `/sign-in?next=${encodeURIComponent(next)}`;
    return <Redirect to={target} />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/unsubscribe" component={UnsubscribePage} />
        <Route path="/results/:id">
          <RequireAuth><Results /></RequireAuth>
        </Route>
        <Route path="/simulate/:id">
          <RequireAuth><Simulate /></RequireAuth>
        </Route>
        <Route path="/admin">
          <RequireAuth><Admin /></RequireAuth>
        </Route>
        <Route path="/pricing" component={Pricing} />
        <Route path="/methodology" component={Methodology} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
