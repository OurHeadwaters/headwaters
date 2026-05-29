import React, { useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/components/Nav";
import EmberBackground from "@/components/EmberBackground";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const LAYERS = [
  {
    id: "aquifer",
    tag: "BTC",
    label: "The Aquifer",
    sublabel: "Bitcoin · Zone 1",
    desc: "Sound money. No issuer. Maximum decentralization. Held cold, touched rarely. The reserve that doesn't move unless you choose.",
    color: "#C07840",
    border: "rgba(192,120,64,0.4)",
    bg: "rgba(192,120,64,0.06)",
    dot: "#C07840",
  },
  {
    id: "membrane",
    tag: "XRP",
    label: "The Membrane",
    sublabel: "XRPL · RLUSD · Zone 3",
    desc: "The crossing rail. Fast settlement, stable unit, community payment infrastructure. Moves the float — not the reserve.",
    color: "#2A8A9A",
    border: "rgba(42,138,154,0.4)",
    bg: "rgba(42,138,154,0.06)",
    dot: "#2A8A9A",
  },
  {
    id: "market",
    tag: "807",
    label: "The Market",
    sublabel: "Community Tokens · Zone 4",
    desc: "A co-op issues its own credit. Members hold it, spend it locally, trade it against RLUSD. The co-op is the trust anchor — not a platform.",
    color: "#4A8C5C",
    border: "rgba(74,140,92,0.4)",
    bg: "rgba(74,140,92,0.06)",
    dot: "#4A8C5C",
  },
  {
    id: "shore",
    tag: "CAD",
    label: "The Shore",
    sublabel: "Fiat · Zone 0",
    desc: "Where the watershed meets the state system. Fiat conversion for bills, taxes, and the world as it currently is.",
    color: "#8A7A66",
    border: "rgba(138,122,102,0.4)",
    bg: "rgba(138,122,102,0.06)",
    dot: "#8A7A66",
  },
];

type KeyState = {
  status: "idle" | "generating" | "revealed" | "confirmed";
  value: string;
  revealed: boolean;
  checked: boolean;
};

const initKey = (): KeyState => ({
  status: "idle",
  value: "",
  revealed: false,
  checked: false,
});

type MachineState = {
  income: string;
  reserveTarget: string;
  reserveCurrent: string;
  costBasis: number;
  reserve: number;
  reinvestment: number;
  eaveFlow: number;
};

const initMachine = (): MachineState => ({
  income: "",
  reserveTarget: "",
  reserveCurrent: "",
  costBasis: 60,
  reserve: 20,
  reinvestment: 15,
  eaveFlow: 5,
});

function pct(income: number, p: number): string {
  if (!income) return "—";
  return "$" + Math.round((income * p) / 100).toLocaleString();
}

export default function Workbench() {
  const [btc, setBtc] = useState<KeyState>(initKey());
  const [xrpl, setXrpl] = useState<KeyState>(initKey());
  const [machine, setMachine] = useState<MachineState>(initMachine());
  const [stackOpen, setStackOpen] = useState(true);

  const incomeNum = parseFloat(machine.income) || 0;
  const reserveTargetNum = parseFloat(machine.reserveTarget) || 0;
  const reserveCurrentNum = parseFloat(machine.reserveCurrent) || 0;
  const reserveFull = reserveTargetNum > 0 && reserveCurrentNum >= reserveTargetNum;
  const pctSum = machine.costBasis + machine.reserve + machine.reinvestment + machine.eaveFlow;

  const generateBTC = useCallback(async () => {
    setBtc((s) => ({ ...s, status: "generating" }));
    try {
      const { generateMnemonic } = await import("bip39");
      const mnemonic = generateMnemonic();
      setBtc({ status: "revealed", value: mnemonic, revealed: false, checked: false });
    } catch {
      setBtc((s) => ({ ...s, status: "idle" }));
    }
  }, []);

  const generateXRPL = useCallback(async () => {
    setXrpl((s) => ({ ...s, status: "generating" }));
    try {
      const { Wallet } = await import("xrpl");
      const wallet = Wallet.generate();
      setXrpl({
        status: "revealed",
        value: `${wallet.address}|||${wallet.seed}`,
        revealed: false,
        checked: false,
      });
    } catch {
      setXrpl((s) => ({ ...s, status: "idle" }));
    }
  }, []);

  const xrplAddress = xrpl.value.split("|||")[0] ?? "";
  const xrplSeed = xrpl.value.split("|||")[1] ?? "";

  function BucketRow({
    label,
    sublabel,
    pctKey,
    color,
    locked,
  }: {
    label: string;
    sublabel: string;
    pctKey: keyof Pick<MachineState, "costBasis" | "reserve" | "reinvestment" | "eaveFlow">;
    color: string;
    locked?: boolean;
  }) {
    const val = machine[pctKey] as number;
    return (
      <div
        className={`rounded-xl border px-5 py-4 transition-all duration-300 ${
          locked
            ? "opacity-40 border-white/10 bg-white/3"
            : "border-white/15 bg-white/5"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {locked ? (
                <Lock className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              ) : (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              )}
              <span className="text-sm font-semibold text-white/90">{label}</span>
              {locked && (
                <span className="text-[10px] uppercase tracking-widest text-amber-400/70 font-bold ml-1">
                  Locked
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 ml-4">{sublabel}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="number"
              min={0}
              max={100}
              value={val}
              disabled={locked}
              onChange={(e) =>
                setMachine((m) => ({ ...m, [pctKey]: Math.max(0, Math.min(100, +e.target.value)) }))
              }
              className="w-16 text-right bg-white/8 border border-white/15 rounded-md px-2 py-1 text-sm text-white/90 disabled:opacity-40 focus:outline-none focus:border-white/30"
            />
            <span className="text-xs text-white/40 w-3">%</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 mr-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              animate={{ width: `${Math.min(100, val)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm font-mono font-medium" style={{ color: locked ? "#666" : color }}>
            {pct(incomeNum, val)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: "#070F07" }}>
      <EmberBackground />
      <Nav />

      {/* Hero */}
      <section className="relative w-full pt-32 pb-16 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(42,138,154,0.07) 0%, transparent 70%)" }} />
        <motion.div
          className="relative z-10 max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeIn} className="flex justify-center mb-4">
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
              style={{ color: "#2A8A9A", borderColor: "rgba(42,138,154,0.3)", background: "rgba(42,138,154,0.08)" }}>
              Zone 3 · The Workbench · Crypto Castle
            </span>
          </motion.div>
          <motion.h1 variants={fadeIn}
            className="text-5xl md:text-6xl font-serif font-medium text-white/95 leading-tight tracking-tight mb-5">
            The{" "}
            <span style={{
              background: "linear-gradient(135deg, #2A8A9A 0%, #5ABCCC 50%, #1A6A7A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Workbench
            </span>
          </motion.h1>
          <motion.p variants={fadeIn} className="text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
            Two chains. Different jobs. One layered architecture. Generate your first keys,
            understand the stack, and calibrate The Machine to your household.
          </motion.p>
        </motion.div>
      </section>

      {/* Stack Map */}
      <section className="relative z-10 max-w-3xl mx-auto w-full px-6 pb-16">
        <button
          onClick={() => setStackOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-white/10 bg-white/4 hover:bg-white/6 transition-colors mb-2"
        >
          <span className="text-sm font-semibold text-white/70 uppercase tracking-widest">
            The Stack — how the layers fit
          </span>
          {stackOpen ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {stackOpen && (
            <motion.div
              key="stack"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-0">
                {LAYERS.map((layer, i) => (
                  <div key={layer.id} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-4"
                        style={{ borderColor: layer.color, background: layer.bg }}>
                        <span className="text-[9px] font-bold tracking-wide" style={{ color: layer.color }}>
                          {layer.tag}
                        </span>
                      </div>
                      {i < LAYERS.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ background: `linear-gradient(${layer.color}66, ${LAYERS[i + 1].color}44)` }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4 pt-3 pr-2">
                      <p className="text-sm font-semibold text-white/90">{layer.label}</p>
                      <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: layer.color }}>
                        {layer.sublabel}
                      </p>
                      <p className="text-sm text-white/50 leading-relaxed">{layer.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Key Ceremonies */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-6 pb-20">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-widest text-white/35 mb-1">Key Ceremonies</p>
          <h2 className="text-2xl font-serif text-white/90">Generate your first keys</h2>
          <p className="text-sm text-white/45 mt-1">
            Both generated locally in your browser. Nothing is transmitted. Write on paper. No photos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Bitcoin Mnemonic */}
          <KeyCeremony
            title="The Aquifer"
            tag="Bitcoin · Zone 1"
            tagColor="#C07840"
            border="rgba(192,120,64,0.25)"
            bg="rgba(192,120,64,0.04)"
            description="A 12-word seed phrase is your Bitcoin master key. Whoever holds these words controls the address. Write them in order, store offline."
            status={btc.status}
            onGenerate={generateBTC}
            revealed={btc.revealed}
            onReveal={() => setBtc((s) => ({ ...s, revealed: true }))}
            onHide={() => setBtc((s) => ({ ...s, revealed: false }))}
            checked={btc.checked}
            onCheck={() => setBtc((s) => ({ ...s, checked: true, status: "confirmed" }))}
            onReset={() => setBtc(initKey())}
            renderSecret={() => (
              <div className="grid grid-cols-3 gap-2">
                {btc.value.split(" ").map((word, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-black/30 rounded px-2 py-1.5">
                    <span className="text-[10px] text-white/30 w-4 text-right shrink-0">{i + 1}.</span>
                    <span className="text-sm font-mono text-white/90">{word}</span>
                  </div>
                ))}
              </div>
            )}
            confirmedContent={
              <p className="text-xs text-white/50 leading-relaxed">
                Seed phrase confirmed. Your keys are yours. This address is Zone 1 — it never appears
                in a Zone 3 transaction.
              </p>
            }
            generateLabel="Generate Bitcoin seed phrase"
          />

          {/* XRPL Wallet */}
          <KeyCeremony
            title="The Membrane"
            tag="XRPL · Zone 3"
            tagColor="#2A8A9A"
            border="rgba(42,138,154,0.25)"
            bg="rgba(42,138,154,0.04)"
            description="Your XRPL classic address (starts with r) and its secret seed (starts with s). The seed controls the address. Write both, store offline, separately from your Bitcoin seed."
            status={xrpl.status}
            onGenerate={generateXRPL}
            revealed={xrpl.revealed}
            onReveal={() => setXrpl((s) => ({ ...s, revealed: true }))}
            onHide={() => setXrpl((s) => ({ ...s, revealed: false }))}
            checked={xrpl.checked}
            onCheck={() => setXrpl((s) => ({ ...s, checked: true, status: "confirmed" }))}
            onReset={() => setXrpl(initKey())}
            renderSecret={() => (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Classic Address</p>
                  <div className="bg-black/30 rounded px-3 py-2 font-mono text-sm text-white/90 break-all">
                    {xrplAddress}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Secret Seed</p>
                  <div className="bg-black/30 rounded px-3 py-2 font-mono text-sm text-white/90 break-all">
                    {xrplSeed}
                  </div>
                </div>
              </div>
            )}
            confirmedContent={
              <div className="space-y-2">
                <p className="text-xs text-white/50 leading-relaxed">
                  Wallet confirmed. This address is Zone 3. It never appears in the same transaction
                  as your Zone 1 Bitcoin address — the Eave Rule.
                </p>
                <div className="flex items-start gap-2 bg-amber-400/8 border border-amber-400/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400/70 leading-snug">
                    Fund this address with at least 10 XRP (reserve requirement) before using it on the network.
                  </p>
                </div>
              </div>
            }
            generateLabel="Generate XRPL wallet"
          />
        </div>
      </section>

      {/* The Machine */}
      <section className="relative z-10 max-w-3xl mx-auto w-full px-6 pb-24">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-widest text-white/35 mb-1">The Machine</p>
          <h2 className="text-2xl font-serif text-white/90">Four sequenced buckets</h2>
          <p className="text-sm text-white/45 mt-2 leading-relaxed max-w-xl">
            Cost Basis → Reserve → Reinvestment → Eave Flow. Eave Flow only activates when the
            first three are funded and the Reserve is full. The Honey Principle: you don't take
            from inside the comb.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-6 space-y-6">
          {/* Income + Reserve inputs */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                Monthly income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={machine.income}
                  onChange={(e) => setMachine((m) => ({ ...m, income: e.target.value }))}
                  className="w-full bg-white/6 border border-white/15 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                Reserve target
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 15000"
                  value={machine.reserveTarget}
                  onChange={(e) => setMachine((m) => ({ ...m, reserveTarget: e.target.value }))}
                  className="w-full bg-white/6 border border-white/15 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
                Reserve current
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 3200"
                  value={machine.reserveCurrent}
                  onChange={(e) => setMachine((m) => ({ ...m, reserveCurrent: e.target.value }))}
                  className="w-full bg-white/6 border border-white/15 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Reserve progress */}
          {reserveTargetNum > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Reserve progress</span>
                <span className={reserveFull ? "text-green-400" : "text-amber-400"}>
                  {reserveFull ? (
                    <span className="flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Full — Eave Flow active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {Math.round((reserveCurrentNum / reserveTargetNum) * 100)}% — Eave Flow locked
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: reserveFull ? "#4A8C5C" : "#D9A066" }}
                  animate={{ width: `${Math.min(100, (reserveCurrentNum / reserveTargetNum) * 100)}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          )}

          {/* Allocation rows */}
          <div className="space-y-3">
            <BucketRow label="Cost Basis" sublabel="Necessities — bills, food, shelter" pctKey="costBasis" color="#8A7A66" />
            <BucketRow label="Reserve" sublabel="Emergency fund — 3–6 months of Cost Basis" pctKey="reserve" color="#D9A066" />
            <BucketRow label="Reinvestment" sublabel="Tools, land, production capacity, skills" pctKey="reinvestment" color="#2A8A9A" />
            <BucketRow label="Eave Flow" sublabel="Outward — community, giving, the watershed" pctKey="eaveFlow" color="#4A8C5C" locked={!reserveFull} />
          </div>

          {/* Sum warning */}
          {pctSum !== 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-amber-400/80"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Allocations total {pctSum}% — adjust to reach 100%.
            </motion.div>
          )}

          {/* Summary row */}
          {incomeNum > 0 && pctSum === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 border-t border-white/8"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Cost Basis", val: pct(incomeNum, machine.costBasis), color: "#8A7A66" },
                  { label: "Reserve", val: pct(incomeNum, machine.reserve), color: "#D9A066" },
                  { label: "Reinvestment", val: pct(incomeNum, machine.reinvestment), color: "#2A8A9A" },
                  { label: "Eave Flow", val: reserveFull ? pct(incomeNum, machine.eaveFlow) : "Locked", color: reserveFull ? "#4A8C5C" : "#444" },
                ].map((b) => (
                  <div key={b.label} className="text-center">
                    <p className="text-[10px] uppercase tracking-widest text-white/35 mb-0.5">{b.label}</p>
                    <p className="text-lg font-mono font-semibold" style={{ color: b.color }}>{b.val}</p>
                    <p className="text-[10px] text-white/25">/ month</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Back */}
        <div className="mt-12 flex justify-center">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white/60 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back to the Forge
            </span>
          </Link>
        </div>
      </section>
    </div>
  );

  function BucketRow({
    label,
    sublabel,
    pctKey,
    color,
    locked,
  }: {
    label: string;
    sublabel: string;
    pctKey: keyof Pick<MachineState, "costBasis" | "reserve" | "reinvestment" | "eaveFlow">;
    color: string;
    locked?: boolean;
  }) {
    const val = machine[pctKey] as number;
    return (
      <div
        className={`rounded-xl border px-5 py-4 transition-all duration-300 ${
          locked ? "opacity-40 border-white/8" : "border-white/12"
        }`}
        style={{ background: locked ? "transparent" : "rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {locked ? (
                <Lock className="w-3.5 h-3.5 shrink-0 text-white/20" />
              ) : (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              )}
              <span className="text-sm font-semibold text-white/80">{label}</span>
              {locked && (
                <span className="text-[9px] uppercase tracking-widest font-bold ml-1"
                  style={{ color: "#D9A066" }}>
                  Locked
                </span>
              )}
            </div>
            <p className="text-xs text-white/35 ml-4">{sublabel}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min={0}
              max={100}
              value={val}
              disabled={locked}
              onChange={(e) =>
                setMachine((m) => ({ ...m, [pctKey]: Math.max(0, Math.min(100, +e.target.value)) }))
              }
              className="w-14 text-right bg-white/6 border border-white/12 rounded-md px-2 py-1 text-sm text-white/85 disabled:opacity-30 focus:outline-none focus:border-white/25"
            />
            <span className="text-xs text-white/35 w-3">%</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: locked ? "#333" : color }}
              animate={{ width: `${Math.min(100, val)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm font-mono font-medium w-16 text-right"
            style={{ color: locked ? "#444" : color }}>
            {pct(incomeNum, val)}
          </span>
        </div>
      </div>
    );
  }
}

function KeyCeremony({
  title,
  tag,
  tagColor,
  border,
  bg,
  description,
  status,
  onGenerate,
  revealed,
  onReveal,
  onHide,
  checked,
  onCheck,
  onReset,
  renderSecret,
  confirmedContent,
  generateLabel,
}: {
  title: string;
  tag: string;
  tagColor: string;
  border: string;
  bg: string;
  description: string;
  status: KeyState["status"];
  onGenerate: () => void;
  revealed: boolean;
  onReveal: () => void;
  onHide: () => void;
  checked: boolean;
  onCheck: () => void;
  onReset: () => void;
  renderSecret: () => React.ReactNode;
  confirmedContent: React.ReactNode;
  generateLabel: string;
}) {
  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-5"
      style={{ borderColor: border, background: bg }}
    >
      <div>
        <span
          className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
          style={{ color: tagColor, background: `${tagColor}18`, border: `1px solid ${tagColor}33` }}
        >
          {tag}
        </span>
        <h3 className="text-xl font-serif text-white/90 mb-2">{title}</h3>
        <p className="text-sm text-white/45 leading-relaxed">{description}</p>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              onClick={onGenerate}
              className="w-full py-3 rounded-xl text-sm font-semibold border transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{
                background: `${tagColor}18`,
                borderColor: `${tagColor}44`,
                color: tagColor,
              }}
            >
              {generateLabel}
            </button>
          </motion.div>
        )}

        {status === "generating" && (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 text-sm text-white/40">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating locally…
          </motion.div>
        )}

        {(status === "revealed" || status === "confirmed") && (
          <motion.div key="revealed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {status !== "confirmed" && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/6 px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/70 leading-snug">
                  Write this down on paper now. No screenshots. No cloud notes. Once you close this window, it's gone.
                </p>
              </div>
            )}

            <div className="relative">
              {!revealed && status !== "confirmed" && (
                <div className="absolute inset-0 z-10 rounded-lg backdrop-blur-sm bg-black/40 flex items-center justify-center">
                  <button
                    onClick={onReveal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/80 border border-white/20 bg-white/8 hover:bg-white/14 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Reveal — I'm in a private place
                  </button>
                </div>
              )}
              <div className={!revealed && status !== "confirmed" ? "select-none" : ""}>
                {renderSecret()}
              </div>
            </div>

            {revealed && status !== "confirmed" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <button
                  onClick={onHide}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Hide again
                </button>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input type="checkbox" className="sr-only" checked={checked} onChange={onCheck} />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        checked ? "border-transparent" : "border-white/30 group-hover:border-white/50"
                      }`}
                      style={{ background: checked ? tagColor : "transparent" }}
                    >
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-white/60 leading-snug">
                    I've written this down on paper, in order, and stored it somewhere only I can reach.
                    No photo. No cloud backup.
                  </span>
                </label>
              </motion.div>
            )}

            {status === "confirmed" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: tagColor }}>
                  <CheckCircle2 className="w-4 h-4" /> Keys confirmed and stored.
                </div>
                {confirmedContent}
                <button
                  onClick={onReset}
                  className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/45 transition-colors mt-1"
                >
                  <RefreshCw className="w-3 h-3" /> Generate a new set
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
