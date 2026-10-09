// Registro central de rotas da aplicação. Cada segmento grande do App Router tem seu próprio
// arquivo aqui — ao adicionar uma rota nova, edite o arquivo do segmento (ou crie um novo e
// registre abaixo) em vez de espalhar a string pelo código. Nunca fixe caminhos de rota direto
// num Link/redirect/revalidatePath: importe `routes` daqui.
import { adminRoutes } from "./admin";
import { agendaRoutes } from "./agenda";
import { apiRoutes } from "./api";
import { authRoutes } from "./auth";
import { dashboardRoutes } from "./dashboard";
import { empresaRoutes } from "./empresa";
import { publicRoutes } from "./public";

export const routes = {
  public: publicRoutes,
  auth: authRoutes,
  dashboard: dashboardRoutes,
  empresa: empresaRoutes,
  agenda: agendaRoutes,
  admin: adminRoutes,
  api: apiRoutes,
} as const;

export { adminRoutes } from "./admin";
export { agendaRoutes } from "./agenda";
export { apiRoutes } from "./api";
export { authRoutes } from "./auth";
export { dashboardRoutes } from "./dashboard";
export { empresaRoutes } from "./empresa";
export { publicRoutes } from "./public";
