import { useState, useMemo } from "react";
import {
  FileText, Video, Image, File, Loader2, ExternalLink, Filter, Search, Tag,
} from "lucide-react";
import { useStorageFiles, type FileType, type StorageFile } from "@/hooks/use-storage-files";
import { EvidenceTierBadge, type EvidenceTier } from "@/components/evidence-tier-badge";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

type FilterMode = "all" | "pdf" | "video" | "image" | "other";

function FileTypeIcon({ type }: { type: FileType }) {
  switch (type) {
    case "pdf":
      return <FileText className="w-4 h-4" style={{ color: "#D9A066" }} />;
    case "video":
      return <Video className="w-4 h-4" style={{ color: "#8FA883" }} />;
    case "image":
      return <Image className="w-4 h-4" style={{ color: "#8FA883" }} />;
    default:
      return <File className="w-4 h-4 text-white/40" />;
  }
}

function TypeBadge({ type }: { type: FileType }) {
  const styles: Record<FileType, { bg: string; color: string; label: string }> = {
    pdf: { bg: "#D9A06620", color: "#D9A066", label: "PDF" },
    video: { bg: "#8FA88320", color: "#8FA883", label: "Video" },
    image: { bg: "#6B9DBF20", color: "#6B9DBF", label: "Image" },
    other: { bg: "#FFFFFF15", color: "#FFFFFF80", label: "File" },
  };
  const s = styles[type];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: "#6B9DBF18",
        color: "#6B9DBF",
        border: "1px solid #6B9DBF30",
      }}
    >
      <Tag className="w-2.5 h-2.5" />
      {category}
    </span>
  );
}

function FileCard({ file }: { file: StorageFile }) {
  const fileUrl = apiUrl(`/storage/files/${encodeURIComponent(file.key)}`);
  const displayTitle = file.title || file.name;
  const uploadedDate = file.uploadedAt
    ? new Date(file.uploadedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl border border-border bg-card transition-all hover:-translate-y-px hover:shadow-md flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
            <FileTypeIcon type={file.type} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-semibold leading-snug break-words text-foreground">
                {displayTitle}
              </h3>
              <TypeBadge type={file.type} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {file.category && <CategoryBadge category={file.category} />}
              {file.evidenceTier !== null && file.evidenceTier !== undefined && (
                <EvidenceTierBadge tier={file.evidenceTier as EvidenceTier} />
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{file.sizeLabel}</span>
              {uploadedDate && (
                <>
                  <span>·</span>
                  <span>{uploadedDate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {file.description && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {file.description}
          </p>
        )}

        {file.tags && file.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {file.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:-translate-y-px"
            style={{
              color: "#D9A066",
              background: "#D9A06618",
              border: "1px solid #D9A06630",
            }}
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
        </div>
      </div>
    </div>
  );
}

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: "all", label: "All Files" },
  { value: "pdf", label: "PDFs" },
  { value: "video", label: "Videos" },
  { value: "image", label: "Images" },
  { value: "other", label: "Other" },
];

export default function ResourcesPage() {
  const { data: files, isLoading, isError } = useStorageFiles();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => {
    if (!files) return [];
    const cats = new Set<string>();
    files.forEach((f) => { if (f.category) cats.add(f.category); });
    return Array.from(cats).sort();
  }, [files]);

  const filtered = useMemo(() => {
    if (!files) return [];
    let result = files;
    if (filter !== "all") result = result.filter((f) => f.type === filter);
    if (categoryFilter !== "all") result = result.filter((f) => f.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((f) => {
        const title = (f.title || f.name).toLowerCase();
        const desc = (f.description ?? "").toLowerCase();
        const cat = (f.category ?? "").toLowerCase();
        const tags = (f.tags ?? []).join(" ").toLowerCase();
        return title.includes(q) || desc.includes(q) || cat.includes(q) || tags.includes(q);
      });
    }
    return result;
  }, [files, filter, categoryFilter, search]);

  const counts = useMemo(() => {
    if (!files) return {} as Record<FilterMode, number>;
    return {
      all: files.length,
      pdf: files.filter((f) => f.type === "pdf").length,
      video: files.filter((f) => f.type === "video").length,
      image: files.filter((f) => f.type === "image").length,
      other: files.filter((f) => f.type === "other").length,
    };
  }, [files]);

  const hasActiveFilter = filter !== "all" || categoryFilter !== "all" || search.trim() !== "";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1F1A 0%, #1A2E24 60%, #1E3A2E 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 50%, #D9A066 0%, transparent 55%)",
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-16 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: "#D9A066",
              background: "#D9A06618",
              border: "1px solid #D9A06633",
            }}
          >
            <File className="w-3.5 h-3.5" />
            <span>Media Library</span>
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#FDFBF7" }}
          >
            Resources.
            <br />
            <span style={{ color: "#8FA883" }}>Filed for the path.</span>
          </h1>

          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "#C8D4C0" }}>
            PDFs, guides, and reference materials — browse and open them directly from here.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Search bar */}
        {files && files.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, description, or tag…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Filter bar */}
        {files && files.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />

            {/* File type filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTER_OPTIONS.map((opt) => {
                const count = counts[opt.value] ?? 0;
                if (opt.value !== "all" && count === 0) return null;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={
                      filter === opt.value
                        ? { background: "#D9A066", color: "#fff" }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }
                    }
                  >
                    {opt.label}
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      style={
                        filter === opt.value
                          ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                          : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category filters */}
            {categories.length > 0 && (
              <>
                <span className="text-muted-foreground/40 text-xs px-1">|</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={
                      categoryFilter === "all"
                        ? { background: "#6B9DBF", color: "#fff" }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }
                    }
                  >
                    All Topics
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={
                        categoryFilter === cat
                          ? { background: "#6B9DBF", color: "#fff" }
                          : {
                              background: "rgba(255,255,255,0.05)",
                              color: "rgba(255,255,255,0.55)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* States */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading resources…</span>
          </div>
        )}

        {isError && (
          <div className="py-24 text-center text-muted-foreground">
            Could not load resources. Try refreshing.
          </div>
        )}

        {files && files.length === 0 && (
          <div
            className="py-24 text-center rounded-xl border"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <File className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-sm">
              No files uploaded yet. Files added via the Arc's Media Library will appear here.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((file) => (
              <FileCard key={file.key} file={file} />
            ))}
          </div>
        )}

        {files && files.length > 0 && filtered.length === 0 && hasActiveFilter && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No files match your current filters.{" "}
            <button
              onClick={() => { setFilter("all"); setCategoryFilter("all"); setSearch(""); }}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
