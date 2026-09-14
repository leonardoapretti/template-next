// Tags de "use cache" (next/cache) por entidade — centralizadas aqui pra
// leitura (cacheTag) e invalidação (updateTag/revalidateTag) nunca
// divergirem por um erro de digitação na string.

export function empresaTag(empresaId: string) {
  return `empresa:${empresaId}`;
}

export function membrosTag(empresaId: string) {
  return `membros:${empresaId}`;
}

export function papeisTag(empresaId: string) {
  return `papeis:${empresaId}`;
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

// Vínculos de empresa do usuário (getAccessContext) — invalidar sempre que
// mudar algo que afete o próprio acesso dele: papel/status de um vínculo
// específico (alterarPapelMembro, inativarMembro), aceite de convite ou
// virar admin da plataforma. Não cobre mudança de permissões do papel em
// si (isso é papeisTag) nem do plano (planoMatrizTag) — cada um invalida
// separadamente, cada camada da composição em getAccessContext.
export function userTag(usuarioId: string) {
  return `user:${usuarioId}`;
}
