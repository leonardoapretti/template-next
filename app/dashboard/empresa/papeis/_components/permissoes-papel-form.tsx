"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PermissionMatrixField } from "@/components/permission-matrix-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/dialog-drawer";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/utils/routes";
import { atualizarPermissoesPapelAction, removerPapelAction, renomearPapelAction } from "./actions";

type PermissoesPapelFormProps = {
  papel: { id: string; nome: string; padraoSistema: boolean; podeExcluir: boolean };
  podeGerenciar: boolean;
  valoresIniciais: Record<string, boolean>;
};

export function PermissoesPapelForm({
  papel,
  podeGerenciar,
  valoresIniciais,
}: PermissoesPapelFormProps) {
  const router = useRouter();
  const [nome, setNome] = useState(papel.nome);
  const [valores, setValores] = useState<Record<string, boolean>>(valoresIniciais);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [pending, startTransition] = useTransition();

  function salvar() {
    startTransition(async () => {
      if (!papel.padraoSistema && nome.trim() !== papel.nome) {
        const resultadoNome = await renomearPapelAction({ id: papel.id, nome: nome.trim() });

        if (!resultadoNome.success) {
          toast.error(resultadoNome.errorMessage ?? "Não foi possível renomear o perfil.");
          return;
        }
      }

      const resultado = await atualizarPermissoesPapelAction({ id: papel.id, permissoes: valores });

      if (!resultado.success) {
        toast.error(resultado.errorMessage ?? "Não foi possível salvar as permissões.");
        return;
      }

      toast.success("Perfil atualizado.");
      router.refresh();
    });
  }

  function excluir() {
    startTransition(async () => {
      const resultado = await removerPapelAction({ id: papel.id });
      setConfirmandoExclusao(false);

      if (!resultado.success) {
        toast.error(resultado.errorMessage ?? "Não foi possível excluir o perfil.");
        return;
      }

      toast.success("Perfil excluído.");
      router.push(routes.empresa.papeis);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {papel.padraoSistema ? (
            <>
              <CardTitle>{papel.nome}</CardTitle>
              <Badge variant="outline">Padrão do sistema</Badge>
            </>
          ) : podeGerenciar ? (
            <Input
              className="h-9 max-w-56"
              onChange={(event) => setNome(event.target.value)}
              value={nome}
            />
          ) : (
            <CardTitle>{papel.nome}</CardTitle>
          )}
        </div>

        {podeGerenciar && (
          <div className="flex items-center gap-2">
            {papel.podeExcluir && (
              <Button
                onClick={() => setConfirmandoExclusao(true)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            )}
            <Button disabled={pending} onClick={salvar}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className={podeGerenciar ? undefined : "pointer-events-none opacity-70"}>
          <PermissionMatrixField onChange={setValores} valores={valores} />
        </div>
      </CardContent>

      <AlertDialog onOpenChange={setConfirmandoExclusao} open={confirmandoExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              "{papel.nome}" será removido permanentemente. Só é possível excluir perfis sem membros
              vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={excluir}>
              {pending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
