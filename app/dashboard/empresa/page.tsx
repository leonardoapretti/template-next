import { Building2Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { canUseFeature, getAccessContext } from "@/lib/access-control";
import { empresaService } from "@/lib/services/empresa.service";
import { ConfiguracaoForm } from "./_components/configuracao-form";

export const metadata: Metadata = {
  title: "Empresa | Template",
};

export default async function EmpresaPage() {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!ctx.membroEmpresa) {
    // Admin da plataforma sem vínculo com nenhuma empresa: nada específico
    // para mostrar aqui ainda (área global fica em /admin).
    redirect("/dashboard");
  }

  const response = await empresaService.buscarPorId(ctx.membroEmpresa.empresaId);
  const empresa = response.isSuccess() ? response.data : null;

  const podeConfigurar = canUseFeature(ctx, "empresa:configurar");

  return (
    <PageShell>
      <PageHeader
        description={empresa ? `Papel: ${ctx.membroEmpresa.roleNome}` : undefined}
        icon={<Building2Icon className="size-5" />}
        title={empresa?.nome ?? "Empresa"}
      />

      {podeConfigurar && empresa && (
        <PageSection description="Dados básicos da empresa." title="Configuração">
          <ConfiguracaoForm nome={empresa.nome} />
        </PageSection>
      )}

      <PageSection description="Membros vinculados a esta empresa e convites pendentes." title="Membros">
        <Link className="text-sm text-primary underline underline-offset-2" href="/dashboard/empresa/membros">
          Gerenciar membros →
        </Link>
      </PageSection>

      <PageSection description="Perfis de acesso e a permissão granular de cada um." title="Perfis">
        <Link className="text-sm text-primary underline underline-offset-2" href="/dashboard/empresa/papeis">
          Gerenciar perfis →
        </Link>
      </PageSection>
    </PageShell>
  );
}
