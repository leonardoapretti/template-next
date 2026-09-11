import type { Sidebar } from "../ui/sidebar";
import type { SidebarLayoutEmpresaInfo, SidebarLayoutEmpresaOpcao } from "./layout";

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  isAdmin: boolean;
  empresaInfo?: SidebarLayoutEmpresaInfo | null;
  empresasDisponiveis?: SidebarLayoutEmpresaOpcao[];
}
