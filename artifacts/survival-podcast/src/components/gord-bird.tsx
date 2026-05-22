interface GordBirdProps {
  size?: number;
  className?: string;
  variant?: "full" | "head";
  eyeTarget?: { dx: number; dy: number };
}

export function GordBird({ size = 120, className = "", variant = "full", eyeTarget }: GordBirdProps) {
  const ex = eyeTarget?.dx ?? 0;
  const ey = eyeTarget?.dy ?? 0;

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

        {/* Neck / chest base */}
        <ellipse cx="30" cy="53" rx="14" ry="9" fill="#8B6F47" />
        <rect x="16" y="44" width="28" height="18" fill="url(#gord-h-bars)" clipPath="url(#gord-neck-h-clip)" opacity="0.45" />

        {/* Ruffled neck feathers */}
        <path d="M18 50 Q22 45 26 50 Q30 45 34 50 Q38 45 42 50" stroke="#6B4E2A" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />

        {/* Head */}
        <ellipse cx="30" cy="37" rx="17" ry="16" fill="#C4965A" />
        <rect x="13" y="21" width="34" height="32" fill="url(#gord-h-bars)" clipPath="url(#gord-head-h-clip)" opacity="0.28" />

        {/* Pinnae — long pointed feather tufts, prairie-chicken style */}
        {/* Left tuft: cluster of 3 tapered feathers */}
        <ellipse cx="22" cy="16" rx="2.8" ry="10" fill="#6B4E2A" transform="rotate(-8 22 16)" />
        <ellipse cx="20" cy="14" rx="2" ry="8" fill="#8B6F47" transform="rotate(-18 20 14)" />
        <ellipse cx="24" cy="15" rx="2" ry="8" fill="#8B6F47" transform="rotate(2 24 15)" />

        {/* Right tuft */}
        <ellipse cx="38" cy="16" rx="2.8" ry="10" fill="#6B4E2A" transform="rotate(8 38 16)" />
        <ellipse cx="36" cy="15" rx="2" ry="8" fill="#8B6F47" transform="rotate(-2 36 15)" />
        <ellipse cx="40" cy="14" rx="2" ry="8" fill="#8B6F47" transform="rotate(18 40 14)" />

        {/* Supraorbital combs (orange eyebrow patches) */}
        <ellipse cx="22" cy="28" rx="6" ry="2.2" fill="#D9A066" />
        <ellipse cx="38" cy="28" rx="6" ry="2.2" fill="#D9A066" />

        {/* Eyes — white sockets */}
        <ellipse cx="22" cy="33" rx="5" ry="5.5" fill="white" />
        <ellipse cx="38" cy="33" rx="5" ry="5.5" fill="white" />

        {/* Pupils with cursor tracking */}
        <circle cx={22 + px} cy={34 + py} r="3.5" fill="#2C1810" />
        <circle cx={38 + px} cy={34 + py} r="3.5" fill="#2C1810" />
        <circle cx={23.2 + px} cy={32.5 + py} r="1.2" fill="white" />
        <circle cx={39.2 + px} cy={32.5 + py} r="1.2" fill="white" />

        {/* Beak — stout, short, downward-curved */}
        <polygon points="30,40 25,48 35,48" fill="#E8B97F" stroke="#6B4E2A" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="30,47 26,51 34,51" fill="#D9A066" stroke="#6B4E2A" strokeWidth="1" strokeLinejoin="round" />
        <line x1="30" y1="40" x2="30" y2="48" stroke="#6B4E2A" strokeWidth="0.9" />
      </svg>
    );
  }

  const px = ex * 1.8;
  const py = ey * 1.2;

  return (
    <svg
      width={size}
      height={Math.round(size * 1.4)}
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Horizontal barred feather pattern — defines prairie grouse plumage */}
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

      {/* ---- LEGS (short, sturdy) ---- */}
      {/* Left leg */}
      <line x1="40" y1="117" x2="36" y2="127" stroke="#8B6F47" strokeWidth="4" strokeLinecap="round" />
      {/* Left three toes */}
      <line x1="36" y1="127" x2="23" y2="123" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="36" y1="127" x2="32" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="36" y1="127" x2="41" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />

      {/* Right leg */}
      <line x1="62" y1="117" x2="66" y2="127" stroke="#8B6F47" strokeWidth="4" strokeLinecap="round" />
      {/* Right three toes */}
      <line x1="66" y1="127" x2="79" y2="123" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="66" y1="127" x2="70" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="66" y1="127" x2="61" y2="133" stroke="#8B6F47" strokeWidth="2.8" strokeLinecap="round" />

      {/* ---- TAIL (short fanned feathers) ---- */}
      <ellipse cx="80" cy="100" rx="11" ry="5.5" fill="#8B6F47" transform="rotate(-10 80 100)" />
      <ellipse cx="83" cy="94" rx="10" ry="5" fill="#8B6F47" transform="rotate(-25 83 94)" />
      <ellipse cx="83" cy="87" rx="9" ry="4.5" fill="#8B6F47" transform="rotate(-42 83 87)" />
      {/* Tail barring */}
      <ellipse cx="80" cy="100" rx="11" ry="5.5" fill="url(#gord-bars)" transform="rotate(-10 80 100)" opacity="0.6" />
      <ellipse cx="83" cy="94" rx="10" ry="5" fill="url(#gord-bars)" transform="rotate(-25 83 94)" opacity="0.6" />
      <ellipse cx="83" cy="87" rx="9" ry="4.5" fill="url(#gord-bars)" transform="rotate(-42 83 87)" opacity="0.6" />

      {/* ---- BODY — football-shaped, stocky ---- */}
      <ellipse cx="50" cy="97" rx="34" ry="22" fill="#8B6F47" />
      {/* Belly — lighter warm center */}
      <ellipse cx="46" cy="97" rx="25" ry="17" fill="#C4965A" />
      {/* Barred feather pattern overlaid */}
      <rect x="16" y="75" width="68" height="44" fill="url(#gord-bars)" clipPath="url(#gord-body-clip)" opacity="0.5" />

      {/* Wing fold hint — left side (viewer's left) */}
      <path d="M17 96 Q10 87 16 79 Q22 73 28 84" fill="#8B6F47" stroke="#6B4E2A" strokeWidth="0.8" />
      <path d="M17 96 Q10 87 16 79 Q22 73 28 84" fill="url(#gord-bars)" opacity="0.5" />

      {/* ---- NECK (short, ruffled) ---- */}
      <ellipse cx="45" cy="76" rx="13" ry="9" fill="#C4965A" />
      <rect x="32" y="67" width="26" height="18" fill="url(#gord-bars)" clipPath="url(#gord-neck-clip)" opacity="0.4" />

      {/* Ruffled chest/neck feathers */}
      <path d="M33 82 Q37 77 41 82 Q45 77 49 82 Q53 77 57 82" stroke="#6B4E2A" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* ---- HEAD (round, slightly forward-leaning) ---- */}
      <ellipse cx="44" cy="59" rx="17" ry="16" fill="#C4965A" />
      <rect x="27" y="43" width="34" height="32" fill="url(#gord-bars)" clipPath="url(#gord-head-clip)" opacity="0.25" />

      {/* ---- PINNAE — long pointed feather tufts (prairie chicken signature) ---- */}
      {/* Left tuft: cluster of 3 tapered feathers */}
      <ellipse cx="36" cy="40" rx="3" ry="12" fill="#6B4E2A" transform="rotate(-10 36 40)" />
      <ellipse cx="33" cy="38" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(-22 33 38)" />
      <ellipse cx="39" cy="39" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(2 39 39)" />

      {/* Right tuft */}
      <ellipse cx="52" cy="40" rx="3" ry="12" fill="#6B4E2A" transform="rotate(10 52 40)" />
      <ellipse cx="49" cy="39" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(-2 49 39)" />
      <ellipse cx="55" cy="38" rx="2.2" ry="9" fill="#8B6F47" transform="rotate(22 55 38)" />

      {/* ---- SUPRAORBITAL COMBS (orange eyebrow patches — very prairie chicken) ---- */}
      <ellipse cx="37" cy="51" rx="6.5" ry="2.5" fill="#D9A066" />
      <ellipse cx="53" cy="51" rx="6.5" ry="2.5" fill="#D9A066" />

      {/* ---- EYES — white sockets ---- */}
      <ellipse cx="37" cy="57" rx="5.5" ry="6" fill="white" />
      <ellipse cx="53" cy="57" rx="5.5" ry="6" fill="white" />

      {/* Pupils with cursor tracking */}
      <circle cx={37 + px} cy={58 + py} r="4" fill="#2C1810" />
      <circle cx={53 + px} cy={58 + py} r="4" fill="#2C1810" />
      <circle cx={38.5 + px} cy={56.5 + py} r="1.5" fill="white" />
      <circle cx={54.5 + px} cy={56.5 + py} r="1.5" fill="white" />

      {/* ---- BEAK (stout, short, ground-bird style) ---- */}
      <polygon points="44,64 39,72 49,72" fill="#E8B97F" stroke="#6B4E2A" strokeWidth="1.8" strokeLinejoin="round" />
      <polygon points="44,71 40,75 48,75" fill="#D9A066" stroke="#6B4E2A" strokeWidth="1.1" strokeLinejoin="round" />
      <line x1="44" y1="64" x2="44" y2="72" stroke="#6B4E2A" strokeWidth="0.9" />
    </svg>
  );
}
