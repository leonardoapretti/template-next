"use client";

import { BookOpen, Home, MailIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import type { AppSidebarProps } from "../interfaces";
import { NavMain } from "../nav-main";
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <NavbarHeader perfilAtual="admin" isAdmin={isAdmin} />

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <AppSidebarFooter user={user} profileHref="/admin" />

      <SidebarRail />
    </Sidebar>
  );
}
