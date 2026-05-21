import { useSearch, useLocation } from "wouter";
import { StompingGroundsScene } from "@/components/stomping-grounds-scene";
import { WisdomDig } from "@/pages/wisdom-dig";
import { WishingWell } from "@/pages/wishing-well";

type Tab = "grounds" | "wisdom" | "well";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "grounds", label: "Grounds", emoji: "🏡" },
  { id: "wisdom", label: "Wisdom Dig", emoji: "💎" },
  { id: "well", label: "Wishing Well", emoji: "🪙" },
];

export default function StompingGroundsPage() {
  const search = useSearch();
  const [, navigate] = useLocation();

  const params = new URLSearchParams(search);
  const rawTab = params.get("tab");
  const activeTab: Tab =
    rawTab === "wisdom" || rawTab === "well" ? rawTab : "grounds";

  function setTab(tab: Tab) {
    if (tab === "grounds") {
      navigate("/stomping-grounds");
    } else {
      navigate(`/stomping-grounds?tab=${tab}`);
    }
  }

  return (
    <>
      <style>{`
        @keyframes station-pulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 0.6; }
          50% { box-shadow: 0 0 0 12px transparent; opacity: 0; }
        }
        @keyframes ww-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sweep-ring {
          0% { opacity: 0.8; transform: scale(0.9); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes grounds-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div className="min-h-screen bg-[#1C3020]">
        {/* Hero banner */}
        <div
          className="relative overflow-hidden border-b border-white/10"
          style={{ background: "linear-gradient(160deg, #1C3020 0%, #2C4A30 60%, #1A3528 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 30% 50%, #4A7A3A 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, #D9A066 0%, transparent 45%)",
            }}
          />
          <div className="container mx-auto px-4 md:px-6 py-10 relative">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full text-[#D9A066] bg-[#D9A066]/15 border border-[#D9A066]/30">
              🏡 Interactive Action Hub
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              The Stomping Grounds
            </h1>
            <p className="text-white/65 max-w-xl leading-relaxed text-base">
              Your homestead hub. Wander between four stations — dig for wisdom, toss a coin,
              chart your transformation, and let the water wheel earn while you build.
            </p>
          </div>

          {/* Tab bar */}
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="flex items-end gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-[#1C3020] text-white border-t border-x border-white/15"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "grounds" && (
          <>
            <StompingGroundsScene />
            <div className="pb-16" />
          </>
        )}
        {activeTab === "wisdom" && (
          <div className="bg-background min-h-screen">
            <WisdomDig />
          </div>
        )}
        {activeTab === "well" && (
          <div className="bg-background min-h-screen">
            <WishingWell />
          </div>
        )}
      </div>
    </>
  );
}
