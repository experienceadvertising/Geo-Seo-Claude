import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Home from "@/pages/home";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { CookieConsent } from "@/components/cookie-consent";
import { RouteTracker } from "@/components/route-tracker";
import { Loader2 } from "lucide-react";

const NotFound = lazy(() => import("@/pages/not-found"));
const Results = lazy(() => import("@/pages/results"));
const Simulate = lazy(() => import("@/pages/simulate"));
const Projects = lazy(() => import("@/pages/projects"));
const Admin = lazy(() => import("@/pages/admin"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Upgrade = lazy(() => import("@/pages/upgrade"));
const Methodology = lazy(() => import("@/pages/methodology"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const VsComparison = lazy(() => import("@/pages/vs-comparison"));
const BestAeoToolsPage = lazy(() => import("@/pages/best-aeo-tools"));
const BestGeoToolsPage = lazy(() => import("@/pages/best-geo-tools"));
const HowToRankInChatGPT = lazy(() => import("@/pages/how-to-rank-in-chatgpt"));
const WhatIsAEO = lazy(() => import("@/pages/what-is-answer-engine-optimization"));
const HowToAppearInAISearch = lazy(() => import("@/pages/how-to-appear-in-ai-search"));
const ProductLanding = lazy(() => import("@/pages/product-landing"));
const Benchmark = lazy(() => import("@/pages/benchmark"));
const Changelog = lazy(() => import("@/pages/changelog"));
const SignInPage = lazy(() => import("@/pages/sign-in"));
const SignUpPage = lazy(() => import("@/pages/sign-up"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const UnsubscribePage = lazy(() => import("@/pages/unsubscribe"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const TermsPage = lazy(() => import("@/pages/terms"));
const GoogleDataUsePage = lazy(() => import("@/pages/google-data-use"));
const ContentEffortGuide = lazy(() => import("@/pages/content-effort-guide"));
const SeoGeoGuide = lazy(() => import("@/pages/seo-geo-guide"));

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <PageLoading label="Checking your account" />;
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

function PageLoading({ label = "Loading" }: { label?: string }) {
  return <div className="min-h-[45vh] flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />{label}...</div>;
}

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard"><Redirect to="/" /></Route>
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
        <Route path="/projects">
          <RequireAuth><Projects /></RequireAuth>
        </Route>
        <Route path="/admin">
          <RequireAuth><Admin /></RequireAuth>
        </Route>
        <Route path="/pricing" component={Pricing} />
        <Route path="/upgrade" component={Upgrade} />
        <Route path="/methodology" component={Methodology} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/google-data-use" component={GoogleDataUsePage} />
        {/* SEO comparison pages — public, indexable, drive AEO-category
            search traffic. /vs/:slug is parameterized; the page reads
            from src/data/competitors.ts. */}
        <Route path="/vs/:slug" component={VsComparison} />
        {/* BestAeoToolsPage takes an optional `variant` prop (aeo|geo) so we
            use wouter's render-children form instead of the `component` slot,
            which would otherwise inject RouteComponentProps and conflict. */}
        <Route path="/best-aeo-tools">{() => <BestAeoToolsPage />}</Route>
        <Route path="/best-geo-optimization-tools" component={BestGeoToolsPage} />
        <Route path="/how-to-rank-in-chatgpt" component={HowToRankInChatGPT} />
        <Route path="/what-is-answer-engine-optimization" component={WhatIsAEO} />
        <Route path="/how-to-appear-in-ai-search" component={HowToAppearInAISearch} />
        <Route path="/free-aeo-audit-tool">{() => <ProductLanding variant="audit" />}</Route>
        <Route path="/ai-visibility-checker">{() => <ProductLanding variant="visibility" />}</Route>
        <Route path="/chatgpt-citation-tracker">{() => <ProductLanding variant="citations" />}</Route>
        <Route path="/ai-citation-readiness-benchmark" component={Benchmark} />
        <Route path="/changelog" component={Changelog} />
        <Route path="/content-effort-for-seo-and-ai-search" component={ContentEffortGuide} />
        <Route path="/show-first-party-experience-seo" component={ContentEffortGuide} />
        <Route path="/seo-content-quality-vs-filler" component={ContentEffortGuide} />
        <Route path="/create-content-ai-can-cite" component={ContentEffortGuide} />
        <Route path="/content-audit-original-research-checklist" component={ContentEffortGuide} />
        <Route path="/document-expertise-methodology" component={ContentEffortGuide} />
        <Route path="/seo-and-geo" component={SeoGeoGuide} />
        <Route path="/seo-geo-tool" component={SeoGeoGuide} />
        <Route path="/geo-audit-tool" component={SeoGeoGuide} />
        <Route path="/ai-seo-tool" component={SeoGeoGuide} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <WouterRouter base={basePath}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <RouteTracker />
              <ErrorBoundary><Suspense fallback={<PageLoading />}><AppRoutes /></Suspense></ErrorBoundary>
              <CookieConsent />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </WouterRouter>
    </HelmetProvider>
  );
}

export default App;
