import { ApiAdapterClient } from "./client";

// Client para o navegador (Client Components): o mesmo adapter, sem o logger do
// servidor (pino), para não pesar o bundle. Não há token aqui: as rotas da própria
// aplicação usam o cookie de sessão e as APIs públicas (ViaCEP) não pedem
// autenticação.
export const apiBrowserClient = new ApiAdapterClient({});
