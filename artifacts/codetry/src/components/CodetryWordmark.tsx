import React from "react";

const BASE = import.meta.env.BASE_URL;

export default function CodetryWordmark({
  className = "",
  iconSize = 28,
}: {
  className?: string;
  iconSize?: number;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={`${BASE}logo.svg`}
        alt=""
        aria-hidden="true"
        width={iconSize}
        height={iconSize}
        style={{ borderRadius: Math.round(iconSize * 0.2) }}
      />
      <span className="font-serif font-medium tracking-tight text-xl">Codetry</span>
    </span>
  );
}
