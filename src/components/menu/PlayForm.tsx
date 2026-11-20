"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";

interface PlayFormProps {
  requiresHumanCheck: boolean;
  turnstileSiteKey: string | undefined;
  playAction: (formData: FormData) => Promise<void>;
}

// The home page's Play form. A new visitor (no session) gets a Cloudflare
// Turnstile widget inside the form, in the current locale; it injects its
// token as a hidden cf-turnstile-response input, so the token is submitted
// with Play and startPlayingAction passes it on to Supabase. Play stays
// disabled until the widget reports success, and disables again if the
// token expires or the widget errors. With no site key configured there is
// no widget and Play is enabled — a deliberate dev and test convenience;
// production always has the key.
export function PlayForm({
  requiresHumanCheck,
  turnstileSiteKey,
  playAction,
}: PlayFormProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [hasCaptchaToken, setHasCaptchaToken] = useState(false);
  const showsHumanCheck =
    requiresHumanCheck &&
    turnstileSiteKey !== undefined &&
    turnstileSiteKey !== "";

  return (
    <form
      action={playAction}
      className="flex w-full flex-col items-center gap-3"
    >
      {showsHumanCheck && (
        <Turnstile
          siteKey={turnstileSiteKey}
          options={{ language: locale }}
          onSuccess={() => setHasCaptchaToken(true)}
          onExpire={() => setHasCaptchaToken(false)}
          onError={() => setHasCaptchaToken(false)}
        />
      )}
      <PendingSubmitButton
        className="w-full"
        size="lg"
        disabled={showsHumanCheck && !hasCaptchaToken}
      >
        {t("play")}
      </PendingSubmitButton>
    </form>
  );
}
