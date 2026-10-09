export const dashboardRoutes = {
  home: "/dashboard",
  conta: "/dashboard/conta",
  confirmarEmailToken: (token: string) => `/dashboard/conta/confirmar-email/${token}`,
  emails: "/dashboard/emails",
  exemplos: "/dashboard/exemplos",
  produtoExemplo: "/dashboard/produtos/exemplo",
  docs: "/dashboard/docs",
  empresaNova: "/dashboard/empresas/novo",
  convite: (token: string) => `/dashboard/empresas/convite/${token}`,
} as const;
