// Tags de "use cache" (next/cache) por entidade — centralizadas aqui pra
// leitura (cacheTag) e invalidação (updateTag/revalidateTag) nunca
// divergirem por um erro de digitação na string.

export function empresaTag(empresaId: string) {
  return `empresa:${empresaId}`;
}

export function membrosTag(empresaId: string) {
  return `membros:${empresaId}`;
}

export function convitesTag(empresaId: string) {
  return `convites:${empresaId}`;
}

export function empresasDoUsuarioTag(usuarioId: string) {
  return `empresas-do-usuario:${usuarioId}`;
}

export function planoMatrizTag(planoId: string | null) {
  return `plano-matriz:${planoId ?? "sem-plano"}`;
}

export function eventosAgendaTag(empresaId: string) {
  return `eventos-agenda:${empresaId}`;
}
