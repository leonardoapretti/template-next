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
    url: "/dashboard/agenda",
    icon: <CalendarDaysIcon />,
    isActive: false,
    items: [
      {
        title: "Meus eventos",
        url: "/dashboard/agenda",
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

export function UserSidebar({ user, isAdmin, ...props }: AppSidebarProps) {
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Início", url: "/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Agenda", url: "/dashboard/agenda", icon: <CalendarDaysIcon /> },
    ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: <ShieldIcon /> }] : []),
    { title: "Menu", menuTrigger: true, icon: <MenuIcon /> },
  ];

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <NavbarHeader perfilAtual="usuario" isAdmin={isAdmin} />

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
