"use client";

import { useActionState } from "react";
import { updateOwnPassword } from "./actions";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

const initialState = { error: "", success: false };

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(updateOwnPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Input name="password" label="New password" type="password" isRequired minLength={8} autoComplete="new-password" />
      <Input name="confirm" label="Repeat password" type="password" isRequired minLength={8} autoComplete="new-password" />

      {state.error && <p className="text-sm text-error-primary">{state.error}</p>}
      {state.success && <p className="text-sm text-success-primary">Password changed.</p>}

      <div className="flex justify-end">
        <Button type="submit" size="md" isLoading={pending} showTextWhileLoading>
          {pending ? "Saving..." : "Change password"}
        </Button>
      </div>
    </form>
  );
}
