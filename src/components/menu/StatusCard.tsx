// The shared card for the error and not-found pages, so both look alike.
// No hooks, so it stays importable from both client and server components.
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  description: string;
  actions: ReactNode;
}

export function StatusCard({ title, description, actions }: StatusCardProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4 text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <div className="flex flex-col gap-3">{actions}</div>
        </CardContent>
      </Card>
    </main>
  );
}
