import { useRoute, useLocation, Link } from "wouter";
import { useGetHeadwatersClient, useInterpretHeadwatersDump } from "@workspace/api-client-react";
import { useIntake } from "@/context/intake";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BrainCircuit, User, TreePine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function IntakeDump() {
  const [, params] = useRoute("/intake/:clientId");
  const [, setLocation] = useLocation();
  const clientId = params?.clientId || "";
  const { toast } = useToast();

  const { dump, setDump, landDump, setLandDump, setInterpretResult, clear } = useIntake();

  const { data: client, isLoading: isLoadingClient } = useGetHeadwatersClient(clientId, {
    query: { enabled: !!clientId } as any,
  });

  const interpret = useInterpretHeadwatersDump();

  useEffect(() => {
    if (client) {
      if (!dump) {
        setDump(client.lastDump ?? "");
      }
    } else {
      clear();
    }
  }, [clientId, client]);

  const handleSubmit = () => {
    if (dump.length < 10) {
      toast({ title: "Too short", description: "Please enter more detail about the person.", variant: "destructive" });
      return;
    }

    interpret.mutate(
      { data: { dump, clientId, landDump: landDump.trim() || undefined } },
      {
        onSuccess: (result) => {
          setInterpretResult(result);
          setLocation(`/intake/${clientId}/review`);
        },
        onError: (err: any) => {
          toast({ title: "Interpretation failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (isLoadingClient) return <div className="p-8 text-center text-muted-foreground">Loading client...</div>;
  if (!client) return <div className="p-8 text-center text-destructive">Client not found.</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex-none mb-6">
        <Link href={`/clients/${clientId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to {client.name}
        </Link>
        <h1 className="font-serif text-3xl font-bold text-foreground">Intake Session</h1>
        <p className="text-muted-foreground mt-1">
          Write about the person, and optionally the land. Both inform the placement.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User size={15} className="text-primary" />
              The Person
            </div>
            <Textarea
              value={dump}
              onChange={(e) => setDump(e.target.value)}
              placeholder="Write your observations about the person… How did they show up? What are their resources, time, and energy? What's their comfort level with risk? What zone of their life has the most friction right now?"
              className="flex-1 resize-none bg-card font-mono text-base p-5 border-primary/20 focus-visible:ring-primary/30"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">{dump.length} characters</p>
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <TreePine size={15} className="text-emerald-600" />
              The Land
              <span className="text-xs text-muted-foreground font-normal ml-1">(optional)</span>
            </div>
            <Textarea
              value={landDump}
              onChange={(e) => setLandDump(e.target.value)}
              placeholder="Describe the land or place… How many acres? What's already established — beds, trees, structures, water? What zone of development has it reached? What's the biggest gap between what exists and what's possible? What's the most neglected area?"
              className="flex-1 resize-none bg-card font-mono text-base p-5 border-emerald-800/20 focus-visible:ring-emerald-700/30"
            />
            <p className="text-xs text-muted-foreground">{landDump.length} characters</p>
          </div>
        </div>

        <div className="flex-none flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {landDump.trim() ? "Dual-state synthesis: person + land" : "Person-only synthesis"}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={interpret.isPending || dump.length < 10}
            className="gap-2 font-medium"
            size="lg"
          >
            {interpret.isPending ? (
              "Interpreting..."
            ) : (
              <>
                <BrainCircuit size={18} />
                Interpret & Synthesize
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
