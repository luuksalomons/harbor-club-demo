import Link from "next/link";
import { cx } from "@/utils/cx";

// Untitled UI button group, rendered as links (e.g. to switch between groups
// via the URL).
export function ButtonGroupLinks({ items }: { items: { href: string; label: string; current: boolean }[] }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg shadow-xs ring-1 ring-primary ring-inset">
      {items.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          className={cx(
            "shrink-0 px-4 py-2 text-sm font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
            i > 0 && "border-l border-primary",
            i === 0 && "rounded-l-lg",
            i === items.length - 1 && "rounded-r-lg",
            item.current ? "bg-secondary text-primary" : "bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
