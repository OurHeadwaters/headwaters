import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Video,
  File,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  CloudUpload,
} from "lucide-react";
import { fetchAuthUser, type AuthUserResponse, AdminLoginWall } from "@/lib/admin-auth";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}


type UploadStatus =
  | { phase: "idle" }
  | { phase: "requesting" }
  | { phase: "uploading"; progress: number; name: string }
  | { phase: "success"; name: string }
  | { phase: "error"; message: string; name: string };

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return <FileText className="w-4 h-4" style={{ color: "#D9A066" }} />;
  if (["mp4", "mov", "webm", "avi", "mkv", "m4v"].includes(ext))
    return <Video className="w-4 h-4" style={{ color: "#8FA883" }} />;
  return <File className="w-4 h-4 text-white/40" />;
}

interface StorageFile {
  key: string;
  name: string;
  sizeLabel: string;
  uploadedAt: string | null;
  url: string;
}

function FileRow({ file }: { file: StorageFile }) {
  const fileUrl = apiUrl(`/storage/files/${encodeURIComponent(file.key)}`);
  const date = file.uploadedAt
    ? new Date(file.uploadedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
      <div className="flex-shrink-0">
        <FileTypeIcon name={file.name} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file.name}</p>
        <p className="text-xs text-white/40">
          {file.sizeLabel}
          {date ? ` · ${date}` : ""}
        </p>
      </div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center gap-1 text-xs text-white/40 hover:text-[#D9A066] transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
  "video/x-m4v",
];
const ACCEPTED_EXTENSIONS = ".pdf,.mp4,.mov,.webm,.avi,.mkv,.m4v";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export function AdminMediaLibrary() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);

  const { data: auth, isLoading: authLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchAuthUser,
    staleTime: 60_000,
  });

  const { data: files, isLoading: filesLoading } = useQuery<StorageFile[]>({
    queryKey: ["storage-files"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/storage/files"));
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    staleTime: 30_000,
    enabled: !!auth?.user,
  });

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) && file.type !== "") {
        setUploadStatuses((prev) => [
          {
            phase: "error",
            name: file.name,
            message: "Only PDF and video files are allowed.",
          },
          ...prev,
        ]);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadStatuses((prev) => [
          {
            phase: "error",
            name: file.name,
            message: `File is too large. Maximum size is 500 MB.`,
          },
          ...prev,
        ]);
        return;
      }

      setUploadStatuses((prev) => [{ phase: "requesting" }, ...prev]);

      try {
        const urlRes = await fetch(apiUrl("/storage/uploads/request-url"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
        });

        if (!urlRes.ok) {
          const errData = await urlRes.json().catch(() => ({}));
          throw new Error(
            (errData as { error?: string }).error ?? "Failed to get upload URL"
          );
        }

        const { uploadURL } = (await urlRes.json()) as { uploadURL: string };

        setUploadStatuses((prev) => [
          { phase: "uploading", progress: 0, name: file.name },
          ...prev.slice(1),
        ]);

        const putRes = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });

        if (!putRes.ok) {
          throw new Error("Upload to storage failed");
        }

        setUploadStatuses((prev) => [
          { phase: "success", name: file.name },
          ...prev.slice(1),
        ]);

        await qc.invalidateQueries({ queryKey: ["storage-files"] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadStatuses((prev) => [
          { phase: "error", name: file.name, message: msg },
          ...prev.slice(1),
        ]);
      }
    },
    [qc]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach(uploadFile);
    },
    [uploadFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="h-10 w-64 bg-muted animate-pulse rounded mb-4" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!auth?.user) {
    return <AdminLoginWall returnTo="/admin/media-library" />;
  }

  const activeUpload = uploadStatuses[0];
  const isUploading =
    activeUpload?.phase === "requesting" ||
    activeUpload?.phase === "uploading";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #0F1F1A 0%, #1A2E24 60%, #1E3A2E 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 50%, #D9A066 0%, transparent 55%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 py-12 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
            style={{
              color: "#D9A066",
              background: "#D9A06618",
              border: "1px solid #D9A06633",
            }}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Arc · Admin</span>
          </div>
          <h1
            className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-3"
            style={{ color: "#FDFBF7" }}
          >
            Media Library
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: "#C8D4C0" }}>
            Upload PDFs and videos. Files appear immediately on the public{" "}
            <a
              href="/resources"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: "#8FA883" }}
            >
              Resources page
            </a>
            .
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Upload zone */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">
            Upload Files
          </h2>

          <div
            role="button"
            tabIndex={0}
            aria-label="Drop files here or click to select"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                fileInputRef.current?.click();
              }
            }}
            className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none"
            style={{
              minHeight: 220,
              borderColor: isDragging
                ? "#D9A066"
                : "rgba(255,255,255,0.12)",
              background: isDragging
                ? "rgba(217,160,102,0.06)"
                : "rgba(255,255,255,0.02)",
            }}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#D9A066" }} />
                <p className="text-sm font-medium" style={{ color: "#D9A066" }}>
                  {activeUpload.phase === "requesting"
                    ? "Preparing upload…"
                    : `Uploading ${"name" in activeUpload ? activeUpload.name : ""}…`}
                </p>
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(217,160,102,0.10)" }}
                >
                  <Upload className="w-6 h-6" style={{ color: "#D9A066" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/70 mb-1">
                    Drop files here, or click to browse
                  </p>
                  <p className="text-xs text-white/35">
                    PDFs and videos · up to 500 MB each
                  </p>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              multiple
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Status messages */}
          {uploadStatuses.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadStatuses.map((status, i) => {
                if (status.phase === "idle" || status.phase === "requesting") return null;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm"
                    style={{
                      background:
                        status.phase === "success"
                          ? "rgba(143,168,131,0.12)"
                          : status.phase === "error"
                          ? "rgba(220,80,80,0.10)"
                          : "rgba(217,160,102,0.08)",
                      border:
                        status.phase === "success"
                          ? "1px solid rgba(143,168,131,0.25)"
                          : status.phase === "error"
                          ? "1px solid rgba(220,80,80,0.2)"
                          : "1px solid rgba(217,160,102,0.15)",
                    }}
                  >
                    {status.phase === "success" && (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#8FA883" }} />
                    )}
                    {status.phase === "error" && (
                      <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#E57373" }} />
                    )}
                    {status.phase === "uploading" && (
                      <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: "#D9A066" }} />
                    )}
                    <span
                      style={{
                        color:
                          status.phase === "success"
                            ? "#8FA883"
                            : status.phase === "error"
                            ? "#E57373"
                            : "#D9A066",
                      }}
                    >
                      {status.phase === "success" &&
                        `"${"name" in status ? status.name : ""}" uploaded successfully.`}
                      {status.phase === "error" &&
                        `${"name" in status ? `"${status.name}": ` : ""}${"message" in status ? status.message : "Upload failed."}`}
                      {status.phase === "uploading" &&
                        `Uploading "${"name" in status ? status.name : ""}"…`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Existing files */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4">
            Library Contents
          </h2>

          {filesLoading && (
            <div className="flex items-center gap-2 text-white/40 text-sm py-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading files…
            </div>
          )}

          {!filesLoading && (!files || files.length === 0) && (
            <div
              className="py-12 text-center rounded-xl border"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <File className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-white/40 text-sm">
                No files in the library yet. Upload something above.
              </p>
            </div>
          )}

          {files && files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <FileRow key={file.key} file={file} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
