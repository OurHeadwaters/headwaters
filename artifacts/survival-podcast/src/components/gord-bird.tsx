import { motion } from "framer-motion";

export type IdleAnim = "head-tilt" | "tail-fan" | "wing-ruffle" | "head-bob" | null;

const headVariants = {
  idle: { rotate: 0, transition: { duration: 0.6, ease: "easeOut" } },
  "head-tilt": {
    rotate: [0, -9, 6, 0],
    transition: { duration: 1.1, ease: "easeInOut", times: [0, 0.4, 0.75, 1] },
  },
  hover: {
    rotate: [0, -7, 5, -3, 0],
    transition: { duration: 0.38, ease: "easeInOut", times: [0, 0.3, 0.6, 0.82, 1] },
  },
};

const headPerchVariants = {
  idle: { rotate: 0, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  "head-tilt": {
    rotate: [0, -8, 6, 0],
    y: 0,
    transition: { duration: 1.1, ease: "easeInOut", times: [0, 0.4, 0.75, 1] },
  },
  "head-bob": {
    y: [0, -5, 2, 0],
    rotate: 0,
    transition: { duration: 0.85, ease: "easeInOut", times: [0, 0.4, 0.75, 1] },
  },
  hover: {
    y: [0, -4, 1, 0],
    rotate: [0, -5, 4, 0],
    transition: { duration: 0.38, ease: "easeInOut", times: [0, 0.35, 0.7, 1] },
  },
};

const tailVariants = {
  idle: { rotate: 0, transition: { duration: 0.6, ease: "easeOut" } },
  "tail-fan": {
    rotate: [0, 12, -4, 0],
    transition: { duration: 1.0, ease: "easeInOut", times: [0, 0.45, 0.75, 1] },
  },
  hover: {
    rotate: [0, 10, -3, 0],
    transition: { duration: 0.38, ease: "easeInOut", times: [0, 0.4, 0.72, 1] },
  },
};

const wingVariants = {
  idle: { x: 0, transition: { duration: 0.3 } },
  "wing-ruffle": {
    x: [0, -4, 3, -2, 0],
    transition: { duration: 0.65, ease: "easeInOut", times: [0, 0.25, 0.55, 0.8, 1] },
  },
  hover: {
    x: [0, -6, 4, -2, 0],
    transition: { duration: 0.4, ease: "easeInOut", times: [0, 0.25, 0.55, 0.8, 1] },
  },
};

const bodyScaleVariants = {
  idle: { scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  hover: {
    scale: [1, 1.045, 1.02, 1],
    transition: { duration: 0.38, ease: "easeInOut", times: [0, 0.3, 0.65, 1] },
  },
};

interface GordBirdProps {
  size?: number;
  className?: string;
  variant?: "full" | "head";
  eyeTarget?: { dx: number; dy: number };
  idleAnim?: IdleAnim;
  hovered?: boolean;
}

export function GordBird({
  size = 120,
  className = "",
  variant = "full",
  eyeTarget,
  idleAnim = null,
  hovered = false,
}: GordBirdProps) {
  const ex = eyeTarget?.dx ?? 0;
  const ey = eyeTarget?.dy ?? 0;

  const headPerchState = hovered
    ? "hover"
    : idleAnim === "head-tilt" || idleAnim === "head-bob"
      ? idleAnim
      : "idle";

  if (variant === "head") {
    const s = size;
    const px = ex * 1.1;
    const py = ey * 0.9;

    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <pattern id="gord-h-bars" x="0" y="0" width="60" height="5" patternUnits="userSpaceOnUse">
            <rect width="60" height="5" fill="transparent" />
            <rect y="3.5" width="60" height="1.8" fill="#6B4E2A" opacity="0.38" />
          </pattern>
          <clipPath id="gord-head-h-clip">
            <ellipse cx="30" cy="37" rx="17" ry="16" />
          </clipPath>
          <clipPath id="gord-neck-h-clip">
            <ellipse cx="30" cy="52" rx="13" ry="8" />
          </clipPath>
        </defs>

        {/* Neck / chest base — stays still */}
        <ellipse cx="30" cy="53" rx="14" ry="9" fill="#8B6F47" />
        <rect x="16" y="44" width="28" height="18" fill="url(#gord-h-bars)" clipPath="url(#gord-neck-h-clip)" opacity="0.45" />
        <path d="M18 50 Q22 45 26 50 Q30 45 34 50 Q38 45 42 50" stroke="#6B4E2A" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />

        {/* Head group — head-tilt (rotate) or head-bob (y) */}
        <motion.g
          variants={headPerchVariants}
          animate={headPerchState}
          style={{ transformOrigin: "30px 50px" }}
        >
          <ellipse cx="30" cy="37" rx="17" ry="16" fill="#C4965A" />
          <rect x="13" y="21" width="34" height="32" fill="url(#gord-h-bars)" clipPath="url(#gord-head-h-clip)" opacity="0.28" />

          {/* Pinnae */}
          <ellipse cx="22" cy="16" rx="2.8" ry="10" fill="#6B4E2A" transform="rotate(-8 22 16)" />
          <ellipse cx="20" cy="14" rx="2" ry="8" fill="#8B6F47" transform="rotate(-18 20 14)" />
          <ellipse cx="24" cy="15" rx="2" ry="8" fill="#8B6F47" transform="rotate(2 24 15)" />
          <ellipse cx="38" cy="16" rx="2.8" ry="10" fill="#6B4E2A" transform="rotate(8 38 16)" />
          <ellipse cx="36" cy="15" rx="2" ry="8" fill="#8B6F47" transform="rotate(-2 36 15)" />
          <ellipse cx="40" cy="14" rx="2" ry="8" fill="#8B6F47" transform="rotate(18 40 14)" />

          {/* Supraorbital combs */}
          <ellipse cx="22" cy="28" rx="6" ry="2.2" fill="#D9A066" />
          <ellipse cx="38" cy="28" rx="6" ry="2.2" fill="#D9A066" />

          {/* Eyes */}
          <ellipse cx="22" cy="33" rx="5" ry="5.5" fill="white" />
          <ellipse cx="38" cy="33" rx="5" ry="5.5" fill="white" />

          {/* Pupils */}
          <circle cx={22 + px} cy={34 + py} r="3.5" fill="#2C1810" />
          <circle cx={38 + px} cy={34 + py} r="3.5" fill="#2C1810" />
          <circle cx={23.2 + px} cy={32.5 + py} r="1.2" fill="white" />
          <circle cx={39.2 + px} cy={32.5 + py} r="1.2" fill="white" />

          {/* Beak */}
          <polygon points="30,40 25,48 35,48" fill="#E8B97F" stroke="#6B4E2A" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="30,47 26,51 34,51" fill="#D9A066" stroke="#6B4E2A" strokeWidth="1" strokeLinejoin="round" />
          <line x1="30" y1="40" x2="30" y2="48" stroke="#6B4E2A" strokeWidth="0.9" />
        </motion.g>
      </svg>
    );
  }

  const px = ex * 1.8;
  const py = ey * 1.2;

  const headState = hovered ? "hover" : idleAnim === "head-tilt" ? "head-tilt" : "idle";
  const tailState = hovered ? "hover" : idleAnim === "tail-fan" ? "tail-fan" : "idle";
  const wingState = hovered ? "hover" : idleAnim === "wing-ruffle" ? "wing-ruffle" : "idle";
  const bodyScale = hovered ? "hover" : "idle";

  return (
    <motion.svg
      variants={bodyScaleVariants}
      animate={bodyScale}
      style={{ transformOrigin: "50px 97px", display: "block" }}
      width={size}
      height={Math.round(size * 1.4)}
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <pattern id="gord-bars" x="0" y="0" width="100" height="7" patternUnits="userSpaceOnUse">
          <rect width="100" height="7" fill="transparent" />
          <rect y="5" width="100" height="2.2" fill="#6B4E2A" opacity="0.38" />
        </pattern>
        <clipPath id="gord-body-clip">
          <ellipse cx="50" cy="97" rx="34" ry="22" />
        </clipPath>
        <clipPath id="gord-neck-clip">
          <ellipse cx="45" cy="76" rx="13" ry="9" />
        </clipPath>
        <clipPath id="gord-head-clip">
          <ellipse cx="44" cy="59" rx="17" ry="16" />
        </clipPath>
        <clipPath id="gord-tail-clip">
          <path d="M72 75 Q88 68 92 82 Q90 96 76 100 Z" />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="50" cy="133" rx="25" ry="5" fill="#6B4E2A" opacity="0.25" />

      {/* Legs */}
      <line x1="40" y1="117" x2="36" y2="127" stroke="#8B6F47" strokeWidth="4" strokeLinecap="round" />
      <line x1="36" y1="127" x2="23" y2="123" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="36" y1="127" x2="32" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="36" y1="127" x2="41" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="62" y1="117" x2="66" y2="127" stroke="#8B6F47" strokeWidth="4" strokeLinecap="round" />
      <line x1="66" y1="127" x2="79" y2="123" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="66" y1="127" x2="70" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="66" y1="127" x2="61" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />

      {/* Tail group — fans out on tail-fan */}
      <motion.g
        variants={tailVariants}
        animate={tailState}
        style={{ transformOrigin: "73px 100px" }}
      >
        <ellipse cx="80" cy="100" rx="11" ry="5.5" fill="#8B6F47" transform="rotate(-10 80 100)" />
        <ellipse cx="83" cy="94" rx="10" ry="5" fill="#8B6F47" transform="rotate(-25 83 94)" />
        <ellipse cx="83" cy="87" rx="9" ry="4.5" fill="#8B6F47" transform="rotate(-42 83 87)" />
        <ellipse cx="80" cy="100" rx="11" ry="5.5" fill="url(#gord-bars)" transform="rotate(-10 80 100)" opacity="0.6" />
        <ellipse cx="83" cy="94" rx="10" ry="5" fill="url(#gord-bars)" transform="rotate(-25 83 94)" opacity="0.6" />
        <ellipse cx="83" cy="87" rx="9" ry="4.5" fill="url(#gord-bars)" transform="rotate(-42 83 87)" opacity="0.6" />
      </motion.g>

      {/* Body */}
      <ellipse cx="50" cy="97" rx="34" ry="22" fill="#8B6F47" />
      <ellipse cx="46" cy="97" rx="25" ry="17" fill="#C4965A" />
      <rect x="16" y="75" width="68" height="44" fill="url(#gord-bars)" clipPath="url(#gord-body-clip)" opacity="0.5" />

      {/* Wing fold — ruffles on wing-ruffle */}
      <motion.g variants={wingVariants} animate={wingState}>
        <path d="M17 96 Q10 87 16 79 Q22 73 28 84" fill="#8B6F47" stroke="#6B4E2A" strokeWidth="0.8" />
        <path d="M17 96 Q10 87 16 79 Q22 73 28 84" fill="url(#gord-bars)" opacity="0.5" />
      </motion.g>

      {/* Neck */}
      <ellipse cx="45" cy="76" rx="13" ry="9" fill="#C4965A" />
      <rect x="32" y="67" width="26" height="18" fill="url(#gord-bars)" clipPath="url(#gord-neck-clip)" opacity="0.4" />
      <path d="M33 82 Q37 77 41 82 Q45 77 49 82 Q53 77 57 82" stroke="#6B4E2A" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Head group — tilts on head-tilt */}
      <motion.g
        variants={headVariants}
        animate={headState}
        style={{ transformOrigin: "44px 70px" }}
      >
        <ellipse cx="44" cy="59" rx="17" ry="16" fill="#C4965A" />
        <rect x="27" y="43" width="34" height="32" fill="url(#gord-bars)" clipPath="url(#gord-head-clip)" opacity="0.25" />

        {/* Pinnae */}
        <ellipse cx="36" cy="40" rx="3" ry="12" fill="#6B4E2A" transform="rotate(-10 36 40)" />
        <ellipse cx="33" cy="38" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(-22 33 38)" />
        <ellipse cx="39" cy="39" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(2 39 39)" />
        <ellipse cx="52" cy="40" rx="3" ry="12" fill="#6B4E2A" transform="rotate(10 52 40)" />
        <ellipse cx="49" cy="39" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(-2 49 39)" />
        <ellipse cx="55" cy="38" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(22 55 38)" />

        {/* Supraorbital combs */}
        <ellipse cx="37" cy="51" rx="6.5" ry="2.5" fill="#D9A066" />
        <ellipse cx="53" cy="51" rx="6.5" ry="2.5" fill="#D9A066" />

        {/* Eyes */}
        <ellipse cx="37" cy="57" rx="5.5" ry="6" fill="white" />
        <ellipse cx="53" cy="57" rx="5.5" ry="6" fill="white" />

        {/* Pupils */}
        <circle cx={37 + px} cy={58 + py} r="4" fill="#2C1810" />
        <circle cx={53 + px} cy={58 + py} r="4" fill="#2C1810" />
        <circle cx={38.5 + px} cy={56.5 + py} r="1.5" fill="white" />
        <circle cx={54.5 + px} cy={56.5 + py} r="1.5" fill="white" />

        {/* Beak */}
        <polygon points="44,64 39,72 49,72" fill="#E8B97F" stroke="#6B4E2A" strokeWidth="1.8" strokeLinejoin="round" />
        <polygon points="44,71 40,75 48,75" fill="#D9A066" stroke="#6B4E2A" strokeWidth="1.1" strokeLinejoin="round" />
        <line x1="44" y1="64" x2="44" y2="72" stroke="#6B4E2A" strokeWidth="0.9" />
      </motion.g>
    </motion.svg>
  );
}
