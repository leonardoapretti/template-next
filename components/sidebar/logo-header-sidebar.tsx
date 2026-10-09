"use client";

import {
  Building2Icon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  GalleryVerticalEndIcon,
  Loader2Icon,
  ShieldIcon,
  User,
} from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { selecionarEmpresaAtivaAction } from "./actions";
import type { SidebarLayoutEmpresaInfo, SidebarLayoutEmpresaOpcao } from "./layout";

type Perfil = "admin" | "usuario" | "agenda";

type LogoEmpresaProps = {
  perfilAtual: Perfil;
  isAdmin: boolean;
  empresaInfo?: SidebarLayoutEmpresaInfo | null;
  empresasDisponiveis?: SidebarLayoutEmpresaOpcao[];
};

const perfilDescricao: Record<Perfil, string> = {
  admin: "Área administrativa",
  usuario: "Área do usuário",
  agenda: "Agenda",
};

function getSubtitulo(
  isPending: boolean,
  perfilAtual: Perfil,
  empresaInfo?: SidebarLayoutEmpresaInfo | null,
) {
  if (isPending) {
    return "Alternando empresa...";
  }

  if (empresaInfo) {
    return empresaInfo.roleNome;
  }

  return perfilDescricao[perfilAtual];
}

export function LogoEmpresa({
  perfilAtual,
  isAdmin,
  empresaInfo,
  empresasDisponiveis = [],
}: LogoEmpresaProps) {
  const { isMobile } = useSidebar();
  const [isPending, startTransition] = useTransition();

  function trocarEmpresa(empresaId: string) {
    startTransition(async () => {
      const result = await selecionarEmpresaAtivaAction(empresaId);

      if (!result.success) {
        toast.error(result.errorMessage ?? "Não foi possível trocar de empresa.");
        return;
      }

      // Reload completo (não só router.refresh()) pra garantir que todo
      // estado client-side reflita a empresa nova, não só o que o App
      // Router re-renderiza via cache.
      window.location.reload();
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{empresaInfo ? empresaInfo.nome : "Template"}</span>
              <span className="truncate text-xs text-muted-foreground">
                {getSubtitulo(isPending, perfilAtual, empresaInfo)}
              </span>
            </div>

            {isPending ? (
              <Loader2Icon className="ml-auto size-4 animate-spin group-data-[collapsible=icon]:hidden" />
            ) : (
              <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {empresasDisponiveis.length > 1 && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Empresas</DropdownMenuLabel>

                  {empresasDisponiveis.map((empresa) => (
                    <DropdownMenuItem
                      className="gap-2 p-2"
                      disabled={isPending || empresa.ativa}
                      key={empresa.id}
                      onClick={() => trocarEmpresa(empresa.id)}
                    >
                      <Building2Icon className="size-4" />
                      <span className="truncate">{empresa.nome}</span>
                      {empresa.ativa && <CheckIcon className="ml-auto size-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Alternar visualização
              </DropdownMenuLabel>

              <DropdownMenuItem render={<Link href="/dashboard" />} className="gap-2 p-2">
                <User className="size-4" />
                Usuário
              </DropdownMenuItem>

              <DropdownMenuItem render={<Link href="/agenda" />} className="gap-2 p-2">
                <CalendarDaysIcon className="size-4" />
                Agenda
              </DropdownMenuItem>

              {isAdmin && (
                <DropdownMenuItem render={<Link href="/admin" />} className="gap-2 p-2">
                  <ShieldIcon className="size-4" />
                  Admin
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
