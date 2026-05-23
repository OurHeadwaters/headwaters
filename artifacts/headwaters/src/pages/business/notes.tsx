import { useState, useRef, useEffect, useCallback } from "react";
import { useGetHeadwatersBusinessSection, usePatchHeadwatersBusinessSection } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen, CheckCircle } from "lucide-react";

export default function BusinessNotes() {
  const { data, isLoading, error } = useGetHeadwatersBusinessSection("notes");

  const patch = usePatchHeadwatersBusinessSection();
  const [localText, setLocalText] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const serverText = typeof data?.value === "string" ? data.value : "";
  const text = localText !== null ? localText : serverText;

  useEffect(() => {
    if (data && localText === null) {
      setLocalText(serverText);
    }
  }, [data]);

  const handleBlur = useCallback(() => {
    if (localText === null) return;
    patch.mutate(
      { section: "notes", data: { value: localText } },
      {
        onSuccess: () => {
          setSaved(true);
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  }, [localText, patch]);

  if (isLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading notes...</div>;
  if (error)
    return <div className="p-8 text-center text-destructive">Failed to load notes.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex-none mb-6">
        <h1 className="font-serif text-4xl font-bold text-foreground flex items-center gap-3">
          <NotebookPen className="text-primary" size={32} />
          Operating Notes
        </h1>
        <p className="text-muted-foreground mt-2">
          Freeform thinking space — goals, context, operating plan. Auto-saves when you click away.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <Textarea
          value={text}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write your operating plan, goals, priorities context, or anything else that lives in your head..."
          className="flex-1 resize-none bg-card font-mono text-base p-6 border-primary/20 focus-visible:ring-primary/30"
          autoFocus
        />
        <div className="flex-none flex items-center justify-end h-6">
          {patch.isPending && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          {!patch.isPending && saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-300">
              <CheckCircle size={12} />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
