import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { PlayerProvider } from "@/context/player-context";
import { SelectedTransformationProvider } from "@/hooks/use-selected-transformation";
import { GordChat } from "@/components/GordChat";
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
import ZoneEpisodesPage from "@/pages/zone-episodes";
import TracksPage from "@/pages/tracks";
import TrackDetailPage from "@/pages/track-detail";
import StartPage from "@/pages/start";
import TransformPage from "@/pages/transform";
import TransformDetailPage from "@/pages/transform-detail";
import { AdminCategories } from "@/pages/admin-categories";
import { AdminCouncil } from "@/pages/admin-council";
import { UlgPage } from "@/pages/ulg";
import { AdminWishingWell } from "@/pages/admin-wishing-well";
import { AdminSeriesHealth } from "@/pages/admin-series-health";
import { CouncilPage } from "@/pages/council";
import { CouncilMemberPage } from "@/pages/council-member";
import { CouncilJoinPage } from "@/pages/council-join";
import { CouncilListingSuccessPage } from "@/pages/council-listing-success";
import { AdminExpertListings } from "@/pages/admin-expert-listings";
import { AdminContentGaps } from "@/pages/admin-content-gaps";
import { AdminGear } from "@/pages/admin-gear";
import { AdminNuggets } from "@/pages/admin-nuggets";
import { AdminGroundEvents } from "@/pages/admin-ground-events";
import WorkshopManagePage from "@/pages/workshop-manage";
import WorkshopsBrowsePage from "@/pages/workshops-browse";
import WorkshopsHostPage from "@/pages/workshops-host";
import WorkshopsDashboardPage from "@/pages/workshops-dashboard";
import WorkshopsResendLinkPage from "@/pages/workshops-resend-link";
import HistoryPage from "@/pages/history";
import { AdminWisdom } from "@/pages/admin-wisdom";
import { AdminFieldNotes } from "@/pages/admin-field-notes";
import StompingGroundsPage from "@/pages/stomping-grounds";
import MapPage from "@/pages/map";
import NotFound from "@/pages/not-found";
import BrigadePage from "@/pages/brigade";
import AdminBrigade from "@/pages/admin-brigade";
import { CohortsPage } from "@/pages/cohorts";
import { CohortDetailPage } from "@/pages/cohort-detail";
import { AdminCohorts } from "@/pages/admin-cohorts";
import { CohortFoundingWaitlistPage } from "@/pages/cohort-founding-waitlist";
import HeadwatersPage from "@/pages/headwaters";
import KitsPage from "@/pages/kits";
import KitDetailPage from "@/pages/kit-detail";
import KitFinderPage from "@/pages/kit-finder";
import KitWelcomePage from "@/pages/kit-welcome";
import { AdminKitPurchases } from "@/pages/admin-kit-purchases";
import { AdminGordTips } from "@/pages/admin-gord-tips";
import { AdminShares } from "@/pages/admin-shares";
import PractitionersPage from "@/pages/practitioners";
import { SuggestCreatorPage } from "@/pages/suggest-creator";
import ResourcesPage from "@/pages/resources";

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
        <Route path="/zones/:slug/episodes" component={ZoneEpisodesPage} />
        <Route path="/zones/:slug" component={ZoneDetailPage} />
        <Route path="/tracks" component={TracksPage} />
        <Route path="/tracks/:slug" component={TrackDetailPage} />
        <Route path="/start" component={StartPage} />
        <Route path="/transform" component={TransformPage} />
        <Route path="/transform/:slug" component={TransformDetailPage} />
        <Route path="/ulg" component={UlgPage} />
        <Route path="/categories" component={Categories} />
        <Route path="/about" component={About} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/council" component={AdminCouncil} />
        <Route path="/council/join" component={CouncilJoinPage} />
        <Route path="/council/listing-success" component={CouncilListingSuccessPage} />
        <Route path="/council" component={CouncilPage} />
        <Route path="/council/:slug" component={CouncilMemberPage} />
        <Route path="/admin/wishing-well" component={AdminWishingWell} />
        <Route path="/admin/series-health" component={AdminSeriesHealth} />
        <Route path="/admin/content-gaps" component={AdminContentGaps} />
        <Route path="/admin/gear" component={AdminGear} />
        <Route path="/admin/nuggets" component={AdminNuggets} />
        <Route path="/admin/wisdom" component={AdminWisdom} />
        <Route path="/admin/field-notes" component={AdminFieldNotes} />
        <Route path="/admin/ground-events" component={AdminGroundEvents} />
        <Route path="/admin/expert-listings" component={AdminExpertListings} />
        <Route path="/workshops/host" component={WorkshopsHostPage} />
        <Route path="/workshops/resend-link" component={WorkshopsResendLinkPage} />
        <Route path="/workshops/dashboard" component={WorkshopsDashboardPage} />
        <Route path="/workshops/manage" component={WorkshopManagePage} />
        <Route path="/workshops" component={WorkshopsBrowsePage} />
        <Route path="/wishing-well">
          {() => <Redirect to="/stomping-grounds?tab=well" />}
        </Route>
        <Route path="/wisdom-dig">
          {() => <Redirect to="/stomping-grounds?tab=wisdom" />}
        </Route>
        <Route path="/stomping-grounds" component={StompingGroundsPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/map" component={MapPage} />
        <Route path="/brigade" component={BrigadePage} />
        <Route path="/admin/brigade" component={AdminBrigade} />
        <Route path="/cohorts/founding" component={CohortFoundingWaitlistPage} />
        <Route path="/cohorts" component={CohortsPage} />
        <Route path="/cohorts/:id" component={CohortDetailPage} />
        <Route path="/admin/cohorts" component={AdminCohorts} />
        <Route path="/admin/kit-purchases" component={AdminKitPurchases} />
        <Route path="/admin/gord-tips" component={AdminGordTips} />
        <Route path="/admin/shares" component={AdminShares} />
        <Route path="/headwaters" component={HeadwatersPage} />
        <Route path="/kits" component={KitsPage} />
        <Route path="/kits/find" component={KitFinderPage} />
        <Route path="/kits/:slug/welcome" component={KitWelcomePage} />
        <Route path="/kits/:slug" component={KitDetailPage} />
        <Route path="/practitioners" component={PractitionersPage} />
        <Route path="/suggest-creator" component={SuggestCreatorPage} />
        <Route path="/resources" component={ResourcesPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SelectedTransformationProvider>
          <PlayerProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
              <GordChat />
            </WouterRouter>
            <Toaster />
          </PlayerProvider>
        </SelectedTransformationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
