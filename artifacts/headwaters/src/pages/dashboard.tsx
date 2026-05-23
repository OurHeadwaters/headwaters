import { useGetHeadwatersDashboard } from "@workspace/api-client-react";
import { getHwHeaders, getZoneLabel } from "@/lib/api-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlusCircle, Users, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useGetHeadwatersDashboard({
    request: getHwHeaders()
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading journal...</div>;
  if (error || !dashboard) return <div className="p-8 text-center text-destructive">Failed to load dashboard.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back, Bobbie. Here is the current state of your practice.</p>
        </div>
        <Link href="/clients/new" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors">
          <PlusCircle size={18} />
          New Intake
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users size={16} />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold text-foreground">{dashboard.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-semibold border-b border-border pb-2">Recent Intakes</h2>
          {dashboard.recentIntakes.length === 0 ? (
            <p className="text-muted-foreground italic">No recent intakes.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.recentIntakes.map(client => (
                <Card key={client.clientId} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {client.lastPushedAt ? `Last active ${format(new Date(client.lastPushedAt), 'MMM d, yyyy')}` : 'No intakes yet'}
                      </p>
                    </div>
                    <Link href={`/clients/${client.clientId}`} className="text-sm text-primary hover:underline font-medium">
                      View details &rarr;
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-serif font-semibold border-b border-border pb-2">Zone Distribution</h2>
          <Card>
            <CardContent className="p-6">
              {dashboard.zoneDistribution.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-4">No zone data available.</p>
              ) : (
                <div className="space-y-4">
                  {dashboard.zoneDistribution.map(({ zone, count }) => (
                    <div key={zone} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{getZoneLabel(zone)}</div>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${Math.max(5, (count / dashboard.totalClients) * 100)}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm text-muted-foreground">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
