import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PASSPHRASE_HINT = "Enter the forge passphrase to access admin tools.";

interface FormData {
  moduleName: string;
  moduleDescription: string;
  moduleIcon: string;
  lessonTitle: string;
  lessonBody: string;
}

const EMPTY_FORM: FormData = {
  moduleName: "",
  moduleDescription: "",
  moduleIcon: "📚",
  lessonTitle: "",
  lessonBody: "",
};

export default function Admin() {
  const [passphrase, setPassphrase] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileResult, setFileResult] = useState<{ name: string; chars: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/castle/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const data = await res.json();
      if (data.ok) {
        setAuthenticated(true);
      } else {
        setAuthError("Wrong passphrase. The forge does not open for strangers.");
      }
    } catch {
      setAuthError("Could not reach the server. Try again.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".pdf", ".txt", ".md", ".markdown"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadResult({ success: false, message: "Only PDF, TXT, and Markdown files are supported." });
      return;
    }

    setFileUploading(true);
    setUploadResult(null);
    setFileResult(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/castle/admin/upload-lesson", {
        method: "POST",
        headers: { "X-Castle-Passphrase": passphrase },
        body,
      });

      const data = await res.json();
      if (data.ok) {
        setFormData(f => ({
          ...f,
          lessonTitle: data.title || f.lessonTitle,
          lessonBody: data.body || f.lessonBody,
        }));
        setFileResult({ name: file.name, chars: data.charCount });
        setUploadResult({ success: true, message: `Extracted from "${file.name}". Review and edit below, then add to the forge.` });
      } else {
        setUploadResult({ success: false, message: data.error ?? "File parse failed." });
      }
    } catch {
      setUploadResult({ success: false, message: "Upload failed. Check your connection." });
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await fetch("/api/castle/admin/lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Castle-Passphrase": passphrase,
        },
        body: JSON.stringify({
          moduleName: formData.moduleName,
          moduleDescription: formData.moduleDescription,
          moduleIcon: formData.moduleIcon,
          lesson: {
            title: formData.lessonTitle,
            body: formData.lessonBody,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUploadResult({ success: true, message: "Lesson added to the forge and saved to disk. The weapons are sharpened." });
        setFormData(EMPTY_FORM);
        setFileResult(null);
      } else {
        setUploadResult({ success: false, message: data.error ?? "Upload failed." });
      }
    } catch {
      setUploadResult({ success: false, message: "Network error. Forge offline." });
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-white/10";
  const inputStyle = { background: "rgba(255,255,255,0.04)", color: "#e2e8f0" };

  return (
    <div className="min-h-screen" style={{ background: "#080810" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-3xl font-black mb-2" style={{ color: "#e2e8f0" }}>
            Forge Admin
          </h1>
          <p className="text-sm opacity-40">{PASSPHRASE_HINT}</p>
        </div>

        <AnimatePresence mode="wait">
          {!authenticated ? (
            <motion.form
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleAuth}
              className="rounded-2xl p-8 border border-white/10"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <label className="block text-sm font-bold opacity-50 mb-2 uppercase tracking-wider">
                Forge Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase..."
                className={inputClass}
                style={{
                  ...inputStyle,
                  marginBottom: "1rem",
                  borderColor: authError ? "#ef4444" : "rgba(255,255,255,0.1)",
                }}
              />
              {authError && (
                <p className="text-xs text-red-400 mb-3">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: "#e2e8f0", color: "#080810" }}
              >
                Enter the Forge
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="rounded-xl px-4 py-3 text-sm font-bold text-green-400 bg-green-400/10 border border-green-400/20">
                ✓ Access granted. The forge is yours.
              </div>

              <div
                className="rounded-2xl p-6 border border-white/10 flex flex-col gap-4"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div>
                  <h2 className="font-black text-lg mb-1">Upload a Lesson File</h2>
                  <p className="text-xs opacity-40">
                    Upload a PDF, TXT, or Markdown file. The content will be extracted and pre-filled below for review before saving.
                  </p>
                </div>

                <label
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 p-8 cursor-pointer transition-colors hover:border-white/20"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <span className="text-3xl">{fileUploading ? "⏳" : "📄"}</span>
                  <span className="text-sm opacity-60">
                    {fileUploading
                      ? "Parsing file..."
                      : fileResult
                      ? `✓ ${fileResult.name} (${fileResult.chars.toLocaleString()} chars extracted)`
                      : "Click to upload PDF, TXT, or Markdown"}
                  </span>
                  <span className="text-xs opacity-30">Max 10 MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.markdown"
                    onChange={handleFileUpload}
                    disabled={fileUploading}
                    className="sr-only"
                  />
                </label>

                {uploadResult && uploadResult.success && (
                  <div className="rounded-xl px-4 py-3 text-sm text-blue-300 bg-blue-400/10 border border-blue-400/20">
                    {uploadResult.message}
                  </div>
                )}
                {uploadResult && !uploadResult.success && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
                    {uploadResult.message}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleAddLesson}
                className="rounded-2xl p-6 border border-white/10 flex flex-col gap-4"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div>
                  <h2 className="font-black text-lg mb-1">Lesson Details</h2>
                  <p className="text-xs opacity-40">
                    Fill in manually or edit the auto-extracted content from a file upload above.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs opacity-40 mb-1 uppercase tracking-wider">Module Name</label>
                    <input
                      required
                      value={formData.moduleName}
                      onChange={(e) => setFormData(f => ({ ...f, moduleName: e.target.value }))}
                      placeholder="e.g. Advanced DeFi Concepts"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs opacity-40 mb-1 uppercase tracking-wider">Icon</label>
                    <input
                      value={formData.moduleIcon}
                      onChange={(e) => setFormData(f => ({ ...f, moduleIcon: e.target.value }))}
                      placeholder="📚"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs opacity-40 mb-1 uppercase tracking-wider">Module Description</label>
                  <input
                    required
                    value={formData.moduleDescription}
                    onChange={(e) => setFormData(f => ({ ...f, moduleDescription: e.target.value }))}
                    placeholder="One sentence description of this module"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs opacity-40 mb-1 uppercase tracking-wider">Lesson Title</label>
                  <input
                    required
                    value={formData.lessonTitle}
                    onChange={(e) => setFormData(f => ({ ...f, lessonTitle: e.target.value }))}
                    placeholder="Lesson title"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs opacity-40 mb-1 uppercase tracking-wider">Lesson Body</label>
                  <textarea
                    required
                    rows={8}
                    value={formData.lessonBody}
                    onChange={(e) => setFormData(f => ({ ...f, lessonBody: e.target.value }))}
                    placeholder="The lesson content. Write or paste clearly — this is what learners will read."
                    className={`${inputClass} resize-none`}
                    style={inputStyle}
                  />
                </div>

                {uploadResult && !fileUploading && !uploadResult.success && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
                    {uploadResult.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                  style={{ background: "#e2e8f0", color: "#080810" }}
                >
                  {uploading ? "Adding to forge..." : "Add Lesson to Forge"}
                </button>
              </form>

              <div
                className="rounded-2xl p-6 border border-white/5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <h3 className="font-bold text-sm opacity-50 mb-3 uppercase tracking-wider">Faction Counts Reset</h3>
                <p className="text-xs opacity-40 mb-3">Reset all faction member counts to zero. This cannot be undone.</p>
                <button
                  onClick={async () => {
                    if (!confirm("Reset all faction counts to zero?")) return;
                    await fetch("/api/castle/admin/reset-counts", {
                      method: "POST",
                      headers: { "X-Castle-Passphrase": passphrase },
                    });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/10 transition-colors"
                >
                  Reset Faction Counts
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
