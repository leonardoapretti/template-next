import { KeyRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { Badge } from "@/components/ui/badge";
import { canUseFeature, getAccessContext } from "@/lib/access-control";
import type { AccessContext } from "@/lib/access-control/context";
import { resourceRegistry } from "@/lib/access-control/permission-registry";

export const metadata: Metadata = {
  title: "Exemplos de permissões | Template",
};

// Exemplo de leitura protegida: só decide o que renderizar, nunca lança
// erro — o guard de verdade (assertCurrentUserCan) fica nas server
// actions que fazem a mutação, ver criarEventoAction em
// app/agenda/_components/engine/agendamento.actions.ts.
async function podeCriarEvento() {
  const ctx = await getAccessContext().catch(() => null);
  return ctx ? canUseFeature(ctx, "agenda:create") : false;
}

function avaliarPermissao(ctx: AccessContext, chave: string) {
  return {
    liberadoPeloPapel:
      ctx.isAdmin ||
      ctx.membroEmpresa?.roleNome === "Proprietário" ||
      Boolean(ctx.membroEmpresa?.permissoes.includes(chave)),
    liberadoPeloPlano: ctx.isAdmin || Boolean(ctx.membroEmpresa?.permissoesPlano[chave]),
    resultadoFinal: canUseFeature(ctx, chave),
  };
}

function LinhaPermissao({
  ctx,
  chave,
  label,
}: {
  ctx: AccessContext;
  chave: string;
  label: string;
}) {
  const { liberadoPeloPapel, liberadoPeloPlano, resultadoFinal } = avaliarPermissao(ctx, chave);

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4">
        <span className="font-mono text-xs">{chave}</span>
        <span className="ml-2 text-muted-foreground">{label}</span>
      </td>
      <td className="py-2 pr-4">
        <Badge variant={liberadoPeloPapel ? "default" : "outline"}>
          {liberadoPeloPapel ? "Sim" : "Não"}
        </Badge>
      </td>
      <td className="py-2 pr-4">
        <Badge variant={liberadoPeloPlano ? "default" : "outline"}>
          {liberadoPeloPlano ? "Sim" : "Não"}
        </Badge>
      </td>
      <td className="py-2">
        <Badge variant={resultadoFinal ? "default" : "outline"}>
          {resultadoFinal ? "Liberado" : "Bloqueado"}
        </Badge>
      </td>
    </tr>
  );
}

function TabelaPermissoes({ ctx }: { ctx: AccessContext }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Permissão</th>
            <th className="py-2 pr-4 font-medium">Perfil libera?</th>
            <th className="py-2 pr-4 font-medium">Plano libera?</th>
            <th className="py-2 font-medium">canUseFeature</th>
          </tr>
        </thead>
        <tbody>
          {resourceRegistry.map((resource) =>
            resource.operations.map((operacao) => (
              <LinhaPermissao
                chave={operacao.key}
                ctx={ctx}
                key={operacao.key}
                label={`${resource.label} · ${operacao.label}`}
              />
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function ExemplosPermissoesPage() {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  const podeAgendar = await podeCriarEvento();

  return (
    <PageShell>
      <PageHeader
        description="Página viva de referência sobre o motor de permissões multi-tenant do template — o que está liberado agora, para o usuário logado, e por quê."
        icon={<KeyRoundIcon className="size-5" />}
        title="Exemplos de permissões"
      />

      <PageSection title="Seu contexto de acesso">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Admin da plataforma?</dt>
            <dd className="font-medium">{ctx.isAdmin ? "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Empresa ativa</dt>
            <dd className="font-medium">
              {ctx.membroEmpresa ? ctx.membroEmpresa.empresaId : "Nenhuma"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Perfil na empresa ativa</dt>
            <dd className="font-medium">{ctx.membroEmpresa?.roleNome ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Exemplo real (canUseFeature(ctx, "agenda:create"))
            </dt>
            <dd className="font-medium">{podeAgendar ? "Liberado" : "Bloqueado"}</dd>
          </div>
        </dl>
      </PageSection>

      <PageSection
        description="Para cada permissão do catálogo (lib/access-control/permission-registry.ts): se o perfil do usuário libera, se o plano da empresa libera, e o resultado final de canUseFeature (as duas precisam estar liberadas — exceto para o Proprietário, que sempre passa na camada de perfil, e para o admin da plataforma, que ignora as duas)."
        title="Matriz de permissões (recurso × perfil × plano)"
      >
        <TabelaPermissoes ctx={ctx} />
      </PageSection>

      <PageSection title="Como gerenciar permissões">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Crie a permissão nova em{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              lib/access-control/permission-registry.ts
            </code>{" "}
            (formato <code className="rounded bg-muted px-1 py-0.5 text-xs">recurso:acao</code>).
          </li>
          <li>
            Atribua a um perfil da empresa em{" "}
            {ctx.membroEmpresa ? (
              <Link className="text-primary underline underline-offset-2" href="/dashboard/empresa/papeis">
                /dashboard/empresa/papeis
              </Link>
            ) : (
              <span className="font-mono">/dashboard/empresa/papeis</span>
            )}{" "}
            (exige vínculo ativo com uma empresa).
          </li>
          <li>
            Confirme que o plano da empresa também libera a chave — o teto de plano é
            independente do perfil —{" "}
            {ctx.isAdmin ? (
              <Link className="text-primary underline underline-offset-2" href="/admin/planos">
                /admin/planos
              </Link>
            ) : (
              <span className="font-mono">/admin/planos</span>
            )}{" "}
            (área global, só para admin da plataforma).
          </li>
          <li>
            Proteja a server action com{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              await assertCurrentUserCan("recurso:acao")
            </code>{" "}
            e, se fizer sentido, esconda a UI correspondente checando{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">canUseFeature(ctx, "recurso:acao")</code>{" "}
            num Server Component.
          </li>
        </ol>

        <p className="mt-4 text-sm text-muted-foreground">
          Documentação completa:{" "}
          <Link className="text-primary underline underline-offset-2" href="/docs/controle-de-acesso">
            /docs/controle-de-acesso
          </Link>{" "}
          e{" "}
          <Link className="text-primary underline underline-offset-2" href="/docs/empresas">
            /docs/empresas
          </Link>
          .
        </p>
      </PageSection>
    </PageShell>
  );
}
