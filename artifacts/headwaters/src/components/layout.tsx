import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Home, Users, PlusCircle } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/clients", label: "Clients", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">Headwaters</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono uppercase tracking-wider">Field Journal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
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
          
          <div className="pt-4 mt-4 border-t border-border">
            <Link
              href="/clients/new"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-primary hover:bg-primary/5 transition-colors font-medium"
            >
              <PlusCircle size={18} />
              <span>New Client</span>
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
