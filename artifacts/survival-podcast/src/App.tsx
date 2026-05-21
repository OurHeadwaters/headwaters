import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { PlayerProvider } from "@/context/player-context";
import { Home } from "@/pages/home";
import { Archive } from "@/pages/archive";
import { EpisodeDetail } from "@/pages/episode";
import { Categories } from "@/pages/categories";
import { About } from "@/pages/about";
import { Library } from "@/pages/library";
import { LibraryItemDetail } from "@/pages/library-item";
import { SeriesIndex } from "@/pages/series-index";
import { SeriesDetail } from "@/pages/series-detail";
import ZonesPage from "@/pages/zones";
import ZoneDetailPage from "@/pages/zone-detail";
import TracksPage from "@/pages/tracks";
import TrackDetailPage from "@/pages/track-detail";
import StartPage from "@/pages/start";
import TransformPage from "@/pages/transform";
import { AdminCategories } from "@/pages/admin-categories";
import { AdminCouncil } from "@/pages/admin-council";
import { UlgPage } from "@/pages/ulg";
import { AdminWishingWell } from "@/pages/admin-wishing-well";
import { AdminSeriesHealth } from "@/pages/admin-series-health";
import { CouncilPage } from "@/pages/council";
import { CouncilMemberPage } from "@/pages/council-member";
import { AdminContentGaps } from "@/pages/admin-content-gaps";
import { AdminGear } from "@/pages/admin-gear";
import { AdminNuggets } from "@/pages/admin-nuggets";
import HistoryPage from "@/pages/history";
import StompingGroundsPage from "@/pages/stomping-grounds";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/library" component={Library} />
        <Route path="/library/:slug" component={LibraryItemDetail} />
        <Route path="/episodes" component={Archive} />
        <Route path="/episodes/:slug" component={EpisodeDetail} />
        <Route path="/series" component={SeriesIndex} />
        <Route path="/series/unloose-the-goose" component={UlgPage} />
        <Route path="/series/:slug" component={SeriesDetail} />
        <Route path="/zones" component={ZonesPage} />
        <Route path="/zones/:slug" component={ZoneDetailPage} />
        <Route path="/tracks" component={TracksPage} />
        <Route path="/tracks/:slug" component={TrackDetailPage} />
        <Route path="/start" component={StartPage} />
        <Route path="/transform" component={TransformPage} />
        <Route path="/ulg" component={UlgPage} />
        <Route path="/categories" component={Categories} />
        <Route path="/about" component={About} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/council" component={AdminCouncil} />
        <Route path="/council" component={CouncilPage} />
        <Route path="/council/:slug" component={CouncilMemberPage} />
        <Route path="/admin/wishing-well" component={AdminWishingWell} />
        <Route path="/admin/series-health" component={AdminSeriesHealth} />
        <Route path="/admin/content-gaps" component={AdminContentGaps} />
        <Route path="/admin/gear" component={AdminGear} />
        <Route path="/admin/nuggets" component={AdminNuggets} />
        <Route path="/wishing-well">
          {() => <Redirect to="/stomping-grounds?tab=well" />}
        </Route>
        <Route path="/wisdom-dig">
          {() => <Redirect to="/stomping-grounds?tab=wisdom" />}
        </Route>
        <Route path="/stomping-grounds" component={StompingGroundsPage} />
        <Route path="/history" component={HistoryPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlayerProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </PlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
