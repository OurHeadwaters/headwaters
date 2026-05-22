import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, Mic, Radio, Tag, Clock, ChevronDown, ChevronUp, AlertCircle, Lock, Youtube, X, Plus, Flame, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { format } from "date-fns";

type FieldNote = {
  id: number;
  sourceType: "nostr" | "audio";
  externalId: string;
  rawContent: string;
  tags: string[];
  published: boolean;
  createdAt: string;
};

type SourceStatus = {
  total: number;
  lastIngestedAt: string | null;
};

type RelayHealth = {
  relay: string;
  status: "ok" | "error";
  ranAt: string | null;
  itemsFetched: number;
  itemsInserted: number;
  errorMessage: string | null;
};

type SyncStatus = {
  bySource: Record<string, SourceStatus>;
  relayHealth: RelayHealth[];
};

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const ZONE_SLUGS = [
  { slug: "zone-0", label: "Zone 0 — The Self" },
  { slug: "zone-1", label: "Zone 1 — The Home" },
  { slug: "zone-2", label: "Zone 2 — The Garden" },
  { slug: "zone-3", label: "Zone 3 — The Homestead" },
  { slug: "zone-4", label: "Zone 4 — The Forest" },
  { slug: "zone-5", label: "Zone 5 — The Wild" },
];

const TRANSFORMATION_SLUGS = [
  { slug: "conventional-to-regenerative", label: "Conventional → Regenerative" },
  { slug: "tradfi-to-hard-assets", label: "TradFi → Hard Assets" },
  { slug: "employee-to-owner", label: "Employee → Owner" },
  { slug: "grid-to-off-grid", label: "Grid → Off-Grid" },
  { slug: "outsourced-health-to-health-sovereign", label: "Outsourced Health → Health Sovereign" },
  { slug: "individual-to-community-scale", label: "Individual → Community Scale" },
];

const ALL_KNOWN_SLUGS = [...ZONE_SLUGS, ...TRANSFORMATION_SLUGS];

async function fetchNotes(): Promise<FieldNote[]> {
  const res = await fetch(`${base}/api/admin/field-notes?limit=100`);
  if (!res.ok) throw new Error("Failed to load field notes");
  return res.json();
}

async function fetchSyncStatus(): Promise<SyncStatus> {
  const res = await fetch(`${base}/api/admin/sync-status`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load sync status");
  return res.json();
}

async function uploadAudio(file: File): Promise<FieldNote> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base}/api/admin/field-notes/upload`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Upload failed");
  }
  return res.json();
}

async function patchNote(
  id: number,
  updates: { published?: boolean; tags?: string[] },
): Promise<FieldNote> {
  const res = await fetch(`${base}/api/admin/field-notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Update failed");
  }
  return res.json();
}

