"use client";

import { useEffect, useRef, useState, type ElementType, type HTMLAttributes } from "react";

// Fades and slides content in once it scrolls into view. Renders visible
// immediately for prefers-reduced-motion (also enforced in CSS as the
// authoritative fallback — see .reveal in globals.css).
export function Reveal({
  as: Tag = "div",
  className = "",
  style,
  delayMs = 0,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType; delayMs?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: visible && delayMs ? `${delayMs}ms` : undefined, ...style }}
      {...props}
    />
  );
}
