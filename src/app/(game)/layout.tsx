import { GameHeader } from "@/components/game/GameHeader";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
