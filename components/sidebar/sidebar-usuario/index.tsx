"use client";

import { LayoutDashboardIcon, ShieldIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import type { AppSidebarProps } from "../interfaces";
import { NavMain } from "../nav-main";
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <NavbarHeader perfilAtual="usuario" isAdmin={isAdmin} />

      <SidebarContent>
        <NavMain items={isAdmin ? [...navMain, ...navMainAdmin] : navMain} label="Navegação" />
      </SidebarContent>

      <AppSidebarFooter user={user} profileHref="/dashboard" />

      <SidebarRail />
    </Sidebar>
  );
}
