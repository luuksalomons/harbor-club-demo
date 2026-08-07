"use client";

import { useEffect, useRef, useState, type ElementType, type HTMLAttributes } from "react";

// Fades and slides content in once it scrolls into view. Under
// prefers-reduced-motion, .reveal in globals.css forces the visible state
// regardless of this class, so no matchMedia check is needed here.
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
