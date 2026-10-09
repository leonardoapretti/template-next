export const authRoutes = {
  login: "/login",
  cadastro: "/cadastro",
  verificarEmail: "/login/verificar-email",
  verificarEmailToken: (token: string) => `/login/verificar-email/${token}`,
  redefinirSenhaToken: (token: string) => `/login/redefinir-senha/${token}`,
} as const;
