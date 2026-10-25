"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { startPlayerSession } from "@/lib/session/startPlayerSession";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { signInAsGuest } from "@/lib/supabase/signInAsGuest";
import { prismaUserRepository } from "@/lib/persistence/prismaUserRepository";

// Takes no client input — an intent, not state (CLAUDE.md, "Security /
// anti-cheat model"). This is the only place a guest session is created.
// Error UX is deliberately deferred to part two: no try/catch here —
// redirect() works by throwing, and any other error should reach Next's
// own error handling rather than being caught, wrapped, or swallowed here.
export async function startPlayingAction(): Promise<void> {
  await startPlayerSession({
    readCurrentUserId,
    signInAsGuest,
    userRepository: prismaUserRepository,
  });

  const locale = await getLocale();

  redirect({ href: "/saves", locale });
}
