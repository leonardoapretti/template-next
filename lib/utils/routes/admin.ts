export const adminRoutes = {
  home: "/admin",
  planos: "/admin/planos",
  planoSelecionado: (planoId: string) => `/admin/planos?planoId=${planoId}`,
} as const;
