"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import logger from "@/lib/logger/src";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, "Erro não tratado em uma página");
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>

          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado ao carregar esta página. Você pode tentar novamente.
          </p>
        </div>

        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </main>
  );
}
