import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, File, FileText, Video, Image, Loader2, Tag } from "lucide-react";
import type { StorageFile } from "@/hooks/use-storage-files";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

function adminHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

async function fetchFiles(): Promise<StorageFile[]> {
  const res = await fetch(apiUrl("/storage/files"));
  if (!res.ok) throw new Error("Failed to load files");
  return res.json();
}

async function saveMetadata(data: {
  fileKey: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}): Promise<StorageFile> {
  const res = await fetch(apiUrl("/admin/storage/files/metadata"), {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to save");
  }
  return res.json();
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="w-4 h-4 text-amber-400" />;
  if (type === "video") return <Video className="w-4 h-4 text-green-400" />;
  if (type === "image") return <Image className="w-4 h-4 text-blue-400" />;
  return <File className="w-4 h-4 text-white/40" />;
}

interface EditState {
  title: string;
  description: string;
  category: string;
  tagsRaw: string;
}

function FileRow({ file, onSaved }: { file: StorageFile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>({
    title: file.title ?? "",
    description: file.description ?? "",
    category: file.category ?? "",
    tagsRaw: (file.tags ?? []).join(", "),
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: saveMetadata,
    onSuccess: () => {
      setSaveError(null);
      setEditing(false);
      onSaved();
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  function startEdit() {
    setForm({
      title: file.title ?? "",
      description: file.description ?? "",
      category: file.category ?? "",
      tagsRaw: (file.tags ?? []).join(", "),
    });
    setSaveError(null);
    setEditing(true);
  }

  function handleSave() {
    const tags = form.tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    mutation.mutate({
      fileKey: file.key,
      title: form.title,
      description: form.description,
      category: form.category,
      tags,
    });
  }

  const displayTitle = file.title || file.name;

  if (!editing) {
    return (
      <div
        className="flex items-start gap-4 p-4 rounded-lg border transition-all"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center bg-muted">
          <FileTypeIcon type={file.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayTitle}</p>
              {file.title && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{file.name}</p>
              )}
            </div>
            <button
              onClick={startEdit}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 items-center">
            {file.category && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: "#6B9DBF18", color: "#6B9DBF", border: "1px solid #6B9DBF30" }}
              >
                <Tag className="w-2.5 h-2.5" />
                {file.category}
              </span>
            )}
            {(file.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}
              >
                #{tag}
              </span>
            ))}
            {!file.category && (!file.tags || file.tags.length === 0) && (
              <span className="text-[10px] text-muted-foreground italic">No metadata yet</span>
            )}
          </div>

          {file.description && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{file.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ borderColor: "#D9A06630", background: "rgba(217,160,102,0.04)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <FileTypeIcon type={file.type} />
        <p className="text-xs text-muted-foreground font-mono truncate">{file.name}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Title <span className="font-normal opacity-60">(shown to visitors)</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={file.name}
            className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of this file…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Preparedness, Health…"
              className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Tags <span className="font-normal opacity-60">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={form.tagsRaw}
              onChange={(e) => setForm((f) => ({ ...f, tagsRaw: e.target.value }))}
              placeholder="e.g. water, gear, zone-1"
              className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {saveError && (
        <p className="mt-3 text-xs text-red-400">{saveError}</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          style={{ background: "#D9A066", color: "#fff" }}
        >
          {mutation.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
          Save
        </button>
        <button
          onClick={() => { setEditing(false); setSaveError(null); }}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AdminFiles() {
  const qc = useQueryClient();
  const { data: files, isLoading, isError } = useQuery<StorageFile[]>({
    queryKey: ["storage-files"],
    queryFn: fetchFiles,
    staleTime: 0,
  });

  function refetch() {
    qc.invalidateQueries({ queryKey: ["storage-files"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">File Library — Metadata</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add friendly titles, descriptions, categories, and tags to files uploaded via Arc's
            Media Library. These appear on the public Resources page.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 py-16 justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading files…</span>
          </div>
        )}

        {isError && (
          <div className="py-16 text-center text-muted-foreground">
            Could not load files. Try refreshing.
          </div>
        )}

        {files && files.length === 0 && (
          <div
            className="py-16 text-center rounded-xl border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <File className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">No files in the library yet.</p>
          </div>
        )}

        {files && files.length > 0 && (
          <div className="space-y-3">
            {files.map((file) => (
              <FileRow key={file.key} file={file} onSaved={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
