"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PermissionMatrixField } from "@/components/permission-matrix-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PermissionKey } from "@/lib/access-control/permission-registry";
import { salvarMatrizPlanoAction } from "./actions";

type MatrizPlanoFormProps = {
  planoId: string;
  valoresIniciais: Record<PermissionKey, boolean>;
};

export function MatrizPlanoForm({ planoId, valoresIniciais }: MatrizPlanoFormProps) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, boolean>>(valoresIniciais);
  const [pending, startTransition] = useTransition();

  function salvar() {
    startTransition(async () => {
      const resultado = await salvarMatrizPlanoAction({ planoId, permissoes: valores });

      if (!resultado.success) {
        toast.error(resultado.errorMessage ?? "Não foi possível salvar a matriz de permissões.");
        return;
      }

      toast.success("Permissões do plano atualizadas.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Recursos e operações</CardTitle>
        <Button disabled={pending} onClick={salvar}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </CardHeader>

      <CardContent>
        <PermissionMatrixField onChange={setValores} valores={valores} />
      </CardContent>
    </Card>
  );
}
