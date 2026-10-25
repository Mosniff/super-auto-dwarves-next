"use client";

import { motion, useReducedMotion } from "motion/react";

// Enter-only: Next.js replaces pages instantly on navigation, so there is no
// opportunity for an exit animation — only the entering page's card animates.
// Direction is chosen per page (left for the main menu, right for saves) so
// the two cards appear to slide past each other across a navigation.
export function MenuCardTransition({
  enterFrom,
  children,
}: {
  enterFrom: "left" | "right";
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();
  const offsetX = enterFrom === "left" ? -48 : 48;

  return (
    <motion.div
      className="w-full max-w-sm"
      initial={prefersReducedMotion ? false : { x: offsetX, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
