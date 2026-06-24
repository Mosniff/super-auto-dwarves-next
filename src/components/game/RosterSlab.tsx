import { RosterSlot } from "./RosterSlot";

const SLOT_COUNT = 7;

export function RosterSlab() {
  return (
    <div className="w-full bg-linear-to-b from-marble-100 via-marble-200 to-marble-300 px-5 py-4">
      <div className="mx-auto grid max-w-5xl grid-cols-7 gap-3">
        {Array.from({ length: SLOT_COUNT }).map((_, i) => (
          <RosterSlot key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
