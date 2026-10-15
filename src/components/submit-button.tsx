"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/base/buttons/button";

// Untitled UI button that submits its form and shows a spinner (plus the
// optional pendingText) while the server action runs.
export function SubmitButton({
  children,
  pendingText,
  ...props
}: Omit<ButtonProps, "type" | "isLoading"> & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" isLoading={pending} showTextWhileLoading={!!pendingText} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
