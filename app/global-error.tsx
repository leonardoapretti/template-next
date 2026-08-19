"use client";

import { useEffect } from "react";
import logger from "@/lib/logger/src";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, "Erro fatal não tratado na aplicação");
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Algo deu muito errado
            </h1>

            <p style={{ fontSize: "0.875rem", color: "#71717a", marginBottom: "1.5rem" }}>
              A aplicação encontrou um erro inesperado. Tente recarregar a página.
            </p>

            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#18181b",
                color: "#fafafa",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
