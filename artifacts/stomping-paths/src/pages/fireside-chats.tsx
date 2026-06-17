import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame, ArrowRight, ChevronDown } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem("fc_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("fc_session_id", id);
  }
  return id;
}

interface FiresideFlame {
  id: number;
  title: string;
  body: string;
  authorName: string | null;
  episodeId: number | null;
  fanCount: number;
  createdAt: string;
  episodeTitle: string | null;
  episodeSlug: string | null;
}

interface FlamesResponse {
  flames: FiresideFlame[];
  total: number;
  limit: number;
  offset: number;
}

interface Episode {
  id: number;
  title: string;
  slug: string;
  publishedAt: string | null;
}

async function fetchFlames(sort: "hot" | "new", limit = 30, offset = 0): Promise<FlamesResponse> {
  const res = await fetch(apiUrl(`/fireside-flames?sort=${sort}&limit=${limit}&offset=${offset}`));
  if (!res.ok) throw new Error("Failed to load flames");
  return res.json();
}

async function fetchEpisodes(): Promise<Episode[]> {
  const res = await fetch(apiUrl("/fireside-flames/episodes"));
  if (!res.ok) return [];
  const data: { episodes: Episode[] } = await res.json();
  return data.episodes;
}

async function postFlame(data: {
  title: string;
  body: string;
  authorName: string;
  episodeId: number | null;
}): Promise<FiresideFlame> {
  const res = await fetch(apiUrl("/fireside-flames"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to post flame");
  return j as FiresideFlame;
}

async function fanFlame(flameId: number): Promise<{ flameId: number; fanCount: number; alreadyFanned: boolean }> {
  const sessionId = getOrCreateSessionId();
  const res = await fetch(apiUrl(`/fireside-flames/${flameId}/fan`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { error?: string; alreadyFanned?: boolean };
    if (j.alreadyFanned) return { flameId, fanCount: 0, alreadyFanned: true };
    throw new Error(j.error ?? "Failed to fan flame");
  }
  return res.json();
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return ts;
  }
}

function EmberParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {[
        { left: "22%", dur: "4.2s", del: "0s",   size: 3,   top: "60%" },
        { left: "38%", dur: "5.8s", del: "1.3s",  size: 2,   top: "65%" },
        { left: "55%", dur: "3.9s", del: "0.7s",  size: 4,   top: "58%" },
        { left: "68%", dur: "6.1s", del: "2.1s",  size: 2.5, top: "70%" },
        { left: "15%", dur: "4.7s", del: "3.2s",  size: 2,   top: "72%" },
        { left: "80%", dur: "5.3s", del: "0.4s",  size: 3,   top: "62%" },
        { left: "45%", dur: "4.0s", del: "1.8s",  size: 1.5, top: "68%" },
        { left: "30%", dur: "6.5s", del: "2.9s",  size: 2,   top: "75%" },
      ].map((e, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: e.left,
            top: e.top,
            width: e.size,
            height: e.size,
            borderRadius: "50%",
            background: i % 3 === 0 ? "#FF8C42" : i % 3 === 1 ? "#E85A2A" : "#FFD580",
            boxShadow: `0 0 ${e.size * 2}px ${i % 2 === 0 ? "#FF6020" : "#FFB060"}`,
            animation: `ember-rise ${e.dur} ease-out ${e.del} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function CampfireHeaderSVG() {
  return (
    <svg viewBox="0 0 320 140" className="w-full max-w-xs mx-auto" aria-hidden="true">
      {/* Ground / dirt circle */}
      <ellipse cx="160" cy="125" rx="70" ry="14" fill="#3A1E08" opacity="0.6" />
      {/* Logs cross */}
      <rect x="100" y="108" width="120" height="14" rx="7" fill="#5A3010" transform="rotate(-18 160 115)" />
      <rect x="100" y="108" width="120" height="14" rx="7" fill="#6A3818" transform="rotate(18 160 115)" />
      {/* Log ends */}
      <ellipse cx="108" cy="121" rx="7" ry="5" fill="#4A2808" transform="rotate(-18 108 121)" />
      <ellipse cx="212" cy="121" rx="7" ry="5" fill="#4A2808" transform="rotate(-18 212 121)" />
      <ellipse cx="108" cy="109" rx="7" ry="5" fill="#4A2808" transform="rotate(18 108 109)" />
      <ellipse cx="212" cy="109" rx="7" ry="5" fill="#4A2808" transform="rotate(18 212 109)" />
      {/* Ember glow base */}
      <ellipse cx="160" cy="112" rx="38" ry="10" fill="#E85A2A" opacity="0.35" />
      <ellipse cx="160" cy="112" rx="22" ry="7" fill="#FF8C42" opacity="0.45" />
      {/* Coals */}
      <ellipse cx="148" cy="114" rx="8" ry="4" fill="#C04010" opacity="0.8" />
      <ellipse cx="168" cy="116" rx="6" ry="3" fill="#D05020" opacity="0.75" />
      <ellipse cx="158" cy="112" rx="10" ry="3.5" fill="#FF6030" opacity="0.6" />
      {/* Main flame body */}
      <path
        d="M140 112 Q135 90 148 72 Q155 60 160 48 Q163 62 158 74 Q168 58 172 44 Q180 62 175 78 Q185 65 182 84 Q186 96 180 112 Z"
        fill="#E85A2A"
        opacity="0.9"
        style={{ animation: "fc-flame-sway 2.4s ease-in-out infinite" }}
      />
      {/* Inner flame */}
      <path
        d="M148 110 Q145 96 152 82 Q157 70 160 58 Q162 70 159 80 Q165 70 168 60 Q174 75 172 88 Q175 98 172 110 Z"
        fill="#FF8C42"
        opacity="0.85"
        style={{ animation: "fc-flame-sway 2.4s ease-in-out 0.3s infinite" }}
      />
      {/* Core / brightest flame */}
      <path
        d="M154 110 Q152 100 156 90 Q159 80 160 70 Q161 80 160 88 Q163 80 165 72 Q168 84 167 94 Q166 104 164 110 Z"
        fill="#FFD580"
        opacity="0.9"
        style={{ animation: "fc-flame-sway 2.4s ease-in-out 0.6s infinite" }}
      />
      {/* Glow halo */}
      <ellipse cx="160" cy="95" rx="40" ry="30" fill="#FF6020" opacity="0.08"
        style={{ animation: "fc-glow-pulse 2.4s ease-in-out infinite" }}
      />
    </svg>
  );
}

function FlameCard({
  flame,
  fanned,
  onFan,
}: {
  flame: FiresideFlame;
  fanned: boolean;
  onFan: (id: number) => void;
}) {
  const [fanBounce, setFanBounce] = useState(false);

  function handleFan() {
    if (fanned) return;
    onFan(flame.id);
    setFanBounce(true);
    setTimeout(() => setFanBounce(false), 500);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "linear-gradient(150deg, #2A1A08 0%, #1E1206 100%)",
        border: "1.5px solid rgba(232,90,42,0.22)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2 flex-wrap"
        style={{
          background: "linear-gradient(90deg, rgba(232,90,42,0.18) 0%, rgba(255,140,66,0.08) 100%)",
          borderBottom: "1px solid rgba(232,90,42,0.18)",
        }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#FF8C42" }}>
          🔥 Flame
        </span>
        <span className="text-[11px]" style={{ color: "rgba(255,200,130,0.4)" }}>·</span>
        <span className="text-[11px]" style={{ color: "rgba(255,200,130,0.5)" }}>
          {formatTimestamp(flame.createdAt)}
        </span>
        {flame.authorName && (
          <>
            <span className="text-[11px]" style={{ color: "rgba(255,200,130,0.4)" }}>·</span>
            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,200,130,0.7)" }}>
              {flame.authorName}
            </span>
          </>
        )}
        {flame.episodeTitle && (
          <span
            className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(232,90,42,0.2)",
              color: "#FF8C42",
              border: "1px solid rgba(232,90,42,0.3)",
            }}
          >
            📻 {flame.episodeTitle.length > 32 ? flame.episodeTitle.slice(0, 32) + "…" : flame.episodeTitle}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3
          className="font-bold text-base leading-snug"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#FFD580" }}
        >
          {flame.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,220,160,0.7)" }}>
          {flame.body}
        </p>
      </div>

      <div
        className="px-4 py-3 flex items-center justify-end"
        style={{ borderTop: "1px solid rgba(232,90,42,0.12)" }}
      >
        <button
          onClick={handleFan}
          disabled={fanned}
          aria-label={fanned ? "Already fanned" : "Fan this flame"}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
          style={{
            background: fanned ? "rgba(232,90,42,0.3)" : "transparent",
            color: fanned ? "#FF8C42" : "rgba(255,140,66,0.6)",
            borderColor: fanned ? "rgba(232,90,42,0.5)" : "rgba(232,90,42,0.3)",
            cursor: fanned ? "default" : "pointer",
            transform: fanBounce ? "scale(1.2)" : "scale(1)",
            transition: "transform 0.15s ease, background 0.2s, color 0.2s",
          }}
        >
          🔥
          {flame.fanCount > 0 && <span>{flame.fanCount}</span>}
          {fanned ? "Fanned" : "Fan"}
        </button>
      </div>
    </div>
  );
}

function PostFlameForm({
  episodes,
  onSuccess,
}: {
  episodes: Episode[];
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [episodeId, setEpisodeId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: postFlame,
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      onSuccess();
    }, 2500);
    return () => clearTimeout(timer);
  }, [submitted, onSuccess]);

  const canSubmit =
    title.trim().length >= 3 && body.trim().length >= 10 && !mutation.isPending;

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(232,90,42,0.25)",
    color: "#FFD580",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  if (submitted) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(150deg, #2A1A08 0%, #1E1206 100%)",
          border: "1.5px solid rgba(232,90,42,0.3)",
        }}
      >
        <div className="text-4xl mb-3">🔥</div>
        <p
          className="font-bold text-lg mb-1"
          style={{ fontFamily: "Georgia, serif", color: "#FFD580" }}
        >
          Your flame is lit!
        </p>
        <p className="text-sm mb-5" style={{ color: "rgba(255,220,160,0.6)" }}>
          Your spark has been added to the fire circle.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setTitle("");
            setBody("");
            setAuthorName("");
            setEpisodeId(null);
          }}
          className="text-xs underline"
          style={{ color: "rgba(255,140,66,0.6)" }}
        >
          Spark another
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #2A1A08 0%, #1E1206 100%)",
        border: "1.5px solid rgba(232,90,42,0.25)",
      }}
    >
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{
          background: "linear-gradient(90deg, rgba(232,90,42,0.2) 0%, rgba(255,140,66,0.08) 100%)",
          borderBottom: "1px solid rgba(232,90,42,0.2)",
        }}
      >
        <Flame className="w-4 h-4 shrink-0" style={{ color: "#FF8C42" }} />
        <h3 className="font-bold" style={{ fontFamily: "Georgia, serif", color: "#FFD580" }}>
          Spark a New Flame
        </h3>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {mutation.isError && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              background: "rgba(166,40,20,0.2)",
              color: "#FF7060",
              border: "1px solid rgba(166,40,20,0.35)",
            }}
          >
            {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
          </div>
        )}

        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: "#FF8C42" }}
          >
            Spark Title <span style={{ color: "#FF6040" }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Should every homesteader have a backup comms plan?"
            maxLength={100}
            style={inputStyle}
          />
          <div className="text-right text-[11px] mt-0.5" style={{ color: "rgba(255,140,66,0.4)" }}>
            {title.length}/100
          </div>
        </div>

        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: "#FF8C42" }}
          >
            Your Thoughts <span style={{ color: "#FF6040" }}>*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your idea, question, or spark from the show…"
            maxLength={500}
            rows={4}
            style={{ ...inputStyle, resize: "none" }}
          />
          <div className="text-right text-[11px] mt-0.5" style={{ color: "rgba(255,140,66,0.4)" }}>
            {body.length}/500
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "#FF8C42" }}
            >
              Your Name (optional)
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Jake from Oregon"
              maxLength={80}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "#FF8C42" }}
            >
              Sparked by episode
            </label>
            <select
              value={episodeId ?? ""}
              onChange={(e) =>
                setEpisodeId(e.target.value ? Number(e.target.value) : null)
              }
              style={{
                ...inputStyle,
                backgroundImage: "none",
                appearance: "none",
              }}
            >
              <option value="">None</option>
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.title.length > 50 ? ep.title.slice(0, 50) + "…" : ep.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() =>
            canSubmit &&
            mutation.mutate({
              title: title.trim(),
              body: body.trim(),
              authorName: authorName.trim(),
              episodeId,
            })
          }
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #C04010 0%, #8A2800 100%)",
            color: "#FFD580",
            border: "1.5px solid rgba(232,90,42,0.5)",
            boxShadow: "0 3px 14px rgba(232,90,42,0.25)",
          }}
        >
          🔥 {mutation.isPending ? "Lighting…" : "Light the Flame"}
        </button>
      </div>
    </div>
  );
}

function FlamesLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-2xl animate-pulse"
          style={{ background: "rgba(232,90,42,0.08)", border: "1.5px solid rgba(232,90,42,0.1)" }}
        />
      ))}
    </div>
  );
}

function EmptyFlames({ onPost }: { onPost: () => void }) {
  return (
    <div
      className="rounded-2xl p-12 text-center"
      style={{
        background: "linear-gradient(150deg, #2A1A08 0%, #1E1206 100%)",
        border: "1.5px dashed rgba(232,90,42,0.3)",
      }}
    >
      <div className="text-5xl mb-4">🔥</div>
      <h3
        className="text-xl font-bold mb-2"
        style={{ fontFamily: "Georgia, serif", color: "#FFD580" }}
      >
        The fire circle is quiet
      </h3>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,220,160,0.6)" }}>
        No flames yet. Be the first to spark a conversation from the Fireside Freedom community.
      </p>
      <button
        onClick={onPost}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
        style={{
          background: "linear-gradient(135deg, #C04010 0%, #8A2800 100%)",
          color: "#FFD580",
          border: "1.5px solid rgba(232,90,42,0.5)",
        }}
      >
        <Flame className="w-4 h-4" />
        Spark the First Flame
      </button>
    </div>
  );
}

export function FiresideChats() {
  const qc = useQueryClient();
  const [fanned, setFanned] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showAllNew, setShowAllNew] = useState(false);

  const { data: hotData, isLoading: hotLoading } = useQuery({
    queryKey: ["fireside-flames-hot"],
    queryFn: () => fetchFlames("hot", 5),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: newData, isLoading: newLoading } = useQuery({
    queryKey: ["fireside-flames-new"],
    queryFn: () => fetchFlames("new", 20),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["fireside-episodes"],
    queryFn: fetchEpisodes,
    staleTime: 5 * 60 * 1000,
  });

  const fanMutation = useMutation({
    mutationFn: fanFlame,
    onSuccess: (result) => {
      setFanned((prev) => new Set(prev).add(result.flameId));
      qc.invalidateQueries({ queryKey: ["fireside-flames-hot"] });
      qc.invalidateQueries({ queryKey: ["fireside-flames-new"] });
      qc.invalidateQueries({ queryKey: ["fireside-flames-preview"] });
    },
  });

  const handleFan = useCallback(
    (id: number) => {
      if (!fanned.has(id)) fanMutation.mutate(id);
    },
    [fanned, fanMutation],
  );

  const handlePostSuccess = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["fireside-flames-hot"] });
    qc.invalidateQueries({ queryKey: ["fireside-flames-new"] });
    qc.invalidateQueries({ queryKey: ["fireside-flames-preview"] });
    setShowForm(false);
  }, [qc]);

  const hotFlames = hotData?.flames ?? [];
  const allNewFlames = newData?.flames ?? [];
  const newFlames = showAllNew ? allNewFlames : allNewFlames.slice(0, 6);
  const hasHot = hotFlames.length > 0;
  const hasNew = allNewFlames.length > 0;
  const totalFlames = newData?.total ?? 0;

  return (
    <>
      <style>{`
        @keyframes fc-flame-sway {
          0%, 100% { transform: skewX(-3deg) scaleX(0.97); }
          25% { transform: skewX(4deg) scaleX(1.02); }
          50% { transform: skewX(-2deg) scaleX(0.98); }
          75% { transform: skewX(3deg) scaleX(1.01); }
        }
        @keyframes fc-glow-pulse {
          0%, 100% { opacity: 0.06; transform: scaleX(0.95); }
          50% { opacity: 0.14; transform: scaleX(1.05); }
        }
        @keyframes ember-rise {
          0% { transform: translateY(0) scale(1); opacity: 0.9; }
          60% { opacity: 0.6; }
          100% { transform: translateY(-60px) translateX(10px) scale(0.4); opacity: 0; }
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(160deg, #1A0D04 0%, #220F06 50%, #1C0C04 100%)" }}
      >
        {/* Campfire scene header */}
        <div
          className="relative overflow-hidden border-b"
          style={{
            background: "linear-gradient(160deg, #2A1008 0%, #380E06 50%, #2A0C06 100%)",
            borderColor: "rgba(232,90,42,0.25)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% 100%, rgba(232,90,42,0.18) 0%, transparent 60%), " +
                "radial-gradient(ellipse at 20% 60%, rgba(255,140,66,0.08) 0%, transparent 50%)",
            }}
          />
          <EmberParticles />

          <div className="relative container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-40 h-40 shrink-0">
              <CampfireHeaderSVG />
            </div>
            <div className="text-center md:text-left">
              <div
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1.5 rounded-full"
                style={{
                  color: "#FF8C42",
                  background: "rgba(232,90,42,0.15)",
                  border: "1px solid rgba(232,90,42,0.3)",
                }}
              >
                🔥 Fireside Chats
              </div>
              <h1
                className="font-bold text-4xl md:text-5xl mb-3 leading-tight"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  background: "linear-gradient(135deg, #FFD580 0%, #FF8C42 60%, #E85A2A 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                }}
              >
                Fire Circle
              </h1>
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: "rgba(255,200,130,0.65)" }}>
                Community discussions sparked by ideas from the Fireside Freedom podcast. Light a
                flame, fan the fire, and watch the circle grow around themes that matter.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4 justify-center md:justify-start">
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #C04010 0%, #8A2800 100%)",
                    color: "#FFD580",
                    border: "1.5px solid rgba(232,90,42,0.5)",
                    boxShadow: "0 3px 14px rgba(232,90,42,0.3)",
                  }}
                >
                  <Flame className="w-4 h-4" />
                  {showForm ? "Cancel" : "Spark a Flame"}
                </button>
                {totalFlames > 0 && (
                  <span className="text-sm" style={{ color: "rgba(255,200,130,0.5)" }}>
                    {totalFlames} flame{totalFlames !== 1 ? "s" : ""} burning
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
          {/* Post form */}
          {showForm && (
            <div className="mb-10">
              <PostFlameForm episodes={episodes} onSuccess={handlePostSuccess} />
            </div>
          )}

          {/* Burning section (hottest flames) */}
          {(hotLoading || hasHot) && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div className="text-2xl">🔥</div>
                <h2
                  className="font-bold text-xl"
                  style={{ fontFamily: "Georgia, serif", color: "#FFD580" }}
                >
                  Burning
                </h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(232,90,42,0.2)",
                    color: "#FF8C42",
                    border: "1px solid rgba(232,90,42,0.3)",
                  }}
                >
                  Hottest flames
                </span>
              </div>

              {hotLoading ? (
                <FlamesLoadingSkeleton count={3} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotFlames.map((flame) => (
                    <FlameCard
                      key={flame.id}
                      flame={flame}
                      fanned={fanned.has(flame.id)}
                      onFan={handleFan}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* All flames (newest first) */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2
                className="font-bold text-xl"
                style={{ fontFamily: "Georgia, serif", color: "#FFD580" }}
              >
                All Flames
              </h2>
              <span className="text-xs" style={{ color: "rgba(255,200,130,0.4)" }}>
                newest first
              </span>
            </div>

            {newLoading ? (
              <FlamesLoadingSkeleton count={6} />
            ) : !hasNew ? (
              <EmptyFlames onPost={() => setShowForm(true)} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {newFlames.map((flame) => (
                    <FlameCard
                      key={flame.id}
                      flame={flame}
                      fanned={fanned.has(flame.id)}
                      onFan={handleFan}
                    />
                  ))}
                </div>

                {allNewFlames.length > 6 && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowAllNew((v) => !v)}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        border: "1.5px solid rgba(232,90,42,0.3)",
                        color: "#FF8C42",
                        background: "rgba(232,90,42,0.06)",
                      }}
                    >
                      <ChevronDown
                        className="w-4 h-4"
                        style={{ transform: showAllNew ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                      />
                      {showAllNew ? "Show less" : `Show all ${allNewFlames.length} flames`}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <div
            className="mt-12 p-5 rounded-xl text-center"
            style={{
              border: "1.5px dashed rgba(232,90,42,0.25)",
              background: "rgba(232,90,42,0.04)",
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,200,130,0.55)" }}>
              <span className="font-semibold" style={{ color: "rgba(255,200,130,0.8)" }}>
                The fire circle grows with every spark.
              </span>{" "}
              Share ideas, questions, or topics from Fireside Freedom episodes. Fan the flames you
              believe in — the hottest ideas rise to the top.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default FiresideChats;
