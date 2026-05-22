import { useState } from "react";
import { useListHeadwatersClients } from "@workspace/api-client-react";
import { getHwHeaders, getRiskProfileLabel, getZoneLabel } from "@/lib/api-utils";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle, ArrowRight, Activity } from "lucide-react";
import { format } from "date-fns";

export default function ClientsList() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading, error } = useListHeadwatersClients({
    request: getHwHeaders()
  });

  const filteredClients = clients?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading clients...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Failed to load clients.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your active and past clients.</p>
        </div>
        <Link href="/clients/new" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors">
          <PlusCircle size={18} />
          New Client
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search by name or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md bg-card/50 backdrop-blur-sm"
        />
      </div>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 font-medium text-muted-foreground">Name</th>
                <th className="p-4 font-medium text-muted-foreground">Placement</th>
                <th className="p-4 font-medium text-muted-foreground">Risk Profile</th>
                <th className="p-4 font-medium text-muted-foreground">Last Updated</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                    No clients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.clientId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{client.name}</div>
                      {client.email && <div className="text-xs text-muted-foreground">{client.email}</div>}
                    </td>
                    <td className="p-4">
                      {client.primaryZone ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {getZoneLabel(client.primaryZone)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Unplaced</span>
                      )}
                    </td>
                    <td className="p-4">
                      {client.riskProfile ? (
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-muted-foreground" />
                          <span className="text-sm font-medium">{client.riskProfile} - {getRiskProfileLabel(client.riskProfile)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {client.lastPushedAt ? format(new Date(client.lastPushedAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link href={`/intake/${client.clientId}`} className="inline-flex items-center justify-center gap-1 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md font-medium transition-colors">
                        Re-intake
                      </Link>
                      <Link href={`/clients/${client.clientId}`} className="inline-flex items-center justify-center gap-1 text-sm text-primary hover:underline px-3 py-1.5 font-medium transition-colors">
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
