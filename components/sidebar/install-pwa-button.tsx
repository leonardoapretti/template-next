"use client";

import { DownloadIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallPwaButton({ appName }: { appName: string }) {
  const { canInstall, isInstalled, install } = usePwaInstall(appName);

  if (!canInstall || isInstalled) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={install} tooltip="Instalar aplicativo">
        <DownloadIcon />
        <span>Instalar aplicativo</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
