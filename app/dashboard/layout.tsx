import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SidebarLayout from "@/components/sidebar/layout";
import { UserSidebar } from "@/components/sidebar/sidebar-usuario";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <SidebarLayout
      renderSidebar={(user, isAdmin, empresaInfo, empresasDisponiveis) => (
        <UserSidebar
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
