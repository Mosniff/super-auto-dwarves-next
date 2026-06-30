import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLAYER_TEAM } from "@/lib/dummy-battle";
import { RosterSlab } from "./RosterSlab";

export function GameHeader() {
  return (
    <header
      className="w-full"
      style={{
        boxShadow: "var(--shadow-slab)",
        borderBottom: "var(--slab-base-border)",
      }}
    >
      {/* ── Utility strip ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-iron-900/40 bg-slate-300 px-4 py-1.5">
        <span className="text-sm font-semibold tracking-wide text-slate-50">
          Super Auto Dwarves
        </span>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-50 hover:bg-slate-200 hover:text-white"
        >
          <Link href="/">← Menu</Link>
        </Button>
      </div>

      {/* ── Roster ────────────────────────────────────── */}
      <RosterSlab characters={PLAYER_TEAM} variant="player" />
    </header>
  );
}
