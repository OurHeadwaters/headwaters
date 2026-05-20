import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Activity } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface SeriesConsistencyStatus {
  slug: string;
  title: string;
  status: "ok" | "warning";
  rssDetectCount: number;
  sqlCount: number;
  missedBySql: string[];
  missedByDetect: string[];
}

interface ConsistencyReport {
  checkedAt: string;
  allOk: boolean;
  series: SeriesConsistencyStatus[];
}

async function fetchConsistencyReport(forceRefresh = false): Promise<ConsistencyReport> {
  const url = forceRefresh ? apiUrl("/series/consistency?refresh=1") : apiUrl("/series/consistency");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load consistency report");
  return res.json();
}

function SlugList({ slugs, label }: { slugs: string[]; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = slugs.slice(0, 3);
  const rest = slugs.slice(3);

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">{label} ({slugs.length})</p>
      <ul className="space-y-0.5">
        {preview.map((s) => (
          <li key={s} className="text-xs font-mono text-foreground/80 bg-amber-50 px-2 py-0.5 rounded">
            {s}
          </li>
        ))}
        {rest.length > 0 && !expanded && (
          <li>
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              + {rest.length} more
            </button>
          </li>
        )}
        {expanded && rest.map((s) => (
          <li key={s} className="text-xs font-mono text-foreground/80 bg-amber-50 px-2 py-0.5 rounded">
            {s}
          </li>
        ))}
        {expanded && (
          <li>
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Show less
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

function SeriesRow({ entry }: { entry: SeriesConsistencyStatus }) {
  const [open, setOpen] = useState(false);
  const hasIssues = entry.missedBySql.length > 0 || entry.missedByDetect.length > 0;

  return (
    <div
      className={`rounded-lg border bg-card transition-colors ${
        entry.status === "warning"
          ? "border-amber-300 bg-amber-50/30"
          : "border-border"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {entry.status === "ok" ? (
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-semibold text-sm text-foreground">{entry.title}</span>
            <span className="ml-2 text-xs text-muted-foreground font-mono">{entry.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">
              RSS: <span className="font-semibold text-foreground">{entry.rssDetectCount}</span>
              {" · "}SQL: <span className="font-semibold text-foreground">{entry.sqlCount}</span>
            </p>
            {hasIssues && (
              <p className="text-xs text-amber-600 font-semibold">
                {entry.missedBySql.length + entry.missedByDetect.length} mismatch{entry.missedBySql.length + entry.missedByDetect.length !== 1 ? "es" : ""}
              </p>
            )}
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border/50 mt-1 pt-3">
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">RSS detect()</p>
              <p className="font-semibold text-foreground">{entry.rssDetectCount} episodes</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">SQL librarySql()</p>
              <p className="font-semibold text-foreground">{entry.sqlCount} episodes</p>
            </div>
          </div>

          {entry.status === "ok" && (
            <p className="text-sm text-green-700 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              No mismatches detected — detect() and librarySql() agree.
            </p>
          )}

          {entry.missedBySql.length > 0 && (
            <SlugList
              slugs={entry.missedBySql}
              label="In RSS detect() but missing from SQL"
            />
          )}
          {entry.missedByDetect.length > 0 && (
            <SlugList
              slugs={entry.missedByDetect}
              label="In SQL librarySql() but missing from RSS detect()"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function AdminSeriesHealth() {
  const [forceRefresh, setForceRefresh] = useState(false);

  const {
    data: report,
    isLoading,
    isError,
    dataUpdatedAt,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["series-consistency", forceRefresh],
    queryFn: () => fetchConsistencyReport(forceRefresh),
    staleTime: 4 * 60 * 1000,
  });

  const warnings = report?.series.filter((s) => s.status === "warning") ?? [];

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <Activity className="w-4 h-4" />
          <span>Admin</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Series Health Check</h1>
        <p className="text-muted-foreground">
          Compares each series' RSS <code className="text-xs bg-muted px-1 py-0.5 rounded">detect()</code> function
          against its database <code className="text-xs bg-muted px-1 py-0.5 rounded">librarySql()</code> predicate.
          Mismatches mean the two methods disagree on which episodes belong to a series.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={() => {
            setForceRefresh(true);
            setTimeout(() => refetch(), 0);
          }}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Checking…" : "Refresh Now"}
        </button>
        {report && (
          <p className="text-xs text-muted-foreground">
            Cached as of {new Date(report.checkedAt).toLocaleString()}
            {" · "}results cached for 5 min
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-12 text-center border border-destructive/30 rounded-xl bg-destructive/5">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-destructive font-semibold">Could not load consistency report.</p>
          <p className="text-sm text-muted-foreground mt-1">Check that the API server is running.</p>
        </div>
      ) : report ? (
        <>
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              report.allOk
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-300 bg-amber-50 text-amber-800"
            }`}
          >
            {report.allOk ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div>
              {report.allOk ? (
                <p className="font-semibold">All {report.series.length} series look healthy — no mismatches found.</p>
              ) : (
                <p className="font-semibold">
                  {warnings.length} of {report.series.length} series{" "}
                  {warnings.length === 1 ? "has" : "have"} count mismatches — review below.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {report.series.map((entry) => (
              <SeriesRow key={entry.slug} entry={entry} />
            ))}
          </div>
        </>
      ) : null}

      {dataUpdatedAt > 0 && (
        <p className="mt-6 text-xs text-muted-foreground text-center">
          Page last fetched at {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
