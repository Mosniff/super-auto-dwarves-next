export function hpBarFillRatio(currentHp: number, maxHp: number): number {
  if (maxHp <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, currentHp / maxHp));
}
