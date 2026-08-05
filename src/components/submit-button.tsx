"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./spinner";

export function SubmitButton({
  children,
  pendingText,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70 ${className}`}
      {...props}
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
