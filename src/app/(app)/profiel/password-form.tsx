"use client";

import { useActionState } from "react";
import { updateOwnPassword } from "./actions";
import { Spinner } from "@/components/spinner";

const initialState = { error: "", success: false };

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(updateOwnPassword, initialState);

  return (
    <form action={formAction} className="max-w-sm space-y-3">
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
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
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
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      {state.error && <p className="text-sm text-primary-dark">{state.error}</p>}
      {state.success && <p className="text-sm text-accent">Wachtwoord gewijzigd.</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-3.5 w-3.5" />}
        {pending ? "Bezig..." : "Wachtwoord wijzigen"}
      </button>
    </form>
  );
}
