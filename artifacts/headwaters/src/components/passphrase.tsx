import { useState, useEffect, ReactNode } from "react";
import { useGetHeadwatersDashboard } from "@workspace/api-client-react";
import { setExtraHeadersGetter } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PassphraseGuard({ children }: { children: ReactNode }) {
  const [passphrase, setPassphrase] = useState(localStorage.getItem("hw-auth") || "");
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    setExtraHeadersGetter(() => ({
      "x-hw-passphrase": localStorage.getItem("hw-auth") ?? "",
    }));
    return () => setExtraHeadersGetter(null);
  }, []);

  const { error, isLoading, refetch } = useGetHeadwatersDashboard({
    query: { enabled: !!passphrase, retry: false } as any,
  });

  const isLocked = !passphrase || (error && (error as any)?.status === 401);

  useEffect(() => {
    if (passphrase) {
      localStorage.setItem("hw-auth", passphrase);
    } else {
      localStorage.removeItem("hw-auth");
    }
  }, [passphrase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassphrase(inputVal);
    localStorage.setItem("hw-auth", inputVal);
    setTimeout(() => refetch(), 10);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-serif">
        Unlocking journal...
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-sm border border-border">
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold text-foreground">Field Journal</h1>
            <p className="text-muted-foreground mt-2">Please enter your passphrase to continue.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Passphrase"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full font-mono text-center"
              autoFocus
            />
            <Button type="submit" className="w-full font-serif" disabled={!inputVal}>
              Unlock
            </Button>
            {error && passphrase && (
              <p className="text-destructive text-sm text-center">Incorrect passphrase.</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-destructive">
        <p>Error connecting to server.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
