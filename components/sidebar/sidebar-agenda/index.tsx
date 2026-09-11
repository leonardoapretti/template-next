"use client";

import { CalendarDaysIcon, LayoutDashboardIcon, MenuIcon, ShieldIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import type { AppSidebarProps } from "../interfaces";
import { NavMain } from "../nav-main";
import { SidebarBottomNav } from "../sidebar-bottom-nav";
import { AppSidebarFooter } from "../sidebar-footer";
import NavbarHeader from "../sidebar-header";

const navMain = [
  {
    title: "Agenda",
    url: "/agenda",
    icon: <CalendarDaysIcon />,
    isActive: true,
    items: [
      {
        title: "Eventos da empresa",
        url: "/agenda",
      },
    ],
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
    isActive: false,
    items: [
      {
        title: "Início",
        url: "/dashboard",
      },
    ],
  },
];

const navMainAdmin = [
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

export function AgendaSidebar({ user, isAdmin, empresaInfo, empresasDisponiveis, ...props }: AppSidebarProps) {
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
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
          perfilAtual="agenda"
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
