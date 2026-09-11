import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-breadcrumbs";
import { BreadcrumbLabelsProvider } from "@/components/app-breadcrumbs/breadcrumb-labels-context";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getAccessContext } from "@/lib/access-control";
import { empresaService } from "@/lib/services/empresa.service";

export type SidebarLayoutUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// Empresa ativa da sessão — alimenta o cabeçalho do sidebar (nome +
// papel atual), análogo ao "clinicaInfo" do dropdown de troca de clínica
// de outros apps do mesmo padrão.
export type SidebarLayoutEmpresaInfo = {
  nome: string;
  roleNome: string;
};

export type SidebarLayoutEmpresaOpcao = {
  id: string;
  nome: string;
  ativa: boolean;
};

type SidebarLayoutProps = Readonly<{
  children: React.ReactNode;
  renderSidebar: (
    user: SidebarLayoutUser | undefined,
    isAdmin: boolean,
    empresaInfo?: SidebarLayoutEmpresaInfo | null,
    empresasDisponiveis?: SidebarLayoutEmpresaOpcao[],
  ) => React.ReactNode;
  content?: "default" | "custom";
}>;

export default async function SidebarLayout({
  children,
  renderSidebar,
  content = "default",
}: SidebarLayoutProps) {
  const session = await auth();
  const ctx = session?.user?.id ? await getAccessContext().catch(() => null) : null;

  const empresasResponse = ctx ? await empresaService.listarDoUsuario(ctx.usuarioId) : null;
  const empresasDisponiveis: SidebarLayoutEmpresaOpcao[] = empresasResponse?.isSuccess()
    ? empresasResponse.data.map(({ empresa }) => ({
        id: empresa.id,
        nome: empresa.nome,
        ativa: empresa.id === ctx?.membroEmpresa?.empresaId,
      }))
    : [];

  const empresaAtiva = empresasDisponiveis.find((empresa) => empresa.ativa) ?? null;
  const empresaInfo: SidebarLayoutEmpresaInfo | null =
    empresaAtiva && ctx?.membroEmpresa
      ? { nome: empresaAtiva.nome, roleNome: ctx.membroEmpresa.roleNome }
      : null;

  return (
    <SidebarProvider>
      <BreadcrumbLabelsProvider>
        {renderSidebar(session?.user, ctx?.isAdmin ?? false, empresaInfo, empresasDisponiveis)}

        {content === "custom" ? (
          children
        ) : (
          <SidebarInset>
            <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/85 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 hidden md:flex" />
                <Separator
                  orientation="vertical"
                  className="mr-2 hidden shrink-0 data-vertical:h-4 data-vertical:self-auto md:block"
                />
                <AppBreadcrumb />
              </div>
            </header>

            <main className="flex flex-1 flex-col bg-background pb-16 md:pb-0">{children}</main>
          </SidebarInset>
        )}
      </BreadcrumbLabelsProvider>
    </SidebarProvider>
  );
}
