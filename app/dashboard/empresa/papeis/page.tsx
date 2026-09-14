import { ShieldIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { Badge } from "@/components/ui/badge";
import { canUseFeature, getAccessContext } from "@/lib/access-control";
import { NOME_ROLE_PROPRIETARIO } from "@/lib/access-control/policy";
import { roleService } from "@/lib/services/role.service";
import { NovoPapelForm } from "./_components/novo-papel-form";
import { PermissoesPapelForm } from "./_components/permissoes-papel-form";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Perfis | Template",
};

export default async function PapeisEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!ctx.membroEmpresa) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const papelIdParam = Array.isArray(params.papelId) ? params.papelId[0] : params.papelId;

  const response = await roleService.listarComContagemDeMembros(ctx.membroEmpresa.empresaId);
  const papeis = response.isSuccess() ? response.data : [];

  const papelSelecionado = papeis.find((papel) => papel.id === papelIdParam) ?? papeis[0] ?? null;
  const podeGerenciar = canUseFeature(ctx, "papeis:gerenciar");
  const proprietarioSelecionado = papelSelecionado?.nome === NOME_ROLE_PROPRIETARIO;

  return (
    <PageShell>
      <PageHeader
        action={
          podeGerenciar && (
            <NovoPapelForm papeisExistentes={papeis.map((papel) => ({ id: papel.id, nome: papel.nome }))} />
          )
        }
        description="Perfis de acesso da empresa — crie perfis customizados ou ajuste as permissões dos perfis existentes."
        icon={<ShieldIcon className="size-5" />}
        title="Perfis"
      />

      {papeis.length > 0 && (
        <PageSection title="Permissões do perfil">
          <div className="flex flex-wrap gap-2">
            {papeis.map((papel) => (
              <Link className="no-underline" href={`/dashboard/empresa/papeis?papelId=${papel.id}`} key={papel.id}>
                <Badge variant={papel.id === papelSelecionado?.id ? "default" : "outline"}>
                  {papel.nome}
                  {papel.padraoSistema && " · padrão"}
                  {` (${papel._count.membros})`}
                </Badge>
              </Link>
            ))}
          </div>

          {papelSelecionado &&
            (proprietarioSelecionado ? (
              <p className="rounded-xl border p-4 text-sm text-muted-foreground">
                O perfil <strong>Proprietário</strong> sempre tem acesso a todas as permissões da
                empresa — não é editável, nem mesmo para restringi-lo.
              </p>
            ) : (
              <PermissoesPapelForm
                key={papelSelecionado.id}
                papel={{
                  id: papelSelecionado.id,
                  nome: papelSelecionado.nome,
                  padraoSistema: papelSelecionado.padraoSistema,
                  podeExcluir: !papelSelecionado.padraoSistema && papelSelecionado._count.membros === 0,
                }}
                podeGerenciar={podeGerenciar}
                valoresIniciais={Object.fromEntries(
                  papelSelecionado.permissoes.map((chave) => [chave, true]),
                )}
              />
            ))}
        </PageSection>
      )}
    </PageShell>
  );
}
