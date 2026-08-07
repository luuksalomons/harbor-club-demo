"use client";

import { useRef, type ElementType, type HTMLAttributes } from "react";

const MAX_TILT_DEG = 6;

// Subtle 3D tilt on hover, driven by cursor position relative to the card.
// Reduced-motion users get the layered shadow without any movement (also
// enforced in CSS as the authoritative fallback — see .tilt-card in
// globals.css).
export function TiltCard({
  as: Tag = "div",
  className = "",
  onMouseMove,
  onMouseLeave,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  const ref = useRef<HTMLElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    onMouseMove?.(e);
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * MAX_TILT_DEG * 2;
    const rotateX = (0.5 - py) * MAX_TILT_DEG * 2;
    el.style.setProperty("--tilt-x", `${rotateX}deg`);
    el.style.setProperty("--tilt-y", `${rotateY}deg`);
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLElement>) {
    onMouseLeave?.(e);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`tilt-card ${className}`}
      {...props}
    />
  );
}
