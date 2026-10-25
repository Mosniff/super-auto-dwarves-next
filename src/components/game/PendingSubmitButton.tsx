"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

// Must be rendered inside the <form> whose pending status it reflects —
// useFormStatus reads the nearest ancestor form's submission state.
// Disabling while pending is the client half of the double-advance
// protection; the server-side expected-phase check in advanceGameForUser
// (CLAUDE.md, "Security / anti-cheat model") is the other half.
interface PendingSubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
}

export function PendingSubmitButton({
  children,
  className,
  size,
  variant,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={className}
      size={size}
      variant={variant}
    >
      {children}
    </Button>
  );
}
