// A catch-all for paths inside a locale that match no route.
import { notFound } from "next/navigation";

// Catches unknown paths inside a locale so they reach [locale]/not-found.tsx
// (next-intl's pattern).
export default function UnknownPathPage() {
  notFound();
}
