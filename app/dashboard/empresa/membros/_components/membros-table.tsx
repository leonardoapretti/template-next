"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { UserXIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { alterarPapelMembroAction, inativarMembroAction } from "./actions";

export type MembroRow = {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  roleId: string;
  roleNome: string;
  ativo: boolean;
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

  const columns: ColumnDef<MembroRow>[] = [
    {
      accessorKey: "nome",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      filterFn: "includesString",
      meta: { variant: "text", label: "Nome", placeholder: "Buscar por nome..." },
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="E-mail" />,
    },
    {
      accessorKey: "roleNome",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil" />,
      filterFn: "arrIncludesSome",
      meta: {
        variant: "select",
        label: "Perfil",
        options: roles.map((role) => ({ label: role.nome, value: role.nome })),
      },
      cell: ({ row }) =>
        podeGerenciar && row.original.ativo ? (
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
      accessorFn: (row) => (row.ativo ? "ativo" : "inativo"),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      filterFn: "arrIncludesSome",
      meta: {
        variant: "select",
        label: "Status",
        options: [
          { label: "Ativo", value: "ativo" },
          { label: "Inativo", value: "inativo" },
        ],
      },
      cell: ({ row }) => (
        <Badge variant={row.original.ativo ? "default" : "outline"}>
          {row.original.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    ...(podeGerenciar
      ? [
          {
            id: "acoes",
            header: "",
            meta: { isAction: true },
            cell: ({ row }: { row: { original: MembroRow } }) =>
              row.original.usuarioId === usuarioAtualId || !row.original.ativo ? null : (
                <Button
                  onClick={() => setEmInativacao(row.original)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <UserXIcon className="size-3.5" />
                </Button>
              ),
          } satisfies ColumnDef<MembroRow>,
        ]
      : []),
  ];

  const { table } = useDataTable({
    columns,
    data: membros,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
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
    </>
  );
}
