import { pointerIntersection } from "@dnd-kit/collision";

// Phase 16: every camp drop target collides on the pointer only. dnd-kit's
// default detector falls back to the overlap of the dragged copy's box
// when the pointer is over no target; the drag overlay draws a shrunken
// card inside a full-size box, so that fallback could drop onto a slot the
// small card doesn't seem to touch. With the pointer only, a drop in a gap
// between targets does nothing. Pass it as every camp useDroppable's
// collisionDetector (campDropCollision.test.tsx checks each one).
export const campDropCollisionDetector = pointerIntersection;
