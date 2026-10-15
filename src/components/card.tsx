import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/utils/cx";

// Untitled UI surface: white card with a subtle ring and shadow.
export function Card({
  as: Tag = "div",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return <Tag className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)} {...props} />;
}

// Card header with a title, optional supporting text and actions, separated
// from the body by a divider.
export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3 border-b border-secondary px-4 py-4 sm:px-6 sm:py-5", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        {description && <p className="mt-1 text-sm text-tertiary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
