import { redirect } from "next/navigation";
import SidebarLayout from "@/components/sidebar/layout";
import { AgendaSidebar } from "@/components/sidebar/sidebar-agenda";
import { AgendaProvider } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { getAccessContext, temEmpresaAtiva } from "@/lib/access-control";

export default async function AgendaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!temEmpresaAtiva(ctx)) {
    redirect("/dashboard?acessoNegado=empresa");
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
