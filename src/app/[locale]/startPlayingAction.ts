"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { startPlayerSession } from "@/lib/session/startPlayerSession";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { signInAsGuest } from "@/lib/supabase/signInAsGuest";
import { prismaUserRepository } from "@/lib/persistence/prismaUserRepository";
import { parseCaptchaTokenFormValue } from "@/lib/forms/parseCaptchaTokenFormValue";

// Takes no game state — an intent, not state (CLAUDE.md, "Security /
// anti-cheat model") — only an optional CAPTCHA token, which is a
// credential Supabase verifies; a tampered token can only get the sign-in
// rejected. This is the only place a guest session is created.
// Error UX is deliberately deferred to part two: no try/catch here —
// redirect() works by throwing, and any other error should reach Next's
// own error handling rather than being caught, wrapped, or swallowed here.
export async function startPlayingAction(formData: FormData): Promise<void> {
  const captchaToken = parseCaptchaTokenFormValue(
    formData.get("cf-turnstile-response"),
  );

  await startPlayerSession(
    {
      readCurrentUserId,
      signInAsGuest,
      userRepository: prismaUserRepository,
    },
    captchaToken,
  );

  const locale = await getLocale();

  redirect({ href: "/saves", locale });
}
