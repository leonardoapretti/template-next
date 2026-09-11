"use client";

import { CreditCardIcon, Home, LayoutDashboardIcon, MenuIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import type { AppSidebarProps } from "../interfaces";
import { NavMain } from "../nav-main";
import { SidebarBottomNav } from "../sidebar-bottom-nav";
import { AppSidebarFooter } from "../sidebar-footer";
import NavbarHeader from "../sidebar-header";

const data = {
  navMain: [
    {
      title: "Início",
      url: "/admin",
      icon: <Home />,
      isActive: true,
      items: [
        {
          title: "Início",
          url: "/admin",
        },
      ],
    },
    {
      title: "Planos",
      url: "/admin/planos",
      icon: <CreditCardIcon />,
      isActive: false,
      items: [
        {
          title: "Planos e permissões",
          url: "/admin/planos",
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
  ],
};

export function AdminSidebar({ user, isAdmin, empresaInfo, empresasDisponiveis, ...props }: AppSidebarProps) {
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Início", url: "/admin", icon: <Home />, highlight: true },
    { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Menu", menuTrigger: true, icon: <MenuIcon /> },
  ];

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <NavbarHeader
          empresaInfo={empresaInfo}
          empresasDisponiveis={empresasDisponiveis}
          isAdmin={isAdmin}
          perfilAtual="admin"
        />

        <SidebarContent>
          <NavMain items={data.navMain} />
        </SidebarContent>

        <AppSidebarFooter user={user} profileHref="/admin" />

        <SidebarRail />
      </Sidebar>

      <SidebarBottomNav items={bottomNavItems} />
    </>
  );
}
