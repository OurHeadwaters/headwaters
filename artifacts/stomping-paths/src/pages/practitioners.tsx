import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Globe, Mail, Shovel, ChevronRight, Loader2, Users } from "lucide-react";

interface Practitioner {
  id: number;
  slug: string;
  name: string;
  location: string;
  region: string | null;
  bio: string;
  specialties: string[];
  doesLandSurveys: boolean;
  contactUrl: string | null;
  contactEmail: string | null;
  photoUrl: string | null;
  websiteUrl: string | null;
}

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

function usePractitioners(surveysOnly: boolean) {
  const [data, setData] = useState<Practitioner[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  if (!loaded && !loading) {
    setLoading(true);
    const url = surveysOnly
      ? apiUrl("/practitioners?surveys=true")
      : apiUrl("/practitioners");
    fetch(url)
      .then((r) => r.json())
      .then((d: { practitioners: Practitioner[] }) => {
        setData(d.practitioners);
        setLoading(false);
        setLoaded(true);
      })
      .catch(() => {
        setError("Failed to load practitioners.");
        setLoading(false);
        setLoaded(true);
      });
  }

  return { data, loading, error };
}

function PractitionerCard({ p }: { p: Practitioner }) {
  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
    >
      <div className="flex items-start gap-4">
        {p.photoUrl ? (
          <img
            src={p.photoUrl}
            alt={p.name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid #4A7A3A44" }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold font-serif"
            style={{ background: "#4A7A3A22", border: "2px solid #4A7A3A44", color: "#4A7A3A" }}
          >
            {p.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl font-bold mb-1" style={{ color: "#FDFBF7" }}>
            {p.name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "#8AAB82" }}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{p.location}</span>
          </div>
        </div>
      </div>

      {p.doesLandSurveys && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#4A7A3A18", border: "1px solid #4A7A3A44", color: "#8BAD78" }}
        >
          <Shovel className="w-4 h-4" />
          Does land surveys
        </div>
      )}

      <p className="text-sm leading-relaxed" style={{ color: "#C8D4C0" }}>
        {p.bio}
      </p>

      {p.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {p.specialties.map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#4A7A3A14", color: "#8BAD78", border: "1px solid #4A7A3A33" }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {p.contactUrl && (
          <a
            href={p.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#4A7A3A", color: "#FDFBF7" }}
          >
            Contact
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        )}
        {p.websiteUrl && (
          <a
            href={p.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "#C8D4C0", border: "1px solid #4A7A3A33" }}
          >
            <Globe className="w-3.5 h-3.5" />
            Website
          </a>
        )}
        {p.contactEmail && !p.contactUrl && (
          <a
            href={`mailto:${p.contactEmail}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#4A7A3A", color: "#FDFBF7" }}
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
        )}
      </div>
    </div>
  );
}

export default function PractitionersPage() {
  const [surveysOnly, setSurveysOnly] = useState(false);
  const { data, loading, error } = usePractitioners(surveysOnly);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0A180A 0%, #12241A 60%, #1A2C18 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 30%, #4A7A3A44 0%, transparent 60%), radial-gradient(circle at 20% 80%, #2C5F2E33 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5" style={{ color: "#4A7A3A" }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#4A7A3A" }}
              >
                Practitioner Registry
              </span>
            </div>
            <h1
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{ color: "#FDFBF7" }}
            >
              Find a permaculture practitioner
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-4 max-w-2xl" style={{ color: "#C8D4C0" }}>
              These are vetted practitioners in the Stomping Path community. Many offer land surveys
              — an on-site assessment of your property using the zone framework — so you can see
              where you actually stand before you start building.
            </p>
            <p className="text-base leading-relaxed max-w-2xl" style={{ color: "#8AAB82" }}>
              To get placed on the Lifestyle Map without an on-site visit,{" "}
              <Link href="/headwaters" className="underline underline-offset-2" style={{ color: "#4A7A3A" }}>
                Headwaters intake
              </Link>{" "}
              uses our online tool and is handled by Bobbie.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-5xl">
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-10">
          <button
            onClick={() => setSurveysOnly(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: !surveysOnly ? "#4A7A3A" : "transparent",
              color: !surveysOnly ? "#FDFBF7" : "#C8D4C0",
              border: "1px solid #4A7A3A44",
            }}
          >
            All practitioners
          </button>
          <button
            onClick={() => setSurveysOnly(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: surveysOnly ? "#4A7A3A" : "transparent",
              color: surveysOnly ? "#FDFBF7" : "#C8D4C0",
              border: "1px solid #4A7A3A44",
            }}
          >
            <Shovel className="w-3.5 h-3.5" />
            Land surveys only
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4A7A3A" }} />
          </div>
        )}

        {error && (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "#3A0A0A", border: "1px solid #F5A0A033", color: "#F5A0A0" }}
          >
            {error}
          </div>
        )}

        {!loading && !error && data && data.length === 0 && (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
          >
            <Users className="w-10 h-10 mx-auto mb-4 opacity-30" style={{ color: "#4A7A3A" }} />
            <h3 className="font-serif text-xl font-bold mb-2" style={{ color: "#FDFBF7" }}>
              {surveysOnly ? "No land survey practitioners listed yet" : "No practitioners listed yet"}
            </h3>
            <p className="text-sm" style={{ color: "#8AAB82" }}>
              The registry is being built. Check back soon.
            </p>
          </div>
        )}

        {!loading && !error && data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.map((p) => (
              <PractitionerCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* CTA — be listed */}
        <div
          className="mt-16 rounded-2xl border p-8 md:p-10 text-center"
          style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
        >
          <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: "#FDFBF7" }}>
            Are you a practitioner?
          </h2>
          <p className="text-base leading-relaxed mb-6 max-w-xl mx-auto" style={{ color: "#C8D4C0" }}>
            If you're doing permaculture design, land surveys, or zone placements in your
            community and want to be listed in the registry, reach out via the Council.
          </p>
          <Link
            href="/council"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90"
            style={{ background: "#4A7A3A", color: "#FDFBF7" }}
          >
            Visit the Council
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
