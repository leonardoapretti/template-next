"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { SendIcon, UserXIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  alterarPapelMembroAction,
  inativarMembroAction,
  reenviarConviteAction,
  revogarConviteAction,
} from "./actions";

// Botão de ação da tabela com tooltip explicando o que ele faz — os ícones
// sozinhos (revogar, reenviar, inativar) não são autoexplicativos.
function BotaoAcao({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button disabled={disabled} onClick={onClick} size="icon" type="button" variant="ghost">
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type MembroRow = {
  id: string;
  actionTokenId?: string;
  usuarioId: string | null;
  nome: string;
  email: string;
  roleId: string;
  roleNome: string;
  status: "ativo" | "inativo" | "convidado";
};

// Ativos primeiro (é o que importa no dia a dia), depois convites ainda em
// aberto, inativos por último — usado tanto na ordenação padrão da tabela
// quanto na ordenação ao clicar no cabeçalho "Status".
const ORDEM_STATUS: Record<MembroRow["status"], number> = {
  ativo: 0,
  convidado: 1,
  inativo: 2,
};

type MembrosTableProps = {
  membros: MembroRow[];
  roles: { id: string; nome: string }[];
  usuarioAtualId: string;
  podeGerenciar: boolean;
};

export function MembrosTable({ membros, roles, usuarioAtualId, podeGerenciar }: MembrosTableProps) {
  const router = useRouter();
  const [emInativacao, setEmInativacao] = useState<MembroRow | null>(null);
  const [inativando, setInativando] = useState(false);
  const [emRevogacao, setEmRevogacao] = useState<MembroRow | null>(null);
  const [revogando, setRevogando] = useState(false);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);

  async function alterarPapel(membroId: string, roleId: string) {
    const result = await alterarPapelMembroAction({ membroId, roleId });

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível alterar o perfil.");
      return;
    }

    toast.success("Perfil atualizado.");
    router.refresh();
  }

  async function confirmarInativacao() {
    if (!emInativacao) return;

    setInativando(true);
    const result = await inativarMembroAction({ membroId: emInativacao.id });
    setInativando(false);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível inativar o membro.");
      return;
    }

    toast.success("Membro inativado.");
    setEmInativacao(null);
    router.refresh();
  }

  async function confirmarRevogacao() {
    if (!emRevogacao?.actionTokenId) return;

    setRevogando(true);
    const result = await revogarConviteAction({ actionTokenId: emRevogacao.actionTokenId });
    setRevogando(false);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível revogar o convite.");
      return;
    }

    toast.success("Convite revogado.");
    setEmRevogacao(null);
    router.refresh();
  }

  async function reenviar(actionTokenId: string) {
    setReenviandoId(actionTokenId);
    const result = await reenviarConviteAction({ actionTokenId });
    setReenviandoId(null);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível reenviar o convite.");
      return;
    }

    toast.success("Convite reenviado.");
    router.refresh();
  }

  const columns: ColumnDef<MembroRow>[] = [
    {
      accessorKey: "nome",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      enableColumnFilter: true,
      filterFn: "includesString",
      meta: { variant: "text", label: "Nome", placeholder: "Buscar por nome..." },
      cell: ({ row }) =>
        row.original.status === "convidado" ? (
          <span className="text-muted-foreground italic">Convite pendente</span>
        ) : (
          row.original.nome
        ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="E-mail" />,
    },
    {
      accessorKey: "roleNome",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil" />,
      enableColumnFilter: true,
      filterFn: "arrIncludesSome",
      meta: {
        variant: "select",
        label: "Perfil",
        options: roles.map((role) => ({ label: role.nome, value: role.nome })),
      },
      cell: ({ row }) =>
        podeGerenciar && row.original.status === "ativo" ? (
          <Select
            onValueChange={(roleId) => roleId && alterarPapel(row.original.id, roleId)}
            value={row.original.roleId}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          row.original.roleNome
        ),
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      enableColumnFilter: true,
      filterFn: "arrIncludesSome",
      sortingFn: (a, b) => ORDEM_STATUS[a.original.status] - ORDEM_STATUS[b.original.status],
      meta: {
        variant: "select",
        label: "Status",
        options: [
          { label: "Ativo", value: "ativo" },
          { label: "Inativo", value: "inativo" },
          { label: "Convite enviado", value: "convidado" },
        ],
      },
      cell: ({ row }) => {
        const { status } = row.original;

        return (
          <Badge variant={status === "ativo" ? "default" : "outline"}>
            {status === "ativo" && "Ativo"}
            {status === "inativo" && "Inativo"}
            {status === "convidado" && "Convite enviado"}
          </Badge>
        );
      },
    },
    ...(podeGerenciar
      ? [
          {
            id: "acoes",
            header: "",
            meta: { isAction: true },
            cell: ({ row }: { row: { original: MembroRow } }) => {
              if (row.original.status === "convidado") {
                const { actionTokenId } = row.original;

                if (!actionTokenId) return <div className="flex justify-center gap-2" />;

                return (
                  <div className="flex justify-center gap-2">
                    <BotaoAcao
                      disabled={reenviandoId === actionTokenId}
                      label="Reenviar convite"
                      onClick={() => reenviar(actionTokenId)}
                    >
                      <SendIcon className="size-4" />
                    </BotaoAcao>
                    <BotaoAcao label="Revogar convite" onClick={() => setEmRevogacao(row.original)}>
                      <XIcon className="size-4" />
                    </BotaoAcao>
                  </div>
                );
              }

              return (
                <div className="flex justify-center gap-2">
                  {row.original.usuarioId !== usuarioAtualId && row.original.status === "ativo" && (
                    <BotaoAcao label="Inativar membro" onClick={() => setEmInativacao(row.original)}>
                      <UserXIcon className="size-4" />
                    </BotaoAcao>
                  )}
                </div>
              );
            },
          } satisfies ColumnDef<MembroRow>,
        ]
      : []),
  ];

  const { table } = useDataTable({
    columns,
    data: membros,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "status", desc: false }],
    },
    entity: { singular: "membro", plural: "membros" },
    enableExportButton: false,
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>

      <AlertDialog onOpenChange={(open) => !open && setEmInativacao(null)} open={Boolean(emInativacao)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar membro?</AlertDialogTitle>
            <AlertDialogDescription>
              {emInativacao?.nome ? `"${emInativacao.nome}" perderá acesso a esta empresa.` : ""} O
              vínculo pode ser refeito enviando um novo convite.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={inativando} onClick={confirmarInativacao}>
              {inativando ? "Inativando..." : "Inativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={(open) => !open && setEmRevogacao(null)} open={Boolean(emRevogacao)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite enviado para "{emRevogacao?.email}" deixará de ser válido. Você pode enviar um
              novo convite depois, se precisar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={revogando} onClick={confirmarRevogacao}>
              {revogando ? "Revogando..." : "Revogar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
