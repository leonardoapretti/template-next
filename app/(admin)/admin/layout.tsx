import { redirect } from "next/navigation";
import SidebarLayout from "@/components/sidebar/layout";
import { AdminSidebar } from "@/components/sidebar/sidebar-admin";
import { canActAs, getAccessContext } from "@/lib/access-control";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!canActAs(ctx, "ADMIN")) {
    redirect("/dashboard?acessoNegado=admin");
  }

  return (
    <SidebarLayout
      renderSidebar={(user, isAdmin) => <AdminSidebar user={user} isAdmin={isAdmin} />}
    >
      {children}
    </SidebarLayout>
  );
}
