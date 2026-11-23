import { Card, CardContent } from "@/components/ui/card";
import { HowToPlayDialog } from "@/components/menu/HowToPlayDialog";
import { MenuCardTransition } from "@/components/menu/MenuCardTransition";
import { PlayForm } from "@/components/menu/PlayForm";
import { requiresHumanCheck } from "@/lib/session/requiresHumanCheck";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { startPlayingAction } from "../startPlayingAction";

// Only reads the session, to decide whether the Play form needs a CAPTCHA;
// it never signs anyone in (CLAUDE.md, "Persistence & save model").
export default async function HomePage() {
  const visitorRequiresHumanCheck = await requiresHumanCheck(readCurrentUserId);

  return (
    <MenuCardTransition enterFrom="left">
      <Card className="w-full">
        <CardContent className="flex flex-col gap-3">
          <PlayForm
            requiresHumanCheck={visitorRequiresHumanCheck}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            playAction={startPlayingAction}
          />
          <HowToPlayDialog />
        </CardContent>
      </Card>
    </MenuCardTransition>
  );
}
