import { Button } from "@/components/ui/button";

const ROD_GRADIENT =
  "linear-gradient(to bottom, var(--color-parchment-200), var(--color-parchment-50) 45%, var(--color-parchment-400))";
const ROD_SHADOW = "0 2px 4px rgba(0,0,0,0.35)";

const LOG_LINES = [
  "Borin strikes Grukk for 4.",
  "Grukk strikes Borin for 5.",
  "Thrudi strikes Skarna for 6.",
  "Skarna faints.",
  "Mordek strikes Thrudi for 9.",
  "Thrudi faints.",
];

export function InfoScroll() {
  return (
    <div className="flex h-full flex-col">
      <div
        className="-mx-1 h-4 rounded-full"
        style={{ background: ROD_GRADIENT, boxShadow: ROD_SHADOW }}
      />

      <div
        className="flex flex-1 flex-col bg-parchment-100 p-4"
        style={{ boxShadow: "inset 0 0 24px rgba(120,90,40,0.35)" }}
      >
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {LOG_LINES.map((line, i) => (
            <li key={i} className="text-sm text-ink-700">
              {line}
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900"
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900"
          >
            Advance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900"
          >
            Auto
          </Button>
        </div>
      </div>

      <div
        className="-mx-1 h-4 rounded-full"
        style={{ background: ROD_GRADIENT, boxShadow: ROD_SHADOW }}
      />
    </div>
  );
}
