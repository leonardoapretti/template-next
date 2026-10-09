import { redirect } from "next/navigation";
import SidebarLayout from "@/components/sidebar/layout";
import { AdminSidebar } from "@/components/sidebar/sidebar-admin";
import { canActAs, getAccessContext } from "@/lib/access-control";
import { routes } from "@/lib/utils/routes";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAccessContext().catch(() => redirect(routes.auth.login));

  if (!canActAs(ctx, "ADMIN")) {
    redirect(`${routes.dashboard.home}?acessoNegado=admin`);
  }

  return (
    <SidebarLayout
      renderSidebar={(user, isAdmin, empresaInfo, empresasDisponiveis) => (
        <AdminSidebar
          empresaInfo={empresaInfo}
          empresasDisponiveis={empresasDisponiveis}
          isAdmin={isAdmin}
          user={user}
        />
      )}
    >
      {children}
    </SidebarLayout>
  );
}
