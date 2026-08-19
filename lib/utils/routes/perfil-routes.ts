type PerfilInicial = {
  isAdmin?: boolean | null;
};

export function getPerfilInicialPath(perfil: PerfilInicial) {
  return perfil.isAdmin ? "/admin" : "/dashboard";
}
