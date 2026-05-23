import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Home, Users, PlusCircle, Briefcase, ChevronDown, ChevronRight, DollarSign, NotebookPen, ListOrdered, Settings, ClipboardList } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isBusinessActive = location.startsWith("/business");
  const [businessOpen, setBusinessOpen] = useState(isBusinessActive);
  const { name, bio } = useProfile();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/submissions", label: "Submissions", icon: ClipboardList },
  ];

  const businessSubItems = [
    { href: "/business/priorities", label: "Priorities", icon: ListOrdered },
    { href: "/business/financials", label: "Financials", icon: DollarSign },
    { href: "/business/notes", label: "Notes", icon: NotebookPen },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">Headwaters</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono uppercase tracking-wider">Field Journal</p>
          {(name || bio) && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-sm font-medium text-foreground leading-snug">{name}</p>
              {bio && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{bio}</p>
              )}
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Business section with collapsible sub-nav */}
          <div>
            <button
              onClick={() => setBusinessOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isBusinessActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Briefcase size={18} />
              <span className="flex-1 text-left">Business</span>
              {businessOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>

            {businessOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-border space-y-1">
                {businessSubItems.map((sub) => {
                  const isActive = location === sub.href || location.startsWith(sub.href);
                  const Icon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon size={15} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border space-y-1">
            <Link
              href="/clients/new"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-primary hover:bg-primary/5 transition-colors font-medium"
            >
              <PlusCircle size={18} />
              <span>New Client</span>
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                location === "/settings"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              localStorage.removeItem("hw-auth");
              window.location.reload();
            }}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={18} />
            <span>Lock Journal</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
