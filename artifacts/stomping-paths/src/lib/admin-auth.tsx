import { Lock } from "lucide-react";

export interface AuthUserResponse {
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null } | null;
}

export interface AdminCheckResponse {
  isAdmin: boolean;
  authenticated: boolean;
}

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export async function fetchAuthUser(): Promise<AuthUserResponse> {
  const res = await fetch(apiUrl("/auth/user"));
  if (!res.ok) return { user: null };
  return res.json();
}

export async function fetchAdminCheck(): Promise<AdminCheckResponse> {
  const res = await fetch(apiUrl("/auth/is-admin"));
  if (!res.ok) return { isAdmin: false, authenticated: false };
  return res.json();
}

export function AdminLoginWall({ returnTo }: { returnTo: string }) {
  const loginUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-md text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-muted">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h1 className="font-serif text-2xl font-bold text-foreground mb-3">Sign in required</h1>
      <p className="text-muted-foreground mb-8">
        You need to be signed in with an authorized account to access this admin page.
      </p>
      <a
        href={loginUrl}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Sign in to continue
      </a>
    </div>
  );
}

export function AdminForbiddenWall() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-md text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-muted">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
      </div>
      <h1 className="font-serif text-2xl font-bold text-foreground mb-3">Access denied</h1>
      <p className="text-muted-foreground mb-4">
        Your account is not authorized to access the admin area.
      </p>
      <p className="text-sm text-muted-foreground">
        If you believe this is an error, contact the site administrator.
      </p>
    </div>
  );
}
