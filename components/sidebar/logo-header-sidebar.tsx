"use client";

import { ChevronsUpDownIcon, GalleryVerticalEndIcon, ShieldIcon, User } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Perfil = "admin" | "usuario";

type LogoEmpresaProps = {
  perfilAtual: Perfil;
  isAdmin: boolean;
};

const perfilDescricao: Record<Perfil, string> = {
  admin: "Área administrativa",
  usuario: "Área do usuário",
};

export function LogoEmpresa({ perfilAtual, isAdmin }: LogoEmpresaProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Template</span>
              <span className="truncate text-xs text-muted-foreground">
                {perfilDescricao[perfilAtual]}
              </span>
            </div>

            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Alternar visualização
              </DropdownMenuLabel>

              <DropdownMenuItem render={<Link href="/dashboard" />} className="gap-2 p-2">
                <User className="size-4" />
                Usuário
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
