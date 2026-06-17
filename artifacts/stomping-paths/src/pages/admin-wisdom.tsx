import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Globe, Twitter, CheckCircle, AlertCircle, Clock, Loader2, Lock } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface SourceStatus {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  xHandle?: string;
  lastScrapedAt: string | null;
  gemCount: number;
  status: string;
  errorMsg: string | null;
}

interface ScrapeStatusResponse {
  sources: SourceStatus[];
  inProgress: boolean;
}

interface ScrapeResult {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  gemsInserted: number;
  status: string;
  errorMsg?: string;
}

interface ScrapeResponse {
  results: ScrapeResult[];
  totalGems?: number;
}

async function fetchStatus(): Promise<ScrapeStatusResponse> {
  const res = await fetch(apiUrl("/admin/wisdom/scrape-status"));
  if (!res.ok) throw new Error("Failed to load scrape status");
  return res.json();
}

async function triggerScrape(body?: {
  memberId: string;
  sourceType: string;
}): Promise<ScrapeResponse> {
  const res = await fetch(apiUrl("/admin/wisdom/scrape"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Scrape failed");
  }
  return res.json();
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />
        OK
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      Never
    </span>
  );
}

function SourceTypeIcon({ type }: { type: string }) {
  if (type === "x") {
    return <Twitter className="w-3.5 h-3.5 text-sky-500" />;
  }
  return <Globe className="w-3.5 h-3.5 text-[#2C4A36]" />;
}

