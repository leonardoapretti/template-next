import { adminRoutes } from "./admin";
import { dashboardRoutes } from "./dashboard";

type PerfilInicial = {
  isAdmin?: boolean | null;
};

export function getPerfilInicialPath(perfil: PerfilInicial) {
  return perfil.isAdmin ? adminRoutes.home : dashboardRoutes.home;
}
