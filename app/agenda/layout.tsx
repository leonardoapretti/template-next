import { redirect } from "next/navigation";
import SidebarLayout from "@/components/sidebar/layout";
import { AgendaSidebar } from "@/components/sidebar/sidebar-agenda";
import { AgendaProvider } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { getAccessContext, temEmpresaAtiva } from "@/lib/access-control";
import { routes } from "@/lib/utils/routes";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function AgendaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = await getAccessContext().catch(() => redirect(routes.auth.login));

  if (!temEmpresaAtiva(ctx)) {
    redirect(`${routes.dashboard.home}?acessoNegado=empresa`);
  }

  return (
    <SidebarLayout
      renderSidebar={(user, isAdmin, empresaInfo, empresasDisponiveis) => (
        <AgendaSidebar
          empresaInfo={empresaInfo}
          empresasDisponiveis={empresasDisponiveis}
          isAdmin={isAdmin}
          user={user}
        />
      )}
    >
      <AgendaProvider>{children}</AgendaProvider>
    </SidebarLayout>
  );
}
