import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between border-b border-iron-900/40 bg-marble-300 px-4 py-1.5">
        <span className="text-sm font-semibold tracking-wide text-marble-50">
          Super Auto Dwarves
        </span>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-marble-50 hover:bg-marble-200 hover:text-white"
        >
          <Link href="/">← Menu</Link>
        </Button>
      </div>

      {/* ── Roster ────────────────────────────────────── */}
      <RosterSlab />
    </header>
  );
}
