"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { solicitarAlteracaoSenhaAction } from "./actions";

export function AlterarSenhaCard() {
  const [enviado, setEnviado] = useState(false);
  const [isPending, startTransition] = useTransition();

  function enviarLink() {
    startTransition(async () => {
      const result = await solicitarAlteracaoSenhaAction();

      if (!result.success) {
        toast.error(result.errorMessage ?? "Não foi possível enviar o link.");
        return;
      }

      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <p className="text-sm text-muted-foreground">
        Enviamos um link de alteração de senha para o seu e-mail. Acesse-o para definir a nova
        senha.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Enviaremos um link para o seu e-mail atual. Ao acessá-lo, você poderá definir uma nova senha
        — depois disso, sua sessão atual será encerrada e será necessário fazer login novamente.
      </p>

      <Button disabled={isPending} onClick={enviarLink}>
        {isPending ? "Enviando..." : "Enviar link para alterar senha"}
      </Button>
    </div>
  );
}
