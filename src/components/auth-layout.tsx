import type { ReactNode } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { LogoMark } from "@/components/logo";

// Shared shell for the standalone auth screens (login, set password):
// Untitled UI's centred "log in" layout with the brand mark on top.
export function AuthLayout({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-primary">
      <DemoBanner />
      <div className="relative flex flex-1 flex-col items-center overflow-hidden px-4 pt-12 pb-12 sm:pt-24">
        {/* Subtle grid pattern behind the header, fading out downwards. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[linear-gradient(to_right,var(--color-border-secondary)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-secondary)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)] bg-[size:48px_48px]"
        />
        <div className="relative flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="size-12 rounded-xl text-display-xs" />
            <h1 className="mt-6 text-display-xs font-semibold text-primary sm:text-display-sm">{title}</h1>
            <p className="mt-2 text-md text-tertiary">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
