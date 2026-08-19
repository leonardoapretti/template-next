import { WifiOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <WifiOff className="size-6" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground">Você está offline</h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Não foi possível carregar esta página agora. Verifique sua conexão e tente novamente.
        </p>

        <Button
          className="mt-5"
          nativeButton={false}
          render={<Link href="/">Voltar ao início</Link>}
        />
      </div>
    </main>
  );
}
