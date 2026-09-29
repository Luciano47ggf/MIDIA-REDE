"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Não foi possível carregar esta página</h1>
        <p className="mt-2 text-muted">Verifique a conexão e tente de novo. Se continuar, avise a equipe de mídia.</p>
        <Button size="lg" className="mt-6" onClick={reset}>
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
