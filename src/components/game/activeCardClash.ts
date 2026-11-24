// The front cards' clash keyframes (Phase 15). The x offsets are
// percentages of the front card's own width (motion's x percentages are
// relative to the animated element, which wraps exactly the card frame),
// so the clash scales with --active-card-height. The values are the
// human's tuning on the old 288px-wide card (180, 60 and 8 px); the human
// tunes them.
const WIND_UP_OFFSET_PERCENT = 62.5;
const LUNGE_OFFSET_PERCENT = 20.8;
const OVERSHOOT_OFFSET_PERCENT = 2.8;
const LEAN_DEGREES = 15; // deep lean-back during wind-up
const FOLLOW_THROUGH_DEGREES = 5; // smaller swing past neutral on the lunge

export interface ClashKeyframes {
  xOffsets: string[];
  rotationDegrees: number[];
}

export function clashKeyframes(facing: "left" | "right"): ClashKeyframes {
  // Player faces right and lunges toward +x; enemy faces left and lunges
  // toward -x — opposite signs make the two cards converge on each other.
  const lungeDirection = facing === "right" ? 1 : -1;
  // Cards lean BACK (away from their lunge) during wind-up. In CSS, positive
  // rotate is clockwise. Player (facing right) leans anti-clockwise
  // (negative); enemy (facing left) leans clockwise (positive). Note this is
  // the OPPOSITE sign to lungeDirection.
  const leanDirection = -lungeDirection;
  return {
    xOffsets: [
      "0%",
      `${-lungeDirection * WIND_UP_OFFSET_PERCENT}%`,
      `${lungeDirection * LUNGE_OFFSET_PERCENT}%`,
      `${-lungeDirection * OVERSHOOT_OFFSET_PERCENT}%`,
      "0%",
    ],
    rotationDegrees: [
      0, // start: neutral
      leanDirection * LEAN_DEGREES, // 0.35 wind-up: deep lean back
      -leanDirection * FOLLOW_THROUGH_DEGREES, // 0.55 lunge: swung THROUGH neutral to a smaller opposite angle
      0, // 0.8 overshoot: already returned to neutral
      0, // 1 settle: neutral
    ],
  };
}
