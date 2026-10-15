"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Announcement02,
  CalendarDate,
  HomeLine,
  LifeBuoy01,
  LogOut01,
  Menu02,
  MessageChatCircle,
  Settings01,
  XClose,
} from "@untitledui/icons";
import type { Profile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import type { FeatureFlags } from "@/lib/features";
import { initials } from "@/lib/initials";
import { signOut } from "./actions";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { cx } from "@/utils/cx";

const NAV_ITEMS = [
  { href: "/", label: "Home", key: null, icon: HomeLine },
  { href: "/news", label: "News", key: "nieuws", icon: Announcement02 },
  { href: "/schedule", label: "Schedule", key: "rooster", icon: CalendarDate },
  { href: "/messages", label: "Messages", key: "berichten", icon: MessageChatCircle },
  { href: "/contact", label: "Contact Requests", key: "zorg", icon: LifeBuoy01 },
] as const;

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ profile, features }: { profile: Profile; features: FeatureFlags }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const navItems = NAV_ITEMS.filter((item) => item.key === null || features[item.key] !== false);
  const displayName = profile.full_name || profile.email;

  // Closes the mobile menu automatically on navigation (updated during
  // render rather than in an effect, per the React docs on syncing state
  // with a prop that changes).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const content = (
    <>
      <nav aria-label="Main" className="px-2 lg:px-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavItemBase type="link" href={item.href} icon={item.icon} current={isActive(item.href, pathname)}>
                {item.label}
              </NavItemBase>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-4 px-2 pt-6 pb-4 lg:px-4 lg:pb-6">
        {profile.role === "admin" && (
          <ul>
            <li>
              <NavItemBase type="link" href="/admin" icon={Settings01} current={isActive("/admin", pathname)}>
                Admin
              </NavItemBase>
            </li>
          </ul>
        )}

        <div className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
          <Link
            href="/profile"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Avatar size="md" initials={initials(displayName)} alt={displayName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{displayName}</p>
              <div className="mt-0.5">
                <Badge type="pill-color" color="brand" size="sm">
                  {ROLE_LABELS[profile.role]}
                </Badge>
              </div>
            </div>
          </Link>
          <form action={signOut} className="shrink-0">
            <SubmitButton color="tertiary" size="sm" iconLeading={LogOut01} aria-label="Sign out" />
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col overflow-y-auto border-r border-secondary bg-primary pt-6 lg:flex">
        <Link
          href="/"
          aria-label="Go to home"
          className="mx-5 mb-6 self-start rounded-md outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Logo />
        </Link>
        {content}
      </aside>

      {/* Mobile: top bar with a menu that drops down below it */}
      <div className="sticky top-0 z-20 border-b border-secondary bg-primary lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" aria-label="Go to home" className="rounded-md outline-focus-ring focus-visible:outline-2">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex size-10 items-center justify-center rounded-lg text-fg-secondary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
          >
            {open ? <XClose className="size-6" /> : <Menu02 className="size-6" />}
          </button>
        </div>
        <div className={cx("flex-col border-t border-secondary pt-4", open ? "flex" : "hidden")}>{content}</div>
      </div>
    </>
  );
}
