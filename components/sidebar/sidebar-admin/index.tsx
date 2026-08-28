"use client";

import { Home, LayoutDashboardIcon, MenuIcon } from "lucide-react";
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

export function AdminSidebar({ user, isAdmin, ...props }: AppSidebarProps) {
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Início", url: "/admin", icon: <Home />, highlight: true },
    { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Menu", menuTrigger: true, icon: <MenuIcon /> },
  ];

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <NavbarHeader perfilAtual="admin" isAdmin={isAdmin} />

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
