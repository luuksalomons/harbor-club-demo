"use client";

import { useActionState } from "react";
import { setPassword } from "./actions";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

const initialState = { error: "" };

export default function SetPasswordPage() {
  const [state, formAction, pending] = useActionState(setPassword, initialState);

  return (
    <AuthLayout title="Welcome to Harbor Club Portal" description="Set your password below to activate your account.">
      <form action={formAction} className="flex flex-col gap-5">
        <Input
          name="password"
          type="password"
          label="New password"
          isRequired
          minLength={8}
          autoComplete="new-password"
          hint="Must be at least 8 characters."
        />
        <Input name="confirm" type="password" label="Repeat password" isRequired minLength={8} autoComplete="new-password" />

        {state?.error && <p className="text-sm text-error-primary">{state.error}</p>}

        <Button type="submit" size="lg" isLoading={pending} showTextWhileLoading className="mt-1">
          {pending ? "Saving..." : "Set password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
