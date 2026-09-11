import type { ReactNode } from "react";
import { ThemeToggle } from "../theme-toggle";
import { SidebarHeader } from "../ui/sidebar";
import type { SidebarLayoutEmpresaInfo, SidebarLayoutEmpresaOpcao } from "./layout";
import { LogoEmpresa } from "./logo-header-sidebar";

type NavbarHeaderProps = {
  children?: ReactNode;
  perfilAtual: "admin" | "usuario" | "agenda";
  isAdmin: boolean;
  empresaInfo?: SidebarLayoutEmpresaInfo | null;
  empresasDisponiveis?: SidebarLayoutEmpresaOpcao[];
};

export default function NavbarHeader({
  children,
  perfilAtual,
  isAdmin,
  empresaInfo,
  empresasDisponiveis,
}: NavbarHeaderProps) {
  return (
    <SidebarHeader className="gap-4">
      <div className="flex items-center justify-between">
        <LogoEmpresa
          empresaInfo={empresaInfo}
          empresasDisponiveis={empresasDisponiveis}
          isAdmin={isAdmin}
          perfilAtual={perfilAtual}
        />

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {children}
    </SidebarHeader>
  );
}
