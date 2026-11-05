"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#B08A45]/50 bg-[#24201D]/95 text-[#B08A45] shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#B08A45] hover:bg-[#B08A45] hover:text-[#24201D] focus:outline-none focus:ring-2 focus:ring-[#B08A45]/50"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
