import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-breadcrumbs";
import { BreadcrumbLabelsProvider } from "@/components/app-breadcrumbs/breadcrumb-labels-context";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getAccessContext } from "@/lib/access-control";

export type SidebarLayoutUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type SidebarLayoutProps = Readonly<{
  children: React.ReactNode;
  renderSidebar: (user: SidebarLayoutUser | undefined, isAdmin: boolean) => React.ReactNode;
  content?: "default" | "custom";
}>;

export default async function SidebarLayout({
  children,
  renderSidebar,
  content = "default",
}: SidebarLayoutProps) {
  const session = await auth();
  const ctx = session?.user?.id ? await getAccessContext().catch(() => null) : null;

  return (
    <SidebarProvider>
      <BreadcrumbLabelsProvider>
        {renderSidebar(session?.user, ctx?.isAdmin ?? false)}

        {content === "custom" ? (
          children
        ) : (
          <SidebarInset>
            <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/85 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 shrink-0 data-vertical:h-4 data-vertical:self-auto"
                />
                <AppBreadcrumb />
              </div>
            </header>

            <main className="flex flex-1 flex-col bg-background">{children}</main>
          </SidebarInset>
        )}
      </BreadcrumbLabelsProvider>
    </SidebarProvider>
  );
}
