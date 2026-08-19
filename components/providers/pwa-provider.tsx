"use client";

import { usePwaInstall } from "@/hooks/use-pwa-install";

interface PWAProviderProps {
  appName: string;
}

export default function PWAProvider({ appName }: PWAProviderProps) {
  const { canInstall, isDismissed, install, dismiss } = usePwaInstall(appName);

  if (!canInstall || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label={`Instalar aplicativo ${appName}`}
      className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-xl"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M12 16V4m0 12-4-4m4 4 4-4M4 20h16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Instalar {appName}</p>
        <p className="truncate text-xs text-muted-foreground">Acesse sem abrir o navegador</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          aria-label="Dispensar"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={dismiss}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={install}
          type="button"
        >
          Instalar
        </button>
      </div>
    </aside>
  );
}
