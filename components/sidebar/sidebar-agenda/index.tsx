"use client";

import { CalendarDaysIcon, LayoutDashboardIcon, MenuIcon, ShieldIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import { routes } from "@/lib/utils/routes";
import type { AppSidebarProps } from "../interfaces";
import { NavMain } from "../nav-main";
import { SidebarBottomNav } from "../sidebar-bottom-nav";
import { AppSidebarFooter } from "../sidebar-footer";
import NavbarHeader from "../sidebar-header";

const navMain = [
  {
    title: "Agenda",
    url: routes.agenda.home,
    icon: <CalendarDaysIcon />,
    isActive: true,
    items: [
      {
        title: "Eventos da empresa",
        url: routes.agenda.home,
      },
    ],
  },
  {
    title: "Dashboard",
    url: routes.dashboard.home,
    icon: <LayoutDashboardIcon />,
    isActive: false,
    items: [
      {
        title: "Início",
        url: routes.dashboard.home,
      },
    ],
  },
];

const navMainAdmin = [
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

export function AgendaSidebar({
  user,
  isAdmin,
  empresaInfo,
  empresasDisponiveis,
  ...props
}: AppSidebarProps) {
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Dashboard", url: routes.dashboard.home, icon: <LayoutDashboardIcon /> },
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
          perfilAtual="agenda"
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
