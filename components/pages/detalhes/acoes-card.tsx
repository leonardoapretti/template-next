"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { PaginaDetalhes } from ".";

type ExclusaoResult = { success: boolean; errorMessage: string | null };

// Card padrão de ações mínimas de CRUD pra páginas de detalhe (ver
// design-system/references/admin.md — toda página de detalhe deve ter
// este card, geralmente como primeira seção da sidebar). Edição é um
// link (pra uma página/form dedicado); exclusão pede confirmação e
// chama a server action informada.
function DetalhesAcoesCard({
  editarHref,
  onExcluir,
  tituloExclusao = "Excluir registro?",
  descricaoExclusao = "Esta ação não pode ser desfeita.",
  aposExcluirHref,
  extra,
}: {
  editarHref?: string;
  onExcluir?: () => Promise<ExclusaoResult>;
  tituloExclusao?: string;
  descricaoExclusao?: string;
  aposExcluirHref?: string;
  extra?: React.ReactNode;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function confirmarExclusao() {
    if (!onExcluir) return;

    setExcluindo(true);
    const result = await onExcluir();
    setExcluindo(false);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível excluir.");
      return;
    }

    toast.success("Excluído com sucesso.");
    setConfirmando(false);

    if (aposExcluirHref) {
      router.push(aposExcluirHref);
    } else {
      router.refresh();
    }
  }

  if (!editarHref && !onExcluir && !extra) return null;

  return (
    <PaginaDetalhes.Section icon={<PencilIcon className="size-4" />} title="Ações">
      <div className="flex flex-col gap-2">
        {editarHref && (
          <Button
            className="w-full justify-start"
            nativeButton={false}
            render={<Link href={editarHref} />}
            variant="outline"
          >
            <PencilIcon className="size-4" />
            Editar
          </Button>
        )}

        {extra}

        {onExcluir && (
          <Button
            className="w-full justify-start"
            onClick={() => setConfirmando(true)}
            variant="outline"
          >
            <Trash2Icon className="size-4 text-destructive" />
            Excluir
          </Button>
        )}
      </div>

      {onExcluir && (
        <AlertDialog onOpenChange={setConfirmando} open={confirmando}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tituloExclusao}</AlertDialogTitle>
              <AlertDialogDescription>{descricaoExclusao}</AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={excluindo} onClick={confirmarExclusao}>
                {excluindo ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PaginaDetalhes.Section>
  );
}

export { DetalhesAcoesCard };
