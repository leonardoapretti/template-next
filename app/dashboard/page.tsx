import { LayoutDashboardIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import {
  PageCardLink,
  PageGrid,
  PageHeader,
  PageSection,
  PageShell,
} from "@/components/pages/page-shell";
import { Button } from "@/components/ui/button";
import { getAccessContext } from "@/lib/access-control";
import { routes } from "@/lib/utils/routes";
import { AcessoNegadoToast } from "./_components/acesso-negado-toast";
import { JaLogadoToast } from "./_components/ja-logado-toast";
import { PromoverAdminButtonGate } from "./_components/promover-admin-button-gate";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard | Template",
};

export default async function DashboardPage() {
  const session = await auth();
  const ctx = await getAccessContext();

  return (
    <PageShell>
      <Suspense>
        <AcessoNegadoToast />
        <JaLogadoToast />
      </Suspense>

      <PageHeader
        icon={<LayoutDashboardIcon className="size-5" />}
        title="Área autenticada"
        description={
          <>
            Esta página só é visível para usuários com sessão válida — não exige nenhum papel
            específico, ao contrário de <code>/admin</code>, que exige <code>isAdmin</code>.
          </>
        }
      />

      <PageSection title="Sua conta">
        <p className="text-sm">
          Logado como <span className="font-medium">{session?.user.email}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {ctx.isAdmin ? "Seu usuário já é admin." : "Seu usuário ainda não é admin."}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button nativeButton={false} render={<Link href={routes.admin.home} />}>
            Acessar área admin
          </Button>
          {!ctx.isAdmin && <PromoverAdminButtonGate />}
        </div>
      </PageSection>

      <PageGrid columns={2}>
        <PageCardLink
          label="Exemplo"
          title="Página de detalhes"
          description="Referência do padrão components/pages/detalhes, com header rico, seções e sidebar responsiva."
          href={routes.dashboard.produtoExemplo}
        />
        <PageCardLink
          label="Agenda"
          title="Calendário de eventos"
          description="Visões de mês, semana e dia com eventos recorrentes, exceções e detecção de conflito, protegida pelo motor de permissões (agenda:create/update/delete)."
          href={routes.agenda.home}
        />
        <PageCardLink
          label="Envio de e-mails"
          title="Sistema de envio de e-mails"
          description="Interface para criar, agendar e monitorar envios de e-mails, protegida pelo motor de permissões (email:create/update/delete)."
          href={routes.dashboard.emails}
        />
      </PageGrid>
    </PageShell>
  );
}
