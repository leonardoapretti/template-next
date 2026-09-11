import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { canUseFeature, getAccessContext } from "@/lib/access-control";
import { empresaService } from "@/lib/services/empresa.service";
import { roleService } from "@/lib/services/role.service";
import { ConvidarMembroForm } from "./_components/convidar-membro-form";
import { MembrosTable } from "./_components/membros-table";

export const metadata: Metadata = {
  title: "Membros da empresa | Template",
};

export default async function MembrosEmpresaPage() {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!ctx.membroEmpresa) {
    redirect("/dashboard");
  }

  const [membrosResponse, rolesResponse] = await Promise.all([
    empresaService.listarMembros(ctx.membroEmpresa.empresaId),
    roleService.listarTodos(),
  ]);

  const membros = membrosResponse.isSuccess() ? membrosResponse.data : [];
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
        description="Usuários administrativos vinculados a esta empresa."
        icon={<UsersIcon className="size-5" />}
        title="Membros"
      />

      <PageSection title="Membros">
        <MembrosTable
          membros={membros.map((membro) => ({
            id: membro.id,
            usuarioId: membro.usuarioId,
            nome: membro.usuario.nome,
            email: membro.usuario.email,
            roleId: membro.role.id,
            roleNome: membro.role.nome,
            ativo: membro.ativo,
          }))}
          podeGerenciar={podeConvidar}
          roles={roles.map((role) => ({ id: role.id, nome: role.nome }))}
          usuarioAtualId={ctx.usuarioId}
        />
      </PageSection>
    </PageShell>
  );
}
