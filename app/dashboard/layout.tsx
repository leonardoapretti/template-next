import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SidebarLayout from "@/components/sidebar/layout";
import { UserSidebar } from "@/components/sidebar/sidebar-usuario";

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
