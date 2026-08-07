"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/auth";
import type { FeatureFlags } from "@/lib/features";
import { signOut } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const NAV_ITEMS = [
  { href: "/", label: "Home", key: null },
  { href: "/news", label: "News", key: "nieuws" },
  { href: "/schedule", label: "Schedule", key: "rooster" },
  { href: "/messages", label: "Messages", key: "berichten" },
  { href: "/contact", label: "Contact Requests", key: "zorg" },
] as const;

export function Nav({ profile, features }: { profile: Profile; features: FeatureFlags }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const navItems = NAV_ITEMS.filter((item) => item.key === null || features[item.key] !== false);

  // Closes the mobile menu automatically on navigation (updated during
  // render rather than in an effect, per the React docs on syncing state
  // with a prop that changes).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/brand/harbor-logo-white.svg"
            alt="Harbor Club"
            width={140}
            height={17}
            className="h-4 w-auto"
            priority
          />
        </Link>

        {/* Desktop: everything visible at once */}
        <div className="hidden min-w-0 items-center gap-3 text-sm sm:flex">
          <Link href="/profile" className="truncate text-white/80 hover:text-white">
            {profile.full_name || profile.email}{" "}
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs uppercase text-primary-dark">
              {ROLE_LABELS[profile.role]}
            </span>
          </Link>
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="shrink-0 rounded border border-white/30 px-2 py-0.5 text-xs text-white/80 hover:border-accent hover:text-white"
            >
              Admin
            </Link>
          )}
          <form action={signOut}>
            <SubmitButton className="shrink-0 !p-0 text-white/80 hover:text-white" pendingText="Signing out...">
              Sign out
            </SubmitButton>
          </form>
        </div>

        {/* Mobile: hamburger button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex shrink-0 items-center justify-center rounded-md border border-white/30 p-2 text-white sm:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Desktop: nav row */}
      <nav className="mt-3 hidden gap-4 text-sm sm:flex">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="text-white/80 hover:text-white">
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile: dropdown menu */}
      {open && (
        <div className="mt-3 space-y-1 border-t border-white/20 pt-3 text-sm sm:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-2 py-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="block rounded-md px-2 py-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              Admin
            </Link>
          )}
          <Link
            href="/profile"
            className="block rounded-md px-2 py-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            {profile.full_name || profile.email}{" "}
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs uppercase text-primary-dark">
              {ROLE_LABELS[profile.role]}
            </span>
          </Link>
          <form action={signOut}>
            <SubmitButton
              className="block w-full rounded-md px-2 py-2 !justify-start text-left text-white/80 hover:bg-white/10 hover:text-white"
              pendingText="Signing out..."
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
