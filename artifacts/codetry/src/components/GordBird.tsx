import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GordBird } from "@workspace/gord-bird";

export { GordBird };
export type { GordBirdProps } from "@workspace/gord-bird";

export function FlyingGord() {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 45000;
      return setTimeout(() => {
        setDirection(Math.random() > 0.5 ? "ltr" : "rtl");
        setVisible(true);
        setTimeout(() => {
          setVisible(false);
          scheduleNext();
        }, 3200);
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-24 z-40 pointer-events-none"
          initial={{ x: direction === "ltr" ? -120 : "calc(100vw + 120px)", opacity: 1 }}
          animate={{ x: direction === "ltr" ? "calc(100vw + 120px)" : -120, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: "linear" }}
        >
          <motion.div
            animate={{ y: [0, -10, 0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transform: direction === "rtl" ? "scaleX(-1)" : undefined }}
          >
            <GordBird size={56} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