function NoteCard({
  note,
  onUpdate,
}: {
  note: FieldNote;
  onUpdate: (updated: FieldNote) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLong = note.rawContent.length > 280;
  const preview =
    isLong && !expanded ? note.rawContent.slice(0, 280) + "…" : note.rawContent;

  async function handleTogglePublished() {
    setSaving(true);
    try {
      const updated = await patchNote(note.id, { published: !note.published });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveTag(tag: string) {
    const newTags = note.tags.filter((t) => t !== tag);
    setSaving(true);
    try {
      const updated = await patchNote(note.id, { tags: newTags });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTag(slug: string) {
    if (note.tags.includes(slug)) return;
    const newTags = [...note.tags, slug];
    setSaving(true);
    try {
      const updated = await patchNote(note.id, { tags: newTags });
      onUpdate(updated);
    } finally {
      setSaving(false);
      setTagPickerOpen(false);
    }
  }

  const availableToAdd = ALL_KNOWN_SLUGS.filter(
    ({ slug }) => !note.tags.includes(slug),
  );

  return (
    <div
      className={`rounded-xl border bg-card p-5 flex flex-col gap-3 transition-opacity ${
        note.published
          ? "border-border"
          : "border-border opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {note.sourceType === "nostr" ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300/60 dark:border-purple-600/40">
              <Radio className="w-3 h-3" />
              Nostr
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-600/40">
              <Mic className="w-3 h-3" />
              Audio Memo
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(note.createdAt), "MMM d, yyyy")}
          </span>
        </div>

        {/* Published toggle */}
        <button
          onClick={handleTogglePublished}
          disabled={saving}
          title={note.published ? "Click to unpublish" : "Click to publish"}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            note.published
              ? "border-green-500 bg-green-500"
              : "border-border bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              note.published ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
          <span className="sr-only">
            {note.published ? "Published" : "Unpublished"}
          </span>
        </button>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {note.tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border group"
          >
            <Tag className="w-2.5 h-2.5" />
            {t}
            <button
              onClick={() => handleRemoveTag(t)}
              disabled={saving}
              className="ml-0.5 rounded-full hover:text-destructive transition-colors disabled:opacity-40"
              title={`Remove tag "${t}"`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {/* Add tag button */}
        <div className="relative">
          <button
            onClick={() => setTagPickerOpen((v) => !v)}
            disabled={saving || availableToAdd.length === 0}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-2.5 h-2.5" />
            Add tag
          </button>

          {tagPickerOpen && availableToAdd.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-xl border border-border bg-popover shadow-lg p-2 flex flex-col gap-0.5">
              {availableToAdd.map(({ slug, label }) => (
                <button
                  key={slug}
                  onClick={() => handleAddTag(slug)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {preview}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-start inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Show more
            </>
          )}
        </button>
      )}
    </div>
  );
}

function RelayHealthRow({ relay }: { relay: RelayHealth }) {
  const label = relay.relay.replace("wss://", "");
  const isOk = relay.status === "ok";

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="mt-0.5 shrink-0">
        {isOk ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-mono font-medium text-foreground">{label}</span>
        {relay.ranAt && (
          <span className="text-xs text-muted-foreground ml-2">
            Last run {format(new Date(relay.ranAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
        )}
        {isOk ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            {relay.itemsFetched.toLocaleString()} fetched · {relay.itemsInserted.toLocaleString()} new
          </p>
        ) : (
          relay.errorMessage && (
            <p className="text-xs text-destructive mt-0.5 truncate">{relay.errorMessage}</p>
          )
        )}
      </div>
    </div>
  );
}

export function AdminFieldNotes() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: notes, isLoading } = useQuery<FieldNote[]>({
    queryKey: ["admin-field-notes"],
    queryFn: fetchNotes,
    staleTime: 30_000,
    enabled: isAuthenticated,
  });

  const { data: syncStatus } = useQuery<SyncStatus>({
    queryKey: ["admin-sync-status"],
    queryFn: fetchSyncStatus,
    staleTime: 60_000,
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: uploadAudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-field-notes"] });
      setUploadError(null);
    },
    onError: (err: Error) => {
      setUploadError(err.message);
    },
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      setUploadError(null);
      mutation.mutate(file);
    },
    [mutation],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  function handleNoteUpdate(updated: FieldNote) {
    queryClient.setQueryData<FieldNote[]>(["admin-field-notes"], (prev) =>
      prev ? prev.map((n) => (n.id === updated.id ? updated : n)) : prev,
    );
  }

  const nostrCount = notes?.filter((n) => n.sourceType === "nostr").length ?? 0;
  const audioCount = notes?.filter((n) => n.sourceType === "audio").length ?? 0;
  const youtubeStatus = syncStatus?.bySource?.["youtube"];
  const youtubeCount = youtubeStatus?.total ?? 0;
  const youtubeLastAt = youtubeStatus?.lastIngestedAt ?? null;
  const firesideStatus = syncStatus?.["fireside-freedom"];
  const firesideCount = firesideStatus?.total ?? 0;
  const firesideLastAt = firesideStatus?.lastIngestedAt ?? null;
  const publishedCount = notes?.filter((n) => n.published).length ?? 0;
  const unpublishedCount = notes?.filter((n) => !n.published).length ?? 0;

  const relayHealth = syncStatus?.relayHealth ?? [];
  const failingRelays = relayHealth.filter((r) => r.status === "error");
  const hasRelayErrors = failingRelays.length > 0;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-md text-center flex flex-col items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
            Login required
          </h2>
          <p className="text-muted-foreground text-sm">
            This page is only accessible to editors. Please log in to continue.
          </p>
        </div>
        <button
          onClick={login}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          Field Notes
        </h1>
        <p className="text-muted-foreground">
          Nostr notes and audio memos auto-surfaced alongside episodes and zones.
        </p>
      </div>

      {/* Relay error warning banner */}
      {hasRelayErrors && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3.5 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">
              {failingRelays.length === 1
                ? "1 Nostr relay is offline"
                : `${failingRelays.length} Nostr relays are offline`}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              {failingRelays.map((r) => r.relay.replace("wss://", "")).join(", ")} failed during the last sync. Daily notes may be incomplete.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Radio className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Nostr Notes</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{nostrCount.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Mic className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Audio Memos</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{audioCount.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Youtube className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">YouTube Videos</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{youtubeCount.toLocaleString()}</span>
          {youtubeLastAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Last synced {format(new Date(youtubeLastAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Fireside Freedom</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{firesideCount.toLocaleString()}</span>
          {firesideLastAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Last synced {format(new Date(firesideLastAt), "MMM d, yyyy")}
            </span>
          )}
          {!firesideLastAt && firesideCount === 0 && (
            <span className="text-xs text-muted-foreground mt-0.5">Not yet synced</span>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <span className="w-4 h-4 flex items-center justify-center text-xs font-black">✓</span>
            <span className="text-xs font-bold uppercase tracking-wider">Published</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{publishedCount.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="w-4 h-4 flex items-center justify-center text-xs font-black">—</span>
            <span className="text-xs font-bold uppercase tracking-wider">Hidden</span>
          </div>
          <span className="text-3xl font-bold text-foreground">{unpublishedCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Nostr relay health */}
      {relayHealth.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-500" />
            Nostr Relay Health
          </h2>
          <div>
            {relayHealth.map((r) => (
              <RelayHealthRow key={r.relay} relay={r} />
            ))}
          </div>
        </div>
      )}

      {/* Audio upload drop zone */}
      <div className="mb-8">
        <h2 className="font-serif text-xl font-bold text-foreground mb-3">
          Upload Voice Memo
        </h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer p-10 flex flex-col items-center gap-4 ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/60 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".m4a,.mp3,.wav,.ogg,.webm,.mp4"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {mutation.isPending ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-muted-foreground">
                Transcribing with Whisper…
              </p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground/60" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Drag &amp; drop an audio file, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  .m4a · .mp3 · .wav · .ogg — up to 50 MB
                </p>
              </div>
            </>
          )}
        </div>

        {uploadError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {uploadError}
          </div>
        )}

        {mutation.isSuccess && (
          <p className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400">
            ✓ Memo transcribed and saved successfully.
          </p>
        )}
      </div>

      {/* Notes list */}
      <div>
        <h2 className="font-serif text-xl font-bold text-foreground mb-4">
          All Field Notes
        </h2>

        {isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-12">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading field notes…
          </div>
        ) : !notes || notes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No field notes yet. Nostr notes sync daily and audio memos appear after upload.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onUpdate={handleNoteUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
