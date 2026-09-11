"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type IrParaAutenticacaoButtonProps = {
  destino: string;
  // Se true, a sessão atual (de outra conta) precisa ser encerrada antes de
  // navegar — senão login/cadastro simplesmente redirecionam de volta pro
  // dashboard por já haver uma sessão válida, mesmo sendo a conta errada.
  precisaSairPrimeiro: boolean;
  children: ReactNode;
};

export function IrParaAutenticacaoButton({
  destino,
  precisaSairPrimeiro,
  children,
}: IrParaAutenticacaoButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function continuar() {
    startTransition(async () => {
      if (precisaSairPrimeiro) {
        await fetch("/api/logout", { method: "POST" });
      }

      router.push(destino);
      router.refresh();
    });
  }

  return (
    <Button disabled={pending} onClick={continuar}>
      {pending ? "Aguarde..." : children}
    </Button>
  );
}
