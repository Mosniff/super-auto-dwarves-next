"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

// Must be rendered inside the <form> whose pending status it reflects —
// useFormStatus reads the nearest ancestor form's submission state.
// Disabling while pending is the client half of the double-advance
// protection; the server-side expected-phase check in advanceGameForUser
// (CLAUDE.md, "Security / anti-cheat model") is the other half. Callers
// may also disable it for their own reasons (e.g. the phase-advance
// button staying disabled until the present screen reports it's allowed).
interface PendingSubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  disabled?: boolean;
}

export function PendingSubmitButton({
  children,
  className,
  size,
  variant,
  disabled,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className={className}
      size={size}
      variant={variant}
    >
      {children}
    </Button>
  );
}
