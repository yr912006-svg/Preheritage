"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  durationMs?: number;
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
  distance = 20,
  durationMs = 800,
  threshold = 0.12,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);

    // Fail open if prefers-reduced-motion is active
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsVisible(true);
      return;
    }

    // Fail open if IntersectionObserver is unavailable
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    // Immediately reveal if element is already within or near the visible fold
    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 80 && rect.bottom >= -80) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: Math.min(threshold, 0.05),
        rootMargin: "80px 0px 40px 0px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const getTransform = () => {
    if (!isMounted || isVisible) return "none";
    switch (direction) {
      case "up":
        return `translate3d(0, ${distance}px, 0)`;
      case "down":
        return `translate3d(0, -${distance}px, 0)`;
      case "left":
        return `translate3d(${distance}px, 0, 0)`;
      case "right":
        return `translate3d(-${distance}px, 0, 0)`;
      case "none":
      default:
        return "none";
    }
  };

  const style: React.CSSProperties = {
    opacity: !isMounted || isVisible ? 1 : 0,
    transform: getTransform(),
    transitionProperty: "opacity, transform",
    transitionDuration: `${durationMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    transitionDelay: isVisible ? `${delayMs}ms` : "0ms",
    willChange: isVisible ? "auto" : "opacity, transform",
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

export default ScrollReveal;

