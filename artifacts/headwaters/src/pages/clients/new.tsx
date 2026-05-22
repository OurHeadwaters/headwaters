import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateHeadwatersClient } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NewClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createClient = useCreateHeadwatersClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [connectedUserId, setConnectedUserId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createClient.mutate(
      {
        data: {
          name,
          email: email || undefined,
          connectedUserId: connectedUserId || undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: (client) => {
          toast({ title: "Client created successfully" });
          setLocation(`/intake/${client.clientId}`);
        },
        onError: (err: any) => {
          toast({ title: "Error creating client", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link href="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to clients
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">New Client</h1>
        <p className="text-muted-foreground mt-1">Add a new client to your field journal.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background"
                placeholder="Jane Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tspId" className="text-foreground">TSP User ID (Optional)</Label>
                <Input
                  id="tspId"
                  value={connectedUserId}
                  onChange={(e) => setConnectedUserId(e.target.value)}
                  className="bg-background"
                  placeholder="e.g. 12345"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground">Initial Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background min-h-[120px]"
                placeholder="Any context before the first intake..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link href="/clients">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createClient.isPending || !name.trim()}>
                {createClient.isPending ? "Saving..." : "Create & Begin Intake"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
