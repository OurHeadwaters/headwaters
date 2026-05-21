interface GordBirdProps {
  size?: number;
  className?: string;
  variant?: "full" | "head";
}

export function GordBird({ size = 120, className = "", variant = "full" }: GordBirdProps) {
  if (variant === "head") {
    const s = size;
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
        <ellipse cx="30" cy="28" rx="18" ry="20" fill="#8B6F47" />
        <ellipse cx="30" cy="24" rx="13" ry="14" fill="#C4965A" />
        <ellipse cx="24" cy="20" rx="4.5" ry="5" fill="white" />
        <ellipse cx="36" cy="20" rx="4.5" ry="5" fill="white" />
        <circle cx="24" cy="21" r="3" fill="#2C1810" />
        <circle cx="36" cy="21" r="3" fill="#2C1810" />
        <circle cx="25" cy="20" r="1" fill="white" />
        <circle cx="37" cy="20" r="1" fill="white" />
        <path d="M27 31 Q30 34 33 31" stroke="#8B6F47" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <polygon points="30,28 26,32 34,32" fill="#D9A066" />
        <ellipse cx="19" cy="14" rx="5" ry="8" fill="#C4965A" transform="rotate(-20 19 14)" />
        <ellipse cx="41" cy="14" rx="5" ry="8" fill="#C4965A" transform="rotate(20 41 14)" />
        <ellipse cx="19" cy="13" rx="3" ry="5" fill="#8B6F47" transform="rotate(-20 19 13)" />
        <ellipse cx="41" cy="13" rx="3" ry="5" fill="#8B6F47" transform="rotate(20 41 13)" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={Math.round(size * 1.8)}
      viewBox="0 0 100 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="50" cy="155" rx="22" ry="6" fill="#6B4E2A" opacity="0.3" />

      <line x1="38" y1="145" x2="28" y2="162" stroke="#8B6F47" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="62" y1="145" x2="72" y2="162" stroke="#8B6F47" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="28" y1="162" x2="18" y2="158" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="162" x2="24" y2="168" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="162" x2="32" y2="169" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="162" x2="82" y2="158" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="162" x2="76" y2="168" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="162" x2="68" y2="169" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />

      <rect x="42" y="110" width="16" height="38" rx="6" fill="#8B6F47" />

      <ellipse cx="50" cy="108" rx="24" ry="18" fill="#8B6F47" />
      <ellipse cx="50" cy="106" rx="19" ry="15" fill="#C4965A" />

      <path d="M26 105 Q14 98 16 88 Q18 78 26 85" fill="#8B6F47" stroke="#6B4E2A" strokeWidth="1" />
      <path d="M74 105 Q86 98 84 88 Q82 78 74 85" fill="#8B6F47" stroke="#6B4E2A" strokeWidth="1" />

      <ellipse cx="50" cy="68" rx="20" ry="22" fill="#C4965A" />

      <ellipse cx="43" cy="62" rx="6" ry="7" fill="white" />
      <ellipse cx="57" cy="62" rx="6" ry="7" fill="white" />
      <circle cx="43" cy="63" r="4.5" fill="#2C1810" />
      <circle cx="57" cy="63" r="4.5" fill="#2C1810" />
      <circle cx="44.5" cy="61.5" r="1.5" fill="white" />
      <circle cx="58.5" cy="61.5" r="1.5" fill="white" />

      <path d="M44 74 Q50 78 56 74" stroke="#8B6F47" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      <polygon points="50,70 44,75 56,75" fill="#D9A066" />

      <ellipse cx="34" cy="50" rx="7" ry="11" fill="#C4965A" transform="rotate(-15 34 50)" />
      <ellipse cx="66" cy="50" rx="7" ry="11" fill="#C4965A" transform="rotate(15 66 50)" />
      <ellipse cx="34" cy="49" rx="4" ry="7" fill="#8B6F47" transform="rotate(-15 34 49)" />
      <ellipse cx="66" cy="49" rx="4" ry="7" fill="#8B6F47" transform="rotate(15 66 49)" />

      <circle cx="38" cy="56" r="2" fill="#D9A066" opacity="0.6" />
      <circle cx="62" cy="56" r="2" fill="#D9A066" opacity="0.6" />
    </svg>
  );
}
