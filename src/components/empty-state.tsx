import type { FC, ReactNode } from "react";
import { SearchLg } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

// Compact Untitled UI empty state: featured icon, title and supporting text.
export function EmptyState({
  icon = SearchLg,
  title,
  description,
  children,
}: {
  icon?: FC<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <FeaturedIcon icon={icon} color="gray" theme="modern" size="lg" />
      <p className="mt-4 text-md font-semibold text-primary">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-tertiary">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
