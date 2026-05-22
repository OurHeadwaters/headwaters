import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetHeadwatersClient, usePatchHeadwatersClient } from "@workspace/api-client-react";
import { getRiskProfileLabel, getZoneLabel } from "@/lib/api-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit3, Activity, Map, Calendar, Mail, User, Settings2 } from "lucide-react";
import { format } from "date-fns";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:clientId");
  const clientId = params?.clientId || "";
  const { toast } = useToast();

  const { data: client, isLoading, error, refetch } = useGetHeadwatersClient(clientId, {
    query: { enabled: !!clientId } as any,
  });

  const patchClient = usePatchHeadwatersClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editConnectedUserId, setEditConnectedUserId] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const openEditDialog = () => {
    if (client) {
      setEditName(client.name);
      setEditEmail(client.email || "");
      setEditConnectedUserId(client.connectedUserId || "");
      setEditNotes(client.notes || "");
      setIsEditOpen(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    patchClient.mutate(
      {
        clientId,
        data: {
          name: editName,
          email: editEmail || null,
          connectedUserId: editConnectedUserId || null,
          notes: editNotes || null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Client updated successfully" });
          setIsEditOpen(false);
          refetch();
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading client...</div>;
  if (error || !client) return <div className="p-8 text-center text-destructive">Failed to load client details.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <Link href="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to clients
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-4xl font-bold text-foreground">{client.name}</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={openEditDialog}>
              <Settings2 size={16} />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            {client.email && (
              <span className="flex items-center gap-1"><Mail size={14} /> {client.email}</span>
            )}
            {client.connectedUserId && (
              <span className="flex items-center gap-1"><User size={14} /> TSP ID: {client.connectedUserId}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Client since {format(new Date(client.createdAt), "MMM yyyy")}
            </span>
          </div>
        </div>
        <Link href={`/intake/${client.clientId}`} className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors">
          <Edit3 size={16} />
          Re-intake
        </Link>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Client Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tsp">TSP ID</Label>
                <Input id="edit-tsp" value={editConnectedUserId} onChange={(e) => setEditConnectedUserId(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Permanent Notes</Label>
              <Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={patchClient.isPending}>
                {patchClient.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <Map size={18} className="text-primary" /> Current Placement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.primaryZone ? (
              <>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Primary Zone</div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-base px-3 py-1">
                    {getZoneLabel(client.primaryZone)}
                  </Badge>
                </div>
                {client.secondaryZone && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Secondary Zone</div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {getZoneLabel(client.secondaryZone)}
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground italic">No placement recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <Activity size={18} className="text-primary" /> Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.riskProfile ? (
              <div className="flex flex-col gap-2">
                <div className="text-3xl font-serif font-bold text-foreground">Level {client.riskProfile}</div>
                <div className="text-lg font-medium text-primary">{getRiskProfileLabel(client.riskProfile)}</div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No risk profile assessed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-serif">Practitioner Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {client.notes ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {client.notes}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No permanent notes.</p>
          )}
        </CardContent>
      </Card>

      {client.lastDump && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center justify-between">
              <span>Last Session Brain Dump</span>
              <span className="text-sm font-sans font-normal text-muted-foreground">
                {client.lastPushedAt && format(new Date(client.lastPushedAt), "MMM d, yyyy h:mm a")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed border border-border/50">
              {client.lastDump}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
