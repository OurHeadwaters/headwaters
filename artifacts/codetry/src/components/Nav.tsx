import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import CodetryWordmark from "@/components/CodetryWordmark";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Council Kit" },
  { href: "/work", label: "Work" },
  { href: "/workbench", label: "Workbench" },
];

export default function Nav() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A180A]/95 backdrop-blur-sm shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/">
          <span className="text-white hover:text-[#D9A066] transition-colors cursor-pointer">
            <CodetryWordmark iconSize={28} />
          </span>
        </Link>

        <nav className="flex items-center gap-6 md:gap-8">
          {links.map(({ href, label }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <span
                  className={`hidden md:inline text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "text-[#D9A066]"
                      : "text-white/80 hover:text-[#D9A066]"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
          <Link href="/discover">
            <span
              className={`whitespace-nowrap text-sm font-semibold px-4 py-2 rounded-md border transition-colors cursor-pointer ${
                location === "/discover"
                  ? "bg-[#D9A066] text-[#2B2825] border-[#D9A066]"
                  : "border-[#D9A066] text-[#D9A066] hover:bg-[#D9A066] hover:text-[#2B2825]"
              }`}
            >
              Find your zone
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
