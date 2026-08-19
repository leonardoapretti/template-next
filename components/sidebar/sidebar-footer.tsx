import { InstallPwaButton } from "@/components/sidebar/install-pwa-button";
import { SidebarUser } from "@/components/sidebar/sidebar-user";
import { SidebarFooter, SidebarMenu } from "@/components/ui/sidebar";
import type { AppSidebarProps } from "./interfaces";

type AppSidebarFooterProps = {
  user: AppSidebarProps["user"];
  profileHref: string;
};

export function AppSidebarFooter({ user, profileHref }: AppSidebarFooterProps) {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <InstallPwaButton appName="Template" />
      </SidebarMenu>

      <SidebarUser
        user={{
          name: user?.name ?? "Usuário",
          email: user?.email ?? "",
          avatar: user?.image ?? "/avatars/default.jpg",
        }}
        profileHref={profileHref}
      />
    </SidebarFooter>
  );
}
