import type { ReactNode } from "react";
import { ThemeToggle } from "../theme-toggle";
import { SidebarHeader } from "../ui/sidebar";
import { LogoEmpresa } from "./logo-header-sidebar";

type NavbarHeaderProps = {
  children?: ReactNode;
  perfilAtual: "admin" | "usuario";
  isAdmin: boolean;
};

export default function NavbarHeader({ children, perfilAtual, isAdmin }: NavbarHeaderProps) {
  return (
    <SidebarHeader className="gap-4">
      <div className="flex items-center justify-between">
        <LogoEmpresa perfilAtual={perfilAtual} isAdmin={isAdmin} />

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {children}
    </SidebarHeader>
  );
}
