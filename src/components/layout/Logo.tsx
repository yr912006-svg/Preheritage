import Link from "next/link";
import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  showTagline?: boolean;
  compactOnMobile?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "dark",
  showTagline = true,
  compactOnMobile = false,
}) => {
  const isLight = variant === "light";

  return (
    <Link href="/" className={`inline-flex flex-col items-center group text-center ${className}`}>
      {/* Heritage Monogram Emblem & Brand Name */}
      <div className={`flex items-center ${compactOnMobile ? "gap-1 sm:gap-2" : "gap-2"}`}>
        {/* Emblem: Sacred Weaving Thread & Sun Motif */}
        <svg
          className={`${compactOnMobile ? "w-6 h-6 sm:w-8 sm:h-8" : "w-7 h-7 sm:w-8 sm:h-8"} transition-transform duration-500 group-hover:rotate-45 ${
            isLight ? "text-gold-300" : "text-gold-500"
          }`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Royal Diamond */}
          <rect
            x="50"
            y="5"
            width="63.64"
            height="63.64"
            transform="rotate(45 50 5)"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray="4 2"
          />
          {/* Inner Golden Loom Thread Knot */}
          <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="2.5" />
          <path
            d="M50 20V80M20 50H80M29 29L71 71M29 71L71 29"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>

        <span
          className={`${compactOnMobile ? "tracking-[0.16em] text-lg sm:tracking-[0.28em] sm:text-2xl" : "tracking-[0.28em] text-xl sm:text-2xl"} font-serif font-bold uppercase transition-colors ${
            isLight ? "text-white" : "text-charcoal-900 group-hover:text-gold-600"
          }`}
        >
          PREHERITAGE
        </span>
      </div>

      {showTagline && (
        <span
          className={`${compactOnMobile ? "text-[8px] tracking-[0.14em] sm:text-[10px] sm:tracking-[0.25em]" : "text-[9px] sm:text-[10px] tracking-[0.25em]"} uppercase font-sans mt-0.5 font-medium ${
            isLight ? "text-ivory-300" : "text-charcoal-200"
          }`}
        >
          Wear the Stories of India
        </span>
      )}
    </Link>
  );
};

export default Logo;
