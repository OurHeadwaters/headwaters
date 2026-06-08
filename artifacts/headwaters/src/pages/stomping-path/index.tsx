import { Link } from "wouter";
import { motion } from "framer-motion";
import { Footprints, ArrowLeft } from "lucide-react";

export default function StompingPathIndex() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(160deg, #1a1a14 0%, #0f1209 50%, #141610 100%)",
        color: "#d4c9a8",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Trail marker — back to Zone 1 */}
      <div className="px-6 pt-6">
        <Link href="/headwaters">
          <span
            className="text-xs tracking-widest cursor-pointer"
            style={{ color: "#7a7055", letterSpacing: "0.15em" }}
          >
            ← ZONE 1 · THE LODGE
          </span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-center"
        >
          {/* Zone marker */}
          <p
            className="text-xs tracking-widest mb-8"
            style={{ color: "#7a7055", letterSpacing: "0.2em" }}
          >
            ZONE 2
          </p>

          <h1
            className="text-4xl md:text-5xl font-normal mb-6"
            style={{ color: "#e8dfc0", lineHeight: 1.2 }}
          >
            The Stomping Path
          </h1>

          <p
            className="text-lg mb-4 font-normal"
            style={{ color: "#a89e7e", lineHeight: 1.7 }}
          >
            You've been shaped by teachers no one around you mentioned.
          </p>
          <p
            className="text-base mb-16"
            style={{ color: "#7a7055", lineHeight: 1.7 }}
          >
            This path holds two tools. One reads the terrain of your influences.
            The other keeps the groove of daily thought.
          </p>

          {/* Two paths */}
          <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <Link href="/stomping-path/compass">
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer text-left py-5 px-6 border rounded-sm"
                style={{
                  borderColor: "#3a3828",
                  background: "#1e1e16",
                }}
              >
                <p
                  className="text-xs tracking-widest mb-2"
                  style={{ color: "#7a7055", letterSpacing: "0.15em" }}
                >
                  FIRST TOOL
                </p>
                <p
                  className="text-xl mb-2"
                  style={{ color: "#e8dfc0" }}
                >
                  The Compass
                </p>
                <p
                  className="text-sm"
                  style={{ color: "#7a7055", lineHeight: 1.6 }}
                >
                  Map your teachers. See the terrain. Wade in to find who shares
                  your watershed.
                </p>
              </motion.div>
            </Link>

            <Link href="/stomping-path/dam-days">
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer text-left py-5 px-6 border rounded-sm"
                style={{
                  borderColor: "#3a3828",
                  background: "#1e1e16",
                }}
              >
                <p
                  className="text-xs tracking-widest mb-2"
                  style={{ color: "#7a7055", letterSpacing: "0.15em" }}
                >
                  SECOND TOOL
                </p>
                <p
                  className="text-xl mb-2"
                  style={{ color: "#e8dfc0" }}
                >
                  Dam Days
                </p>
                <p
                  className="text-sm"
                  style={{ color: "#7a7055", lineHeight: 1.6 }}
                >
                  A private surface for daily fragments. No audience. No
                  pressure. Just the worn groove.
                </p>
              </motion.div>
            </Link>
          </div>

          {/* Trail markers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 pt-10 border-t flex items-center justify-between"
            style={{ borderColor: "#2a2a20" }}
          >
            <Link href="/">
              <span
                className="inline-flex items-center gap-2 text-xs cursor-pointer"
                style={{ color: "#7a7055", letterSpacing: "0.15em" }}
              >
                <ArrowLeft size={11} />
                <Footprints size={13} />
                <span className="uppercase font-medium">Trail marker — Zone 1: Headwaters</span>
              </span>
            </Link>
            <span
              className="text-xs uppercase font-medium"
              style={{ color: "#4a4830", letterSpacing: "0.15em" }}
            >
              Zone 3 — not yet mapped
            </span>
          </motion.div>

          {/* Creator trail marker */}
          <div className="mt-8">
            <Link href="/stomping-path/creator">
              <span
                className="text-xs tracking-widest cursor-pointer"
                style={{ color: "#4a4830", letterSpacing: "0.12em" }}
              >
                TEACHERS & CREATORS — enter here
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
