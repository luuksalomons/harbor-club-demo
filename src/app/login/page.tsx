"use client";

import { useActionState } from "react";
import { signIn } from "./actions";
import { AuthHero } from "@/components/auth-hero";
import { Spinner } from "@/components/spinner";
import { DemoBanner } from "@/components/demo-banner";

const initialState = { error: "" };

const DEMO_LOGINS = [
  { role: "Admin", email: "admin@harborclub.example" },
  { role: "Board", email: "board@harborclub.example" },
  { role: "Member", email: "member@harborclub.example" },
];
const DEMO_PASSWORD = "HarborDemo2026!";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <DemoBanner />
      <AuthHero />

      <div className="-mt-6 flex flex-1 flex-col items-center gap-6 px-4 pb-10 sm:-mt-10">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-lg shadow-primary/10">
          <h1 className="mb-1 text-xl font-semibold text-primary">Portal</h1>
          <p className="mb-6 text-sm text-foreground/70">
            Log in with one of the demo accounts below, or the account an admin created for you.
          </p>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {state?.error && <p className="text-sm text-primary-dark">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-wait disabled:opacity-60"
            >
              {pending && <Spinner className="h-3.5 w-3.5" />}
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-accent/40 bg-accent/10 p-5 text-sm">
          <p className="mb-2 font-medium text-primary-dark">Demo logins (password: {DEMO_PASSWORD})</p>
          <ul className="space-y-1 text-foreground/80">
            {DEMO_LOGINS.map((l) => (
              <li key={l.email}>
                <span className="font-medium">{l.role}:</span> {l.email}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
