import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { canUseFeature, getAccessContext } from "@/lib/access-control";
import { empresaService } from "@/lib/services/empresa.service";
import { roleService } from "@/lib/services/role.service";
import { ConvidarMembroForm } from "./_components/convidar-membro-form";
import { type MembroRow, MembrosTable } from "./_components/membros-table";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Membros da empresa | Template",
};

export default async function MembrosEmpresaPage() {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!ctx.membroEmpresa) {
    redirect("/dashboard");
  }

  const [membrosResponse, convitesResponse, rolesResponse] = await Promise.all([
    empresaService.listarMembros(ctx.membroEmpresa.empresaId),
    empresaService.listarConvitesPendentes(ctx.membroEmpresa.empresaId),
    roleService.listarTodos(),
  ]);

  const membros = membrosResponse.isSuccess() ? membrosResponse.data : [];
  const convitesPendentes = convitesResponse.isSuccess() ? convitesResponse.data : [];
  const roles = rolesResponse.isSuccess() ? rolesResponse.data : [];

  const podeConvidar = canUseFeature(ctx, "empresa:convidar");

  return (
    <PageShell>
      <PageHeader
        action={
          podeConvidar && (
            <ConvidarMembroForm roles={roles.map((role) => ({ id: role.id, nome: role.nome }))} />
          )
        }
        description="Usuários administrativos vinculados a esta empresa e convites ainda pendentes."
        icon={<UsersIcon className="size-5" />}
        title="Membros"
      />

      <PageSection title="Membros">
        <MembrosTable
          membros={[
            ...membros.map(
              (membro): MembroRow => ({
                id: membro.id,
                usuarioId: membro.usuarioId,
                nome: membro.usuario.nome,
                email: membro.usuario.email,
                roleId: membro.role.id,
                roleNome: membro.role.nome,
                status: membro.ativo ? "ativo" : "inativo",
              }),
            ),
            ...convitesPendentes.map(
              (convite): MembroRow => ({
                id: `convite-${convite.id}`,
                actionTokenId: convite.id,
                usuarioId: null,
                nome: "",
                email: convite.email ?? "",
                roleId: convite.role?.id ?? "",
                roleNome: convite.role?.nome ?? "",
                status: "convidado",
              }),
            ),
          ]}
          podeGerenciar={podeConvidar}
          roles={roles.map((role) => ({ id: role.id, nome: role.nome }))}
          usuarioAtualId={ctx.usuarioId}
        />
      </PageSection>
    </PageShell>
  );
}
