"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border bg-muted">
          <FileQuestion className="size-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Recurso não encontrado</h1>

          <p className="text-sm text-muted-foreground">
            Não foi possível localizar o recurso desejado.
          </p>
        </div>

        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/">Voltar ao início</Link>}
        />
      </div>
    </main>
  );
}
