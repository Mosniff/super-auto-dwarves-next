interface RosterSlotProps {
  index: number;
}

export function RosterSlot({ index }: RosterSlotProps) {
  return (
    <div className="relative flex aspect-3/4 items-center justify-center rounded-md bg-marble-200">
      <span className="select-none text-xs font-medium text-stone-500/60">
        {index + 1}
      </span>
    </div>
  );
}
