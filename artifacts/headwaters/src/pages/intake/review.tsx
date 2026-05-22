import { useRoute, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useGetHeadwatersClient, usePushHeadwatersPlacement } from "@workspace/api-client-react";
import { RISK_PROFILES, ZONES } from "@/lib/api-utils";
import { useIntake } from "@/context/intake";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";

export default function IntakeReview() {
  const [, params] = useRoute("/intake/:clientId/review");
  const [, setLocation] = useLocation();
  const clientId = params?.clientId || "";
  const { toast } = useToast();

  const { dump, interpretResult, clear } = useIntake();
  const pushPlacement = usePushHeadwatersPlacement();

  const [primaryZone, setPrimaryZone] = useState("");
  const [secondaryZone, setSecondaryZone] = useState("");
  const [riskProfile, setRiskProfile] = useState<number>(3);
  const [clientRationale, setClientRationale] = useState("");
  const [practitionerNotes, setPractitionerNotes] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    if (interpretResult) {
      setPrimaryZone(interpretResult.primaryZone);
      setSecondaryZone(interpretResult.secondaryZone);
      setRiskProfile(interpretResult.riskProfile);
      setClientRationale(interpretResult.clientRationale);
    } else if (!dump) {
      setLocation(`/intake/${clientId}`);
    }
  }, [interpretResult, dump, clientId, setLocation]);

  const { data: client } = useGetHeadwatersClient(clientId, {
    query: { enabled: !!clientId } as any,
  });

  const handlePush = () => {
    pushPlacement.mutate(
      {
        data: {
          clientId,
          primaryZone,
          secondaryZone,
          riskProfile,
          clientRationale,
          practitionerNotes,
          dump,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Placement pushed to TSP" });
          clear();
          setLocation(`/clients/${clientId}`);
        },
        onError: (err: any) => {
          toast({ title: "Push failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (!interpretResult || !client) return <div className="p-8">Loading synthesis...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/intake/${clientId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft size={16} className="mr-1" /> Back to editing dump
          </Link>
          <h1 className="font-serif text-3xl font-bold text-foreground">Review & Adjust</h1>
          <p className="text-muted-foreground mt-1">AI synthesis for {client.name}. Adjust before pushing to their map.</p>
        </div>
        <Button onClick={handlePush} disabled={pushPlacement.isPending} size="lg" className="gap-2">
          <Save size={18} />
          {pushPlacement.isPending ? "Pushing..." : "Confirm & Push"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen} className="border border-border rounded-lg bg-card overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 font-serif font-medium text-lg hover:bg-muted/50 transition-colors">
              AI Synthesis Summary
              {summaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {interpretResult.practitionerSummary}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Raw Brain Dump</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">{dump}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Placement Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Zone</Label>
                  <Select value={primaryZone} onValueChange={setPrimaryZone}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((z) => (
                        <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Zone</Label>
                  <Select value={secondaryZone} onValueChange={setSecondaryZone}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ZONES.map((z) => (
                        <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <Label>Risk Profile Level</Label>
                  <span className="font-serif font-bold text-primary">
                    {riskProfile} — {RISK_PROFILES.find((r) => r.value === riskProfile)?.label}
                  </span>
                </div>
                <Slider
                  value={[riskProfile]}
                  onValueChange={(vals) => setRiskProfile(vals[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Tight</span>
                  <span>Open</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Client Rationale (Visible to Client)</Label>
                <Textarea
                  value={clientRationale}
                  onChange={(e) => setClientRationale(e.target.value)}
                  className="bg-background min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">This exact text will appear on the client's map dashboard.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label>Private Notes (Append to history)</Label>
                <Textarea
                  value={practitionerNotes}
                  onChange={(e) => setPractitionerNotes(e.target.value)}
                  placeholder="Any extra private notes from this session..."
                  className="bg-background min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
