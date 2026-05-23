import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCog } from "lucide-react";

export default function Settings() {
  const { name, setName, bio, setBio } = useProfile();
  const [draftName, setDraftName] = useState(name);
  const [draftBio, setDraftBio] = useState(bio);
  const { toast } = useToast();

  const isDirty = draftName.trim() !== name || draftBio.trim() !== bio;

  const handleSave = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      toast({ title: "Name required", description: "Please enter a display name.", variant: "destructive" });
      return;
    }
    setName(trimmedName);
    setBio(draftBio);
    setDraftName(trimmedName);
    setDraftBio(draftBio.trim());
    toast({ title: "Settings saved", description: "Your profile has been updated." });
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
            Your name and practice description appear in the sidebar and dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Your name"
              className="max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="practice-bio">Practice description</Label>
            <Textarea
              id="practice-bio"
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              placeholder="A short bio or tagline for your practice…"
              className="resize-none"
              rows={3}
              maxLength={280}
            />
            <p className="text-xs text-muted-foreground text-right">{draftBio.length}/280</p>
          </div>
          <Button onClick={handleSave} disabled={!isDirty || !draftName.trim()}>
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
