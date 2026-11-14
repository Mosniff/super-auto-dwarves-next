// A light line plus a dark shadow line beside it reads as a groove cut
// into the bar; it fades out at both ends via the gradient so it never
// touches the bar's top or bottom. Decorative only — aria-hidden, no
// hooks, no "use client", so it can render inside a Server Component
// header.
export function HeaderDivider() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-px shrink-0 rounded-full"
      style={{
        height: "var(--header-divider-height)",
        background:
          "linear-gradient(to bottom, transparent, var(--header-divider-light) 25%, var(--header-divider-light) 75%, transparent)",
        boxShadow: "1px 0 0 var(--header-divider-dark)",
      }}
    />
  );
}
