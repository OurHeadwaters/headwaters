import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCog } from "lucide-react";

export default function Settings() {
  const { name, setName } = useProfile();
  const [draft, setDraft] = useState(name);
  const { toast } = useToast();

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast({ title: "Name required", description: "Please enter a display name.", variant: "destructive" });
      return;
    }
    setName(trimmed);
    setDraft(trimmed);
    toast({ title: "Settings saved", description: `Your display name is now "${trimmed}".` });
  };

  return (
    <div className="max-w-xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your practitioner profile.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCog size={20} />
            Profile
          </CardTitle>
          <CardDescription>
            Your display name appears in the dashboard welcome message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Your name"
              className="max-w-sm"
            />
          </div>
          <Button onClick={handleSave} disabled={draft.trim() === name || !draft.trim()}>
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
