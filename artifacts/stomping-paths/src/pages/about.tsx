import { ExternalLink, Coffee, Heart, User, Sprout, Map } from "lucide-react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { useDocumentMeta } from "@/hooks/use-document-meta";

export function About() {
  useDocumentMeta({
    title: "About Bobbie Parr — The Stomping Paths",
    description:
      "Bobbie Parr is a permaculture practitioner who built The Stomping Paths to help families navigate the archive by zone, transformation, and the changes that actually matter.",
    ogTitle: "About Bobbie Parr — The Stomping Paths",
    ogDescription: "Permaculture practitioner. Zone framework guide. Bobbie built The Stomping Paths to make the archive work for real family life.",
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <img
            src={tspLogo}
            alt="The Stomping Paths Logo"
            className="w-32 h-32 md:w-48 md:h-48 rounded-2xl shadow-lg border-2 border-border mb-8"
          />
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            About Bobbie Parr
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-xl text-balance">
            Permaculture practitioner. Zone framework guide. Maker of The Stomping Paths.
          </p>
        </div>

        {/* Bio */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Her Story</span>
          </div>
          <div className="prose prose-stone dark:prose-invert max-w-none text-base md:text-lg leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground">
            <p>
              Bobbie Parr is a permaculture practitioner who has spent years working with families to map their lives through the zone model — from the kitchen table and the homestead all the way out to the broader community they're part of. Her approach is hands-on and grounded: less theory, more traction.
            </p>
            <p>
              She came to the zone framework not through a classroom but through lived practice — raising a family, working the land, and figuring out which changes actually hold. The zone model gave her a language for what she already knew: that lasting self-reliance is built from the inside out, one circle at a time.
            </p>
            <p>
              She built <strong>The Stomping Paths</strong> to give families a practical guide through the podcast archive — organized by zone, tagged by transformation, and oriented toward the episodes that move the needle rather than just fill the queue.
            </p>
          </div>
        </div>

        {/* What she built */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What She Built</span>
          </div>
          <ul className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
            <li className="flex items-start gap-3">
              <Sprout className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>A <strong className="text-foreground">zone-organized archive</strong> that maps thousands of episodes to the Zones 0–5 framework — so you start where you live, not where the algorithm drops you.</span>
            </li>
            <li className="flex items-start gap-3">
              <Sprout className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Transformation paths</strong> that cluster episodes around real-life goals — food security, financial independence, homestead skills, community resilience — so a listener pursuing change can follow a thread.</span>
            </li>
            <li className="flex items-start gap-3">
              <Sprout className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>A <strong className="text-foreground">practitioner directory</strong> connecting families with people doing this work in the real world — experts, local resources, and service providers grounded in the same values.</span>
            </li>
          </ul>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-secondary/50 border border-secondary border-b-4 rounded-xl p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-foreground">Support the Show</h3>
              <p className="text-sm text-muted-foreground mb-4">Keep The Stomping Paths independent, community-driven, and free to use.</p>
            </div>
            <a
              href="https://thestompingpaths.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Coffee className="w-4 h-4" /> Support the Work
            </a>
          </div>

          <div className="bg-secondary/50 border border-secondary border-b-4 rounded-xl p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-accent/20 text-accent-foreground rounded-full flex items-center justify-center">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-foreground">The Stomping Paths</h3>
              <p className="text-sm text-muted-foreground mb-4">The main site — community forums, resources, and everything Bobbie is building.</p>
            </div>
            <a
              href="https://thestompingpaths.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-card border border-border text-foreground font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-muted transition-colors mt-auto"
            >
              Visit the Site <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
