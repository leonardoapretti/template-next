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
import { routes } from "@/lib/utils/routes";
import type { AppSidebarProps } from "../interfaces";
import { NavMain } from "../nav-main";
import { SidebarBottomNav } from "../sidebar-bottom-nav";
import { AppSidebarFooter } from "../sidebar-footer";
import NavbarHeader from "../sidebar-header";

const navMain = [
  {
    title: "Dashboard",
    url: routes.dashboard.home,
    icon: <LayoutDashboardIcon />,
    isActive: true,
    items: [
      {
        title: "Início",
        url: routes.dashboard.home,
      },
    ],
  },
  {
    title: "Agenda",
    url: routes.agenda.home,
    icon: <CalendarDaysIcon />,
    isActive: false,
    items: [
      {
        title: "Eventos da empresa",
        url: routes.agenda.home,
      },
    ],
  },
  {
    title: "Empresa",
    url: routes.empresa.home,
    icon: <Building2Icon />,
    isActive: false,
    items: [
      {
        title: "Dados da empresa",
        url: routes.empresa.home,
      },
      {
        title: "Membros",
        url: routes.empresa.membros,
      },
      {
        title: "Perfis",
        url: routes.empresa.papeis,
      },
    ],
  },
  {
    title: "Exemplos de permissões",
    url: routes.dashboard.exemplos,
    icon: <KeyRoundIcon />,
    isActive: false,
    items: [
      {
        title: "Motor de permissões",
        url: routes.dashboard.exemplos,
      },
    ],
  },
];

const navMainAdmin = [
  {
    title: "Documentação",
    url: routes.dashboard.docs,
    icon: <BookOpen />,
    isActive: false,
    items: [
      {
        title: "Base interna",
        url: routes.dashboard.docs,
      },
    ],
  },
  {
    title: "E-mails",
    url: routes.dashboard.emails,
    icon: <MailIcon />,
    isActive: false,
    items: [
      {
        title: "Enviar e-mail",
        url: routes.dashboard.emails,
      },
    ],
  },
  {
    title: "Área admin",
    url: routes.admin.home,
    icon: <ShieldIcon />,
    isActive: false,
    items: [
      {
        title: "Início",
        url: routes.admin.home,
      },
    ],
  },
];

export function UserSidebar({
  user,
  isAdmin,
  empresaInfo,
  empresasDisponiveis,
  ...props
}: AppSidebarProps) {
  // Início e Menu são fixos nas pontas; Agenda fica sempre em destaque no
  // centro (é a funcionalidade principal do app). Conta só entra quando há
  // um quarto destino real (isAdmin) pra manter a quantidade de botões ímpar
  // com o centro simétrico — sem isso, forçar um botão sem destino real.
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Início", url: routes.dashboard.home, icon: <LayoutDashboardIcon /> },
    ...(isAdmin ? [{ title: "Conta", url: routes.dashboard.conta, icon: <UserIcon /> }] : []),
    { title: "Agenda", url: routes.agenda.home, icon: <CalendarDaysIcon />, highlight: true },
    ...(isAdmin ? [{ title: "Admin", url: routes.admin.home, icon: <ShieldIcon /> }] : []),
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

        <AppSidebarFooter user={user} profileHref={routes.dashboard.home} />

        <SidebarRail />
      </Sidebar>

      <SidebarBottomNav items={bottomNavItems} />
    </>
  );
}
