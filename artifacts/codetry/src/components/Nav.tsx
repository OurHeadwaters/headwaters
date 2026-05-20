import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
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
          <span className="font-serif text-xl font-medium text-white hover:text-[#D9A066] transition-colors cursor-pointer">
            Codetry
          </span>
        </Link>

        <nav className="flex items-center gap-6 md:gap-8">
          {links.map(({ href, label }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <span
                  className={`text-sm font-medium transition-colors cursor-pointer ${
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
          <a
            href="mailto:codetry@gmail.com"
            className="text-sm font-medium px-4 py-2 rounded-md bg-[#D9A066] text-[#2B2825] hover:bg-[#C88E55] transition-colors"
          >
            Get in touch
          </a>
        </nav>
      </div>
    </header>
  );
}
