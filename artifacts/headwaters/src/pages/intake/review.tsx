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
import { ArrowLeft, Save, ChevronDown, ChevronUp, TreePine, User, Sparkles } from "lucide-react";

export default function IntakeReview() {
  const [, params] = useRoute("/intake/:clientId/review");
  const [, setLocation] = useLocation();
  const clientId = params?.clientId || "";
  const { toast } = useToast();

  const { dump, landDump, interpretResult, clear } = useIntake();
  const pushPlacement = usePushHeadwatersPlacement();

  const [primaryZone, setPrimaryZone] = useState("");
  const [secondaryZone, setSecondaryZone] = useState("");
  const [riskProfile, setRiskProfile] = useState<number>(3);
  const [clientRationale, setClientRationale] = useState("");
  const [practitionerNotes, setPractitionerNotes] = useState("");
  const [practitionerName, setPractitionerName] = useState("Bobbie");
  const [summaryOpen, setSummaryOpen] = useState(true);

  const [landZone, setLandZone] = useState("");
  const [landSecondaryZone, setLandSecondaryZone] = useState("");
  const [landRationale, setLandRationale] = useState("");
  const [harmonyNote, setHarmonyNote] = useState("");

  const hasLand = !!((interpretResult as any)?.landZone || landDump?.trim());

  useEffect(() => {
    if (interpretResult) {
      setPrimaryZone(interpretResult.primaryZone);
      setSecondaryZone(interpretResult.secondaryZone);
      setRiskProfile(interpretResult.riskProfile);
      setClientRationale(interpretResult.clientRationale);
      setLandZone((interpretResult as any).landZone ?? "");
      setLandSecondaryZone((interpretResult as any).landSecondaryZone ?? "");
      setLandRationale((interpretResult as any).landRationale ?? "");
      setHarmonyNote((interpretResult as any).harmonyNote ?? "");
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
          practitionerName: practitionerName || undefined,
          dump,
          ...(landZone ? { landZone } : {}),
          ...(landSecondaryZone ? { landSecondaryZone } : {}),
          ...(landRationale ? { landRationale } : {}),
          ...(harmonyNote ? { harmonyNote } : {}),
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/intake/${clientId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft size={16} className="mr-1" /> Back to editing
          </Link>
          <h1 className="font-serif text-3xl font-bold text-foreground">Review & Adjust</h1>
          <p className="text-muted-foreground mt-1">
            AI synthesis for {client.name}.{hasLand ? " Dual-state: person + land." : ""} Adjust before pushing.
          </p>
        </div>
        <Button onClick={handlePush} disabled={pushPlacement.isPending} size="lg" className="gap-2">
          <Save size={18} />
          {pushPlacement.isPending ? "Pushing..." : "Confirm & Push"}
        </Button>
      </div>

      {harmonyNote && (
        <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/30 p-5 flex gap-4 items-start">
          <div className="w-9 h-9 rounded-full bg-emerald-900/50 border border-emerald-700/40 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-1">Harmony Note</p>
            <p className="text-sm text-emerald-100 leading-relaxed italic">{harmonyNote}</p>
            <p className="text-xs text-emerald-600 mt-2">Where their capacity meets the land's readiness</p>
          </div>
        </div>
      )}

      <div className={`grid gap-8 items-start ${hasLand ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>
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
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><User size={11} /> Person</p>
                <div className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">{dump}</div>
              </div>
              {landDump?.trim() && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><TreePine size={11} /> Land</p>
                  <div className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">{landDump}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <User size={18} className="text-primary" />
              Person Placement
            </CardTitle>
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
                <Label>Risk Profile</Label>
                <span className="font-serif font-bold text-primary">
                  {riskProfile} — {RISK_PROFILES.find((r) => r.value === riskProfile)?.label}
                </span>
              </div>
              <Slider
                value={[riskProfile]}
                onValueChange={(vals) => setRiskProfile(vals[0])}
                min={1} max={5} step={1}
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
              <p className="text-xs text-muted-foreground">This exact text appears on the client's map.</p>
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

        {hasLand && (
          <Card className="border-emerald-800/30 shadow-md bg-emerald-950/10">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <TreePine size={18} className="text-emerald-500" />
                Land Placement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Land Zone</Label>
                  <Select value={landZone} onValueChange={setLandZone}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ZONES.map((z) => (
                        <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Land Secondary Zone</Label>
                  <Select value={landSecondaryZone} onValueChange={setLandSecondaryZone}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select zone" />
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

              <div className="space-y-2">
                <Label>Land Rationale (What the land is ready for)</Label>
                <Textarea
                  value={landRationale}
                  onChange={(e) => setLandRationale(e.target.value)}
                  placeholder="Describe what the land is ready for and what should happen next..."
                  className="bg-background min-h-[100px]"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-800/20">
                <Label className="text-emerald-400 flex items-center gap-1">
                  <Sparkles size={13} /> Harmony Note
                </Label>
                <Textarea
                  value={harmonyNote}
                  onChange={(e) => setHarmonyNote(e.target.value)}
                  placeholder="Where does this person's capacity meet what the land needs most right now?"
                  className="bg-background min-h-[80px] border-emerald-800/30 focus-visible:ring-emerald-700/30"
                />
                <p className="text-xs text-emerald-600">Name the exact work — specific, not abstract.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
