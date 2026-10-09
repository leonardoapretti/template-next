export const empresaRoutes = {
  home: "/dashboard/empresa",
  membros: "/dashboard/empresa/membros",
  papeis: "/dashboard/empresa/papeis",
  papelSelecionado: (papelId: string) => `/dashboard/empresa/papeis?papelId=${papelId}`,
} as const;
