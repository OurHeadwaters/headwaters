import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PassphraseGuard } from "@/components/passphrase";
import { Layout } from "@/components/layout";
import { IntakeProvider } from "@/context/intake";

// Pages
import Dashboard from "@/pages/dashboard";
import ClientsList from "@/pages/clients/index";
import NewClient from "@/pages/clients/new";
import ClientDetail from "@/pages/clients/detail";
import IntakeDump from "@/pages/intake/index";
import IntakeReview from "@/pages/intake/review";
import BusinessPriorities from "@/pages/business/priorities";
import BusinessFinancials from "@/pages/business/financials";
import BusinessNotes from "@/pages/business/notes";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <PassphraseGuard>
      <Layout>
        <IntakeProvider>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/clients" component={ClientsList} />
            <Route path="/clients/new" component={NewClient} />
            <Route path="/clients/:clientId" component={ClientDetail} />
            <Route path="/intake/:clientId" component={IntakeDump} />
            <Route path="/intake/:clientId/review" component={IntakeReview} />
            <Route path="/business/priorities" component={BusinessPriorities} />
            <Route path="/business/financials" component={BusinessFinancials} />
            <Route path="/business/notes" component={BusinessNotes} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </IntakeProvider>
      </Layout>
    </PassphraseGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
