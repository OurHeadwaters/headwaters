import { useRoute, useLocation, Link } from "wouter";
import { useGetHeadwatersClient, useInterpretHeadwatersDump } from "@workspace/api-client-react";
import { useIntake } from "@/context/intake";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function IntakeDump() {
  const [, params] = useRoute("/intake/:clientId");
  const [, setLocation] = useLocation();
  const clientId = params?.clientId || "";
  const { toast } = useToast();

  const { dump, setDump, setInterpretResult, clear } = useIntake();

  const { data: client, isLoading: isLoadingClient } = useGetHeadwatersClient(clientId, {
    query: { enabled: !!clientId } as any,
  });

  const interpret = useInterpretHeadwatersDump();

  // On entering a (re-)intake for a client, if there is no in-progress dump
  // already in context, prefill from their last saved dump so Bobbie has
  // reference to the previous session. She can overwrite freely.
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
      toast({ title: "Too short", description: "Please enter more detail about the session.", variant: "destructive" });
      return;
    }

    interpret.mutate(
      { data: { dump, clientId } },
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
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex-none mb-6">
        <Link href={`/clients/${clientId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to {client.name}
        </Link>
        <h1 className="font-serif text-3xl font-bold text-foreground">Intake Session</h1>
        <p className="text-muted-foreground mt-1">Brain dump your notes and observations for {client.name}.</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <Textarea
          value={dump}
          onChange={(e) => setDump(e.target.value)}
          placeholder="Tell me about this session... How did they react? What are their resources? What's their comfort level with risk?"
          className="flex-1 resize-none bg-card font-mono text-base p-6 border-primary/20 focus-visible:ring-primary/30"
          autoFocus
        />

        <div className="flex-none flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">{dump.length} characters</p>
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
