import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FactionProvider } from "@/context/FactionContext";
import { Nav } from "@/components/Nav";
import FactionPicker from "@/pages/FactionPicker";
import GreatHall from "@/pages/GreatHall";
import Forge from "@/pages/Forge";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient();

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <div>
      <Nav base={base} />
      <Switch>
        <Route path="/" component={FactionPicker} />
        <Route path="/great-hall" component={GreatHall} />
        <Route path="/forge" component={Forge} />
        <Route path="/admin" component={Admin} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center opacity-50">
              <p className="text-2xl mb-2">⚔️</p>
              <p className="font-bold">Page not found</p>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FactionProvider>
        <WouterRouter base={base}>
          <Router />
        </WouterRouter>
      </FactionProvider>
    </QueryClientProvider>
  );
}

export default App;
