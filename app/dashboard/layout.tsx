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
    <SidebarLayout renderSidebar={(user, isAdmin) => <UserSidebar user={user} isAdmin={isAdmin} />}>
      {children}
    </SidebarLayout>
  );
}
