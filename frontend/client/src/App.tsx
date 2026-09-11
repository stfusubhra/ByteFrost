/* KisanSetu public routing: landing plus supporting public pages; existing dashboard application remains outside this public route layer.
 *
 * Uses React.lazy + Suspense for code splitting:
 *   - Home is loaded eagerly (critical for SEO / LCP)
 *   - All other routes are lazy-loaded to reduce initial bundle
 */
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import PageLoader from "./components/PageLoader";
import Home from "./pages/Home";

// Lazy-load heavier pages
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const SolutionStory = lazy(() => import("./pages/SolutionStory"));
const Faq = lazy(() => import("./pages/Faq"));
const Contact = lazy(() => import("./pages/Contact"));
const BuyerDashboard = lazy(() => import("./pages/BuyerDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const CreateListing = lazy(() => import("./pages/CreateListing"));

/**
 * Wraps lazy routes with a consistent loading state.
 * The home page is rendered directly (no suspense wrapper needed).
 */
function LazyRoute({ path, component: Component, fallback }: { path: string; component: React.LazyExoticComponent<() => JSX.Element>; fallback?: React.ReactNode }) {
  return (
    <Route path={path}>
      <Suspense fallback={fallback ?? <PageLoader label="Loading…" />}>
        <Component />
      </Suspense>
    </Route>
  );
}

function FullRouter() {
  return (
    <Switch>
      {/* Home is eager — critical for LCP */}
      <Route path="/" component={Home} />

      {/* All other routes are lazy with Suspense fallback */}
      <LazyRoute path="/login" component={Login} />
      <LazyRoute path="/signup" component={Signup} />
      <LazyRoute path="/marketplace" component={Marketplace} />
      <LazyRoute path="/listing/:id" component={ListingDetail} />
      <LazyRoute path="/solution-story" component={SolutionStory} />
      <LazyRoute path="/solutions" component={SolutionStory} />
      <LazyRoute path="/story" component={SolutionStory} />
      <LazyRoute path="/about" component={SolutionStory} />
      <LazyRoute path="/faq" component={Faq} />
      <LazyRoute path="/contact" component={Contact} />
      <LazyRoute path="/dashboard" component={Dashboard} />
      <LazyRoute path="/create-listing" component={CreateListing} />
      <LazyRoute path="/buyer-dashboard" component={BuyerDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" switchable>
          <TooltipProvider>
            <Toaster />
            <FullRouter />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

/**
 * Wraps lazy routes with a consistent loading state.
 * The home page is rendered directly (no suspense wrapper needed).
 */
function LazyRoute({ path, component: Component, fallback }: { path: string; component: React.LazyExoticComponent<() => JSX.Element>; fallback?: React.ReactNode }) {
  return (
    <Route path={path}>
      <Suspense fallback={fallback ?? <PageLoader label="Loading…" />}>
        <Component />
      </Suspense>
    </Route>
  );
}

function FullRouter() {
  return (
    <Switch>
      {/* Home is eager — critical for LCP */}
      <Route path="/" component={Home} />

      {/* All other routes are lazy with Suspense fallback */}
      <LazyRoute path="/login" component={Login} />
      <LazyRoute path="/signup" component={Signup} />
      <LazyRoute path="/marketplace" component={Marketplace} />
      <LazyRoute path="/listing/:id" component={ListingDetail} />
      <LazyRoute path="/solution-story" component={SolutionStory} />
      <LazyRoute path="/solutions" component={SolutionStory} />
      <LazyRoute path="/story" component={SolutionStory} />
      <LazyRoute path="/about" component={SolutionStory} />
      <LazyRoute path="/faq" component={Faq} />
      <LazyRoute path="/contact" component={Contact} />
      <LazyRoute path="/dashboard" component={Dashboard} />
      <LazyRoute path="/buyer-dashboard" component={BuyerDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" switchable>
          <TooltipProvider>
            <Toaster />
            <FullRouter />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
