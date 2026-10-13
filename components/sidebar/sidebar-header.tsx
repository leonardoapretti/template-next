import type { ReactNode } from "react";
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
    <SidebarHeader className="gap-4 group-data-[collapsible=icon]:px-1">
      <LogoEmpresa
        empresaInfo={empresaInfo}
        empresasDisponiveis={empresasDisponiveis}
        isAdmin={isAdmin}
        perfilAtual={perfilAtual}
      />

      {children}
    </SidebarHeader>
  );
}
