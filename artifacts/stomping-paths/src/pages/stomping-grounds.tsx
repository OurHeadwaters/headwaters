import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { StompingGroundsScene } from "@/components/stomping-grounds-scene";
import { WisdomDig } from "@/pages/wisdom-dig";
import { WishingWell } from "@/pages/wishing-well";
import { WorkshopBoard } from "@/pages/workshop";
import { FiresideChats } from "@/pages/fireside-chats";

type Tab = "grounds" | "wisdom" | "well" | "workshop" | "chats";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "grounds", label: "Grounds", emoji: "🏡" },
  { id: "wisdom", label: "Wisdom Dig", emoji: "💎" },
  { id: "well", label: "Wishing Well", emoji: "🪙" },
  { id: "workshop", label: "Workshop", emoji: "🔨" },
  { id: "chats", label: "Fireside Chats", emoji: "🔥" },
];

function WoodenTab({
  tab,
  isActive,
  onClick,
}: {
  tab: { id: string; label: string; emoji: string };
  isActive: boolean;
  onClick: () => void;
}) {
  const [swing, setSwing] = useState(false);
  const prevRef = useRef(isActive);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isActive && !prevRef.current) {
      setSwing(true);
      t = setTimeout(() => setSwing(false), 450);
    }
    prevRef.current = isActive;
    return () => { if (t !== undefined) clearTimeout(t); };
  }, [isActive]);

  return (
    <button
      onClick={onClick}
      className={`sg-wooden-tab relative flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A066]/60 ${
        isActive ? "sg-wooden-tab--active" : "sg-wooden-tab--inactive"
      } ${swing ? "sg-wooden-tab--swing" : ""}`}
    >
      <span className="leading-none">{tab.emoji}</span>
      <span className="font-serif tracking-wide">{tab.label}</span>
      {isActive && (
        <span
          className="absolute top-[6px] right-[8px] w-[5px] h-[5px] rounded-full bg-[#1A0D04]/70"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export default function StompingGroundsPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const [gordPhase, setGordPhase] = useState<"hidden" | "flying" | "done">("hidden");

  const params = new URLSearchParams(search);
  const rawTab = params.get("tab");
  const activeTab: Tab =
    rawTab === "wisdom" || rawTab === "well" || rawTab === "workshop" || rawTab === "chats"
      ? rawTab
      : "grounds";

  useEffect(() => {
    const t1 = setTimeout(() => setGordPhase("flying"), 700);
    const t2 = setTimeout(() => setGordPhase("done"), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

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
        /* ─── Existing ─── */
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

        /* ─── Lantern flicker ─── */
        @keyframes lantern-flicker {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 9px #D9A06699) drop-shadow(0 0 20px #D9A06644); }
          18% { opacity: 0.80; filter: drop-shadow(0 0 4px #D9A06655); }
          38% { opacity: 0.96; filter: drop-shadow(0 0 11px #D9A066aa); }
          58% { opacity: 0.86; filter: drop-shadow(0 0 6px #D9A06670); }
          78% { opacity: 0.98; filter: drop-shadow(0 0 13px #D9A066bb); }
        }
        @keyframes lantern-sway {
          0%, 100% { transform: rotate(-2deg); transform-origin: top center; }
          50% { transform: rotate(2deg); transform-origin: top center; }
        }

        /* ─── Wishing Well ─── */
        @keyframes water-ripple {
          0% { r: 3; opacity: 0.7; }
          100% { r: 14; opacity: 0; }
        }
        @keyframes coin-glint {
          0%, 75%, 100% { opacity: 0; transform: rotate(0deg) scale(0.5); }
          82% { opacity: 1; transform: rotate(18deg) scale(1.3); }
          92% { opacity: 0.25; transform: rotate(28deg) scale(0.7); }
        }

        /* ─── Trail ─── */
        @keyframes leaf-rustle {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(-4deg) translateX(-1px); }
          75% { transform: rotate(3.5deg) translateX(1px); }
        }

        /* ─── Water wheel ─── */
        @keyframes ww-creak {
          0%, 100% { transform: rotate(0deg); transform-origin: 60px 60px; }
          22% { transform: rotate(2deg); transform-origin: 60px 60px; }
          55% { transform: rotate(-1.5deg); transform-origin: 60px 60px; }
          80% { transform: rotate(1deg); transform-origin: 60px 60px; }
        }

        /* ─── Atmosphere ─── */
        @keyframes mist-drift {
          0% { transform: translateX(-4%) translateY(0%); opacity: 0.18; }
          45% { opacity: 0.32; }
          50% { transform: translateX(2%) translateY(-1.8%); opacity: 0.28; }
          100% { transform: translateX(-4%) translateY(0%); opacity: 0.18; }
        }
        @keyframes mist-drift2 {
          0% { transform: translateX(5%) translateY(0%); opacity: 0.12; }
          50% { transform: translateX(-3%) translateY(1.5%); opacity: 0.22; }
          100% { transform: translateX(5%) translateY(0%); opacity: 0.12; }
        }
        @keyframes firefly-float {
          0% { transform: translate(0px, 0px); opacity: 0; }
          12% { opacity: 0; }
          22% { opacity: 1; }
          50% { transform: translate(9px, -15px); opacity: 0.6; }
          80% { transform: translate(-6px, -7px); opacity: 0.85; }
          88% { opacity: 0; }
          100% { transform: translate(0px, 0px); opacity: 0; }
        }

        /* ─── Wooden tab bar ─── */
        @keyframes tab-swing {
          0% { transform: rotate(-2.5deg); transform-origin: top center; }
          55% { transform: rotate(1.2deg); transform-origin: top center; }
          100% { transform: rotate(0deg); transform-origin: top center; }
        }
        .sg-wooden-tab {
          font-family: Georgia, 'Times New Roman', serif;
        }
        .sg-wooden-tab--inactive {
          background: linear-gradient(172deg, #4A2E10 0%, #321E08 100%);
          border: 1.5px solid #5A3818;
          border-bottom: none;
          color: #8A6030;
          box-shadow: inset 0 1px 0 rgba(255,190,100,0.06);
        }
        .sg-wooden-tab--inactive:hover {
          background: linear-gradient(172deg, #5C3A18 0%, #3D2810 100%);
          color: #C4905A;
        }
        .sg-wooden-tab--active {
          background: linear-gradient(172deg, #7A5030 0%, #4A2E0E 40%, #1C3020 100%);
          border: 1.5px solid #9A6840;
          border-bottom-color: #1C3020;
          color: #F2CA8C;
          box-shadow: inset 0 1px 0 rgba(255,200,100,0.12), 0 -2px 10px rgba(0,0,0,0.35);
        }
        .sg-wooden-tab--swing {
          animation: tab-swing 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* ─── Drop tick ─── */
        @keyframes drop-tick {
          0% { transform: scale(1); }
          35% { transform: scale(1.45); }
          65% { transform: scale(0.87); }
          100% { transform: scale(1); }
        }
        .drop-tick-anim { animation: drop-tick 0.42s cubic-bezier(0.34, 1.56, 0.64, 1); }

        /* ─── Badge settle ─── */
        @keyframes badge-settle {
          0% { transform: scale(1); }
          30% { transform: scale(1.35); }
          65% { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        .badge-settle-anim { animation: badge-settle 0.48s cubic-bezier(0.34, 1.56, 0.64, 1); }

        /* ─── Trough sparkle ─── */
        @keyframes sparkle-burst {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          60% { opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes sweep-pulse {
          0%, 100% { box-shadow: 0 0 0 0 #D9A06644; }
          50% { box-shadow: 0 0 0 8px #D9A06622, 0 4px 18px #D9A06633; }
        }

        /* ─── Wood-burned heading ─── */
        .wood-burned-title {
          background: linear-gradient(135deg, #FFFDF4 0%, #F0D898 25%, #FFE8A8 55%, #DEBA60 80%, #F5D080 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 18px rgba(70,35,0,0.2));
        }

        /* ─── Plaque card hover ─── */
        @keyframes plaque-lift {
          to { transform: translateY(-3px); }
        }

        /* ─── Station header pattern: wood grain ─── */
        .sg-grain-bg {
          background-image: repeating-linear-gradient(
            92deg,
            rgba(255,255,255,0) 0px, rgba(255,255,255,0) 6px,
            rgba(255,255,255,0.03) 6px, rgba(255,255,255,0.03) 7px
          ), repeating-linear-gradient(
            88deg,
            rgba(0,0,0,0) 0px, rgba(0,0,0,0) 14px,
            rgba(0,0,0,0.06) 14px, rgba(0,0,0,0.06) 15px
          );
        }
      `}</style>

      <div className="min-h-screen bg-[#1C3020]">
        <div
          className="relative overflow-hidden border-b border-[#7A5030]/50"
          style={{ background: "linear-gradient(160deg, #1C3020 0%, #2C4A30 60%, #1A3528 100%)" }}
        >
          {/* Grain texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.10]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "180px 180px",
            }}
          />
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 30% 50%, #4A7A3A 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, #D9A066 0%, transparent 45%)",
            }}
          />

          {/* Gord fly-across */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <AnimatePresence>
              {gordPhase === "flying" && (
                <motion.div
                  key="gord-banner-fly"
                  className="absolute top-5"
                  initial={{ x: -90 }}
                  animate={{ x: "110vw" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.9, ease: [0.22, 0.1, 0.36, 1] }}
                >
                  <img src={`${import.meta.env.BASE_URL}gord.png`} alt="Gord" style={{ width: 46, height: 46, objectFit: "contain", transform: "scaleX(-1)", opacity: 0.9 }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="container mx-auto px-4 md:px-6 py-10 relative">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full text-[#D9A066] bg-[#D9A066]/15 border border-[#D9A066]/30">
              🏡 Interactive Action Hub
            </div>
            <h1 className="wood-burned-title font-serif text-4xl md:text-5xl font-bold mb-3 leading-tight">
              The Stomping Grounds
            </h1>
            <p className="text-white/65 max-w-xl leading-relaxed text-base">
              Your homestead hub. Wander between five stations — dig for wisdom, toss a coin,
              chart your transformation, let the water wheel earn, and gather round the fire circle.
            </p>
          </div>

          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="flex items-end gap-1.5">
              {TABS.map((tab) => (
                <WoodenTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => setTab(tab.id)}
                />
              ))}
            </div>
          </div>
        </div>

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
        {activeTab === "workshop" && (
          <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
            <WorkshopBoard />
          </div>
        )}
        {activeTab === "chats" && (
          <div className="min-h-screen">
            <FiresideChats />
          </div>
        )}
      </div>
    </>
  );
}
