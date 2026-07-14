import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, ArrowLeft, Footprints } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const IMPRINT_KEY = "tsp-imprint-v1";
const STOMP_KEY_LEGACY = "tsp-daily-stomp-v1";

interface ImprintState {
  date: string;
  completed: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function readImprint(): ImprintState {
  if (typeof window === "undefined") return { date: todayISO(), completed: false };
  try {
    const raw = localStorage.getItem(IMPRINT_KEY) ?? localStorage.getItem(STOMP_KEY_LEGACY);
    if (!raw) return { date: todayISO(), completed: false };
    const parsed = JSON.parse(raw) as ImprintState;
    if (parsed.date !== todayISO()) return { date: todayISO(), completed: false };
    return { date: parsed.date, completed: parsed.completed };
  } catch { return { date: todayISO(), completed: false }; }
}

function writeImprint(s: ImprintState) {
  try { localStorage.setItem(IMPRINT_KEY, JSON.stringify(s)); } catch {}
}

const STOMP_PROMPTS = [
  "Name one thing you'll do today that nobody can take from you.",
  "What system did you rely on this week that you could replace with a skill?",
  "Which Zone in your life needs the most stomping this week — 0, 1, or further out?",
  "Pick one. Plant something, fix something, or learn something. Which is it today?",
  "Whose permission have you stopped waiting for? Whose are you still waiting on?",
];

export default function DailyStompPage() {
  const [imprint, setImprint] = useState<ImprintState>(() => readImprint());
  const [response, setResponse] = useState("");

  const prompt = useMemo(() => {
    const day = new Date().getDate();
    return STOMP_PROMPTS[day % STOMP_PROMPTS.length];
  }, []);

  useEffect(() => {
    document.title = "Daily Stomp — The Stomping Path";
    return () => {
      document.title = "The Stomping Path";
    };
  }, []);

  function handleStomp() {
    const next: ImprintState = { date: todayISO(), completed: true };
    setImprint(next);
    writeImprint(next);
  }

  return (
    <div className="min-h-screen bg-[#0c1611] text-[#FDFBF7]">
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#FDFBF7]/40 hover:text-[#D9A066] transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to the watershed
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <Footprints className="w-5 h-5 text-[#D9A066]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9A066]">
            Daily Stomp
          </span>
        </div>

        <h1 className="font-serif text-3xl font-bold mb-2 leading-tight">
          Today's Prompt
        </h1>
        <p className="text-[#FDFBF7]/45 text-sm mb-8">
          {new Date().toLocaleDateString("en-CA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <AnimatePresence mode="wait">
          {imprint.completed ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/8 p-8 text-center"
            >
              <CheckCircle2 className="w-10 h-10 text-[#22c55e] mx-auto mb-4" />
              <p className="font-serif text-xl font-bold mb-2">Stomped.</p>
              <p className="text-[#FDFBF7]/55 text-sm leading-relaxed mb-6">
                You showed up today. That's the whole thing.
              </p>
              <p className="text-sm text-[#FDFBF7]/30 italic leading-relaxed">
                "{prompt}"
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="rounded-2xl border border-[#D9A066]/25 bg-[#D9A066]/6 p-6 mb-6">
                <p className="font-serif text-lg font-medium leading-relaxed text-[#FDFBF7]">
                  {prompt}
                </p>
              </div>

              <textarea
                className="w-full rounded-xl border border-[#FDFBF7]/10 bg-[#FDFBF7]/[0.04] text-[#FDFBF7] placeholder-[#FDFBF7]/25 text-sm leading-relaxed px-4 py-3 resize-none focus:outline-none focus:border-[#D9A066]/45 transition-colors mb-4"
                rows={5}
                placeholder="Write a few words, or just think it through…"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />

              <button
                type="button"
                onClick={handleStomp}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-[#2C4A36] bg-gradient-to-r from-[#D9A066] to-[#e8b06b] hover:from-[#e0a972] hover:to-[#f1bb78] transition-all shadow-lg shadow-[#D9A066]/25 hover:shadow-[#D9A066]/40 hover:-translate-y-0.5"
              >
                <Footprints className="w-4 h-4" />
                Stomp it
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-[#FDFBF7]/8">
          <p className="text-xs text-[#FDFBF7]/25 text-center mb-4 uppercase tracking-wider">
            Keep moving
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/episodes"
              className="flex-1 inline-flex items-center justify-center text-sm font-semibold text-[#FDFBF7]/55 border border-[#FDFBF7]/10 hover:border-[#D9A066]/40 hover:text-[#D9A066] rounded-xl px-4 py-2.5 transition-all"
            >
              Browse the archive
            </Link>
            <Link
              href="/tracks"
              className="flex-1 inline-flex items-center justify-center text-sm font-semibold text-[#FDFBF7]/55 border border-[#FDFBF7]/10 hover:border-[#D9A066]/40 hover:text-[#D9A066] rounded-xl px-4 py-2.5 transition-all"
            >
              Learning tracks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
