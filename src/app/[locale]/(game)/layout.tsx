export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The game is exactly one window tall; below the minimum the page scrolls (see globals.css, "Window-fitting layout").
    <div className="flex h-dvh min-h-(--layout-min-height) min-w-(--layout-min-width) flex-col">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
