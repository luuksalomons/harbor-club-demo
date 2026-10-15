import { cx } from "@/utils/cx";

// Harbor Club logo: brand mark plus wordmark. Drawn in code (rather than the
// white SVG in /public/brand) so it follows the light/dark text colour.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-solid text-md font-bold text-accent shadow-xs-skeuomorphic",
        className,
      )}
    >
      H
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-md font-semibold text-primary">Harbor Club</span>
    </span>
  );
}