function ScrapeResultsPanel({ results }: { results: ScrapeResult[] }) {
  const newGems = results.reduce((s, r) => s + r.gemsInserted, 0);
  const errors = results.filter((r) => r.status === "error");

  return (
    <div className="rounded-xl border border-[#2C4A36]/20 bg-[#2C4A36]/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Scrape complete —{" "}
          <span className="text-[#2C4A36]">{newGems} new gems</span> from{" "}
          {results.length} source{results.length !== 1 ? "s" : ""}
        </p>
      </div>
      {errors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-red-600">{errors.length} source{errors.length !== 1 ? "s" : ""} failed:</p>
          {errors.map((r) => (
            <div key={r.sourceId} className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-1.5">
              <span className="font-medium">{r.sourceName} ({r.sourceType})</span>
              {r.errorMsg && <span className="opacity-75"> — {r.errorMsg}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Auth gate ─────────────── */
interface AuthUserResponse {
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null } | null;
}

async function fetchAuthUser(): Promise<AuthUserResponse> {
  const res = await fetch(apiUrl("/auth/user"));
  if (!res.ok) return { user: null };
  return res.json();
}

function AdminLoginWall({ returnTo }: { returnTo: string }) {
  const loginUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-md text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-muted">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h1 className="font-serif text-2xl font-bold text-foreground mb-3">Admin access required</h1>
      <p className="text-muted-foreground mb-8">
        Sign in to access this admin page.
      </p>
      <a
        href={loginUrl}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Sign in to continue
      </a>
    </div>
  );
}

export function AdminWisdom() {
  const { data: auth, isLoading: authLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchAuthUser,
    staleTime: 60_000,
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!auth?.user) {
    return <AdminLoginWall returnTo="/admin/wisdom" />;
  }

  return <AdminWisdomContent />;
}

function AdminWisdomContent() {
  const qc = useQueryClient();
  const [lastResults, setLastResults] = useState<ScrapeResult[] | null>(null);
  const [scrapingSource, setScrapingSource] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wisdom-scrape-status"],
    queryFn: fetchStatus,
    refetchInterval: 5000,
  });

  const scrapeAllMutation = useMutation({
    mutationFn: () => triggerScrape(),
    onSuccess: (res) => {
      setLastResults(res.results);
      qc.invalidateQueries({ queryKey: ["wisdom-scrape-status"] });
    },
  });

  const scrapeOneMutation = useMutation({
    mutationFn: ({ memberId, sourceType }: { memberId: string; sourceType: string }) =>
      triggerScrape({ memberId, sourceType }),
    onSuccess: (res) => {
      setLastResults(res.results);
      setScrapingSource(null);
      qc.invalidateQueries({ queryKey: ["wisdom-scrape-status"] });
    },
    onError: () => setScrapingSource(null),
  });

  const handleScrapeOne = (source: SourceStatus) => {
    const [memberId] = source.sourceId.split("::");
    const sourceType = source.sourceType;
    setScrapingSource(source.sourceId);
    scrapeOneMutation.mutate({ memberId, sourceType });
  };

  const sources = data?.sources ?? [];
  const councilSources = sources.filter((s) => s.sourceType === "website");
  const xSources = sources.filter((s) => s.sourceType === "x");

  const anyInProgress = scrapeAllMutation.isPending || scrapeOneMutation.isPending || (data?.inProgress ?? false);

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          Wisdom Scraper
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl">
          Manage content sources for the Wisdom Dig. Scrape Expert Council member websites
          and X accounts to surface gems beyond TSP episode show notes.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { setLastResults(null); scrapeAllMutation.mutate(); }}
          disabled={anyInProgress}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C4A36] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {scrapeAllMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {scrapeAllMutation.isPending ? "Scraping all sources…" : "Re-scrape All Sources"}
        </button>
        {anyInProgress && !scrapeAllMutation.isPending && (
          <p className="text-xs text-muted-foreground animate-pulse">Scrape in progress…</p>
        )}
      </div>

      {lastResults && <ScrapeResultsPanel results={lastResults} />}

      {isLoading ? (
        <div className="space-y-3 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-6 text-center py-10 text-muted-foreground text-sm">
          Failed to load scrape status. Try refreshing.
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2C4A36]" />
              Council Websites
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({councilSources.length} sources)
              </span>
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Last Scraped</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gems</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {councilSources.map((source) => (
                    <tr key={source.sourceId} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <SourceTypeIcon type={source.sourceType} />
                          <div>
                            <p className="font-medium text-foreground">{source.sourceName}</p>
                            <a
                              href={source.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-[#2C4A36] transition-colors"
                            >
                              {source.sourceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {formatDate(source.lastScrapedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{source.gemCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={source.status} />
                        {source.errorMsg && (
                          <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={source.errorMsg}>
                            {source.errorMsg}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleScrapeOne(source)}
                          disabled={anyInProgress}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#2C4A36]/30 text-[#2C4A36] hover:bg-[#2C4A36] hover:text-white transition-all disabled:opacity-40"
                        >
                          {scrapingSource === source.sourceId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Re-scrape"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Twitter className="w-4 h-4 text-sky-500" />
              X / Twitter Accounts
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({xSources.length} sources)
              </span>
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Last Scraped</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gems</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {xSources.map((source) => (
                    <tr key={source.sourceId} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <SourceTypeIcon type={source.sourceType} />
                          <div>
                            <p className="font-medium text-foreground">{source.sourceName}</p>
                            {source.xHandle && (
                              <a
                                href={source.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-sky-600 hover:text-sky-700 transition-colors"
                              >
                                @{source.xHandle}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {formatDate(source.lastScrapedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{source.gemCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={source.status} />
                        {source.errorMsg && (
                          <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={source.errorMsg}>
                            {source.errorMsg}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleScrapeOne(source)}
                          disabled={anyInProgress}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-sky-400/40 text-sky-600 hover:bg-sky-600 hover:text-white transition-all disabled:opacity-40"
                        >
                          {scrapingSource === source.sourceId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Re-scrape"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {sources.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No sources configured yet. Click "Re-scrape All Sources" to begin.
            </div>
          )}
        </div>
      )}

      <div className="mt-10 p-4 rounded-xl border border-dashed border-[#D9A066]/40 bg-[#D9A066]/5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">How it works:</span>{" "}
          Website scraping fetches each council member's homepage plus /blog and /articles pages,
          then runs the wisdom-extraction heuristic to surface principle-language sentences.
          X scraping pulls recent posts via public Nitter instances. Up to 10 gems per source
          per run are saved; duplicates are skipped automatically.
        </p>
      </div>
    </div>
  );
}
