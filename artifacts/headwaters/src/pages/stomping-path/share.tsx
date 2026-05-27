import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { useStompingPathGetCreatorShare, getStompingPathGetCreatorShareQueryKey } from "@workspace/api-client-react";

export default function StompingPathShare() {
  const { shareId } = useParams<{ shareId: string }>();

  const { data, isLoading, isError } = useStompingPathGetCreatorShare(shareId ?? "", {
    query: {
      enabled: !!shareId,
      queryKey: getStompingPathGetCreatorShareQueryKey(shareId ?? ""),
    },
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(160deg, #1a1a14 0%, #0f1209 50%, #141610 100%)",
        color: "#d4c9a8",
        fontFamily: "'Georgia', serif",
      }}
    >
      <div className="px-6 pt-6">
        <Link href="/stomping-path/creator">
          <span
            className="text-xs tracking-widest cursor-pointer"
            style={{ color: "#7a7055", letterSpacing: "0.15em" }}
          >
            ← MAP YOUR OWN TERRAIN
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <p
              className="text-sm"
              style={{ color: "#4a4830" }}
            >
              Reading the water...
            </p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p
              className="text-lg mb-4"
              style={{ color: "#a89e7e" }}
            >
              This map has gone cold.
            </p>
            <p
              className="text-sm"
              style={{ color: "#4a4830" }}
            >
              The share link may have been mistyped or the map no longer exists.
            </p>
          </div>
        )}

        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p
              className="text-xs tracking-widest mb-4"
              style={{ color: "#7a7055", letterSpacing: "0.2em" }}
            >
              CREATOR TERRAIN MAP
            </p>

            <h1
              className="text-3xl font-normal mb-2"
              style={{ color: "#e8dfc0" }}
            >
              {data.creatorName}
            </h1>

            <p
              className="text-sm mb-10"
              style={{ color: "#7a7055", lineHeight: 1.7 }}
            >
              Here is the shared terrain of {data.creatorName}'s influences — and where
              their community overlaps with others walking this watershed.
            </p>

            {/* Teacher list */}
            <div
              className="mb-8 p-5 rounded-sm"
              style={{ background: "#1a1a12", border: "1px solid #2e2c1e" }}
            >
              <p
                className="text-xs tracking-widest mb-4"
                style={{ color: "#4a4830", letterSpacing: "0.15em" }}
              >
                TEACHERS & INFLUENCES
              </p>
              <div className="flex flex-wrap gap-2">
                {data.teachers.map((t) => (
                  <span
                    key={t}
                    className="text-sm px-3 py-1 rounded-sm"
                    style={{
                      background: "#242418",
                      border: "1px solid #3a3828",
                      color: "#a89e7e",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Overlap map */}
            {data.overlap.length > 0 && (
              <div>
                <p
                  className="text-xs tracking-widest mb-6"
                  style={{ color: "#4a4830", letterSpacing: "0.15em" }}
                >
                  WHERE THE WATERSHEDS MEET
                </p>
                <div className="flex flex-col gap-3">
                  {data.overlap
                    .filter((o) => o.count > 0)
                    .map((o) => (
                      <div key={o.teacher} className="flex items-baseline gap-4">
                        <div className="flex-1">
                          <p
                            className="text-base"
                            style={{ color: "#d4c9a8" }}
                          >
                            {o.teacher}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#7a7055", lineHeight: 1.6 }}
                          >
                            {o.count === 1
                              ? "1 other in this pond"
                              : `${o.count} others in this pond`}{" "}
                            — the same watershed, a different tributary.
                          </p>
                        </div>
                        <div
                          className="text-2xl font-light"
                          style={{ color: "#6b6245", minWidth: "2rem", textAlign: "right" }}
                        >
                          {o.count}
                        </div>
                      </div>
                    ))}
                </div>

                {data.overlap.filter((o) => o.count > 0).length === 0 && (
                  <p
                    className="text-sm"
                    style={{ color: "#4a4830", lineHeight: 1.7 }}
                  >
                    The pool is still filling. These teachers haven't been named yet — but they will be.
                  </p>
                )}
              </div>
            )}

            <div
              className="mt-12 pt-6 border-t text-center"
              style={{ borderColor: "#2a2a1c" }}
            >
              <p
                className="text-sm mb-4"
                style={{ color: "#4a4830", lineHeight: 1.7 }}
              >
                These waters run in you too.
              </p>
              <Link href="/stomping-path/compass">
                <span
                  className="text-xs tracking-widest cursor-pointer"
                  style={{ color: "#7a7055", letterSpacing: "0.15em" }}
                >
                  MAP YOUR OWN TERRAIN →
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
