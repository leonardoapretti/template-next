"use client";

import {
  BookOpen,
  Building2Icon,
  CalendarDaysIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MailIcon,
  MenuIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import type { AppSidebarProps } from "../interfaces";
import { NavMain } from "../nav-main";
import { SidebarBottomNav } from "../sidebar-bottom-nav";
import { AppSidebarFooter } from "../sidebar-footer";
import NavbarHeader from "../sidebar-header";

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
    isActive: true,
    items: [
      {
        title: "Início",
        url: "/dashboard",
      },
    ],
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: <CalendarDaysIcon />,
    isActive: false,
    items: [
      {
        title: "Eventos da empresa",
        url: "/agenda",
      },
    ],
  },
  {
    title: "Empresa",
    url: "/dashboard/empresa",
    icon: <Building2Icon />,
    isActive: false,
    items: [
      {
        title: "Dados da empresa",
        url: "/dashboard/empresa",
      },
      {
        title: "Membros",
        url: "/dashboard/empresa/membros",
      },
      {
        title: "Perfis",
        url: "/dashboard/empresa/papeis",
      },
    ],
  },
  {
    title: "Exemplos de permissões",
    url: "/dashboard/exemplos",
    icon: <KeyRoundIcon />,
    isActive: false,
    items: [
      {
        title: "Motor de permissões",
        url: "/dashboard/exemplos",
      },
    ],
  },
];

const navMainAdmin = [
  {
    title: "Documentação",
    url: "/dashboard/docs",
    icon: <BookOpen />,
    isActive: false,
    items: [
      {
        title: "Base interna",
        url: "/dashboard/docs",
      },
    ],
  },
  {
    title: "E-mails",
    url: "/dashboard/emails",
    icon: <MailIcon />,
    isActive: false,
    items: [
      {
        title: "Enviar e-mail",
        url: "/dashboard/emails",
      },
    ],
  },
  {
    title: "Área admin",
    url: "/admin",
    icon: <ShieldIcon />,
    isActive: false,
    items: [
      {
        title: "Início",
        url: "/admin",
      },
    ],
  },
];

export function UserSidebar({ user, isAdmin, empresaInfo, empresasDisponiveis, ...props }: AppSidebarProps) {
  // Início e Menu são fixos nas pontas; Agenda fica sempre em destaque no
  // centro (é a funcionalidade principal do app). Conta só entra quando há
  // um quarto destino real (isAdmin) pra manter a quantidade de botões ímpar
  // com o centro simétrico — sem isso, forçar um botão sem destino real.
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Início", url: "/dashboard", icon: <LayoutDashboardIcon /> },
    ...(isAdmin ? [{ title: "Conta", url: "/dashboard/conta", icon: <UserIcon /> }] : []),
    { title: "Agenda", url: "/agenda", icon: <CalendarDaysIcon />, highlight: true },
    ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: <ShieldIcon /> }] : []),
    { title: "Menu", menuTrigger: true, icon: <MenuIcon /> },
  ];

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <NavbarHeader
          empresaInfo={empresaInfo}
          empresasDisponiveis={empresasDisponiveis}
          isAdmin={isAdmin}
          perfilAtual="usuario"
        />

        <SidebarContent>
          <NavMain items={isAdmin ? [...navMain, ...navMainAdmin] : navMain} label="Navegação" />
        </SidebarContent>

        <AppSidebarFooter user={user} profileHref="/dashboard" />

        <SidebarRail />
      </Sidebar>

      <SidebarBottomNav items={bottomNavItems} />
    </>
  );
}
