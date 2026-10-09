import { getDadosAuditoriaAssinatura } from "@/lib/utils/request";

export type AutorDaAuditoria = {
  usuarioId: string | null;
  usuarioEmail: string | null;
  usuarioNome: string | null;
  ip: string | null;
  userAgent: string | null;
};

const SEM_AUTOR: AutorDaAuditoria = {
  usuarioId: null,
  usuarioEmail: null,
  usuarioNome: null,
  ip: null,
  userAgent: null,
};

// Fora de uma requisição (cron, script, teste) headers() lança: o registro segue sem
// autor nem origem de rede, e quem chama identifica a origem no snapshot.
async function origemDaRequisicao() {
  try {
    const { headers } = await import("next/headers");

    return getDadosAuditoriaAssinatura(await headers());
  } catch {
    return null;
  }
}

async function sessaoDoUsuario() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    return session?.user?.id
      ? {
          usuarioId: session.user.id,
          usuarioEmail: session.user.email ?? null,
          usuarioNome: session.user.nome ?? null,
        }
      : null;
  } catch {
    return null;
  }
}

// Autor e origem de rede do registro, lidos da requisição atual.
export async function autorDaRequisicao(): Promise<AutorDaAuditoria> {
  const origem = await origemDaRequisicao();

  if (!origem) {
    return SEM_AUTOR;
  }

  return {
    ...SEM_AUTOR,
    ...(await sessaoDoUsuario()),
    ip: origem.ip,
    userAgent: origem.userAgent,
  };
}
