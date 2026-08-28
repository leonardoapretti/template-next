"use client";

import { BookOpen, Home, MailIcon, MenuIcon } from "lucide-react";
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
      title: "Documentação",
      url: "/admin/docs",
      icon: <BookOpen />,
      isActive: false,
      items: [
        {
          title: "Base interna",
          url: "/admin/docs",
        },
      ],
    },
    {
      title: "E-mails",
      url: "/admin/emails",
      icon: <MailIcon />,
      isActive: false,
      items: [
        {
          title: "Enviar e-mail",
          url: "/admin/emails",
        },
      ],
    },
  ],
};

export function AdminSidebar({ user, isAdmin, ...props }: AppSidebarProps) {
  // Início e Menu fixos nas pontas, E-mails em destaque no centro (ação mais
  // usada no admin). Documentação continua acessível pelo Menu (NavMain).
  const bottomNavItems: React.ComponentProps<typeof SidebarBottomNav>["items"] = [
    { title: "Início", url: "/admin", icon: <Home /> },
    { title: "E-mails", url: "/admin/emails", icon: <MailIcon />, highlight: true },
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
