"use client";

import { useActionState } from "react";
import { setPassword } from "./actions";
import { AuthHero } from "@/components/auth-hero";
import { Spinner } from "@/components/spinner";

const initialState = { error: "" };

export default function SetPasswordPage() {
  const [state, formAction, pending] = useActionState(setPassword, initialState);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AuthHero />

      <div className="-mt-6 flex flex-1 items-start justify-center px-4 pb-10 sm:-mt-10">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-lg shadow-primary/10">
          <h1 className="mb-1 text-xl font-semibold text-primary">
            Welkom bij Royal Mission Portal
          </h1>
          <p className="mb-6 text-sm text-foreground/70">
            Stel hieronder je wachtwoord in om je account te activeren.
          </p>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Nieuw wachtwoord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="mb-1 block text-sm font-medium">
                Herhaal wachtwoord
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
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
              {pending ? "Bezig..." : "Wachtwoord instellen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
