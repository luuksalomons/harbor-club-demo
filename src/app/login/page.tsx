"use client";

import { useActionState } from "react";
import { InfoCircle } from "@untitledui/icons";
import { signIn } from "./actions";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

const initialState = { error: "" };

const DEMO_LOGINS = [
  { role: "Admin", email: "admin@harborclub.example" },
  { role: "Board", email: "board@harborclub.example" },
  { role: "Member", email: "member@harborclub.example" },
];
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "HarborDemo2026!";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <AuthLayout
      title="Log in to your account"
      description="Use one of the demo accounts below, or the account an admin created for you."
    >
      <form action={formAction} className="flex flex-col gap-5">
        <Input name="email" type="email" label="Email" isRequired autoComplete="email" placeholder="Enter your email" />
        <Input name="password" type="password" label="Password" isRequired autoComplete="current-password" placeholder="••••••••" />

        {state?.error && <p className="text-sm text-error-primary">{state.error}</p>}

        <Button type="submit" size="lg" isLoading={pending} showTextWhileLoading className="mt-1">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="flex gap-4 rounded-xl bg-secondary p-4 ring-1 ring-secondary ring-inset">
        <FeaturedIcon icon={InfoCircle} color="brand" theme="outline" size="sm" className="mt-0.5 ml-1" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-secondary">Demo logins</p>
          <p className="mt-0.5 text-tertiary">
            Password: <span className="font-medium text-secondary">{DEMO_PASSWORD}</span>
          </p>
          <ul className="mt-2 space-y-1 text-tertiary">
            {DEMO_LOGINS.map((l) => (
              <li key={l.email} className="truncate">
                <span className="font-medium text-secondary">{l.role}:</span> {l.email}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuthLayout>
  );
}
