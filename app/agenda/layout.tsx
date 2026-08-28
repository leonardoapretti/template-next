import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SidebarLayout from "@/components/sidebar/layout";
import { AgendaSidebar } from "@/components/sidebar/sidebar-agenda";
import { AgendaProvider } from "@/components/sidebar/sidebar-agenda/agenda-context";

export default async function AgendaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <SidebarLayout renderSidebar={(user, isAdmin) => <AgendaSidebar user={user} isAdmin={isAdmin} />}>
      <AgendaProvider>{children}</AgendaProvider>
    </SidebarLayout>
  );
}
