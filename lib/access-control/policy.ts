import { permissionKeys, permissionKeysExcludingKind } from "./permission-registry";
import type { AccessContext } from "./context";

// Nome do papel padrão semeado como proprietário na criação de uma empresa.
// Identifica as duas ações-guard exclusivas dele (inativar empresa,
// transferir titularidade) e, em canUseFeature abaixo, o bypass que
// garante que o Proprietário sempre tem todas as permissões da empresa —
// suas permissões não são editáveis em app/dashboard/empresa/papeis (ver
// role.service.ts.atualizarPermissoes).
export const NOME_ROLE_PROPRIETARIO = "Proprietário";
export const NOME_ROLE_ADMINISTRADOR = "Administrador";
export const NOME_ROLE_SECRETARIO = "Secretário";
export const NOME_ROLE_PROFISSIONAL = "Profissional";

// Os 4 papéis padrão semeados em toda empresa nova (Empresa.criarEmpresa
// e prisma/seed-empresas.ts), únicos com `padraoSistema: true` — não podem
// ser renomeados nem excluídos (ver role.service.ts). Proprietário e
// Administrador nascem com todas as permissões (o Proprietário nem chega
// a usar essa lista: canUseFeature acima faz bypass e a edição é
// bloqueada). Secretário e Profissional nascem com tudo exceto exclusão —
// o template ainda não tem um recurso "financeiro" pra restringir só do
// Profissional; quando esse recurso existir, remova as chaves dele do
// conjunto do Profissional aqui.
export function papeisPadraoDoSistema(): { nome: string; permissoes: string[] }[] {
  const todasAsPermissoes = permissionKeys;
  const semExclusao = permissionKeysExcludingKind("delete");

  return [
    { nome: NOME_ROLE_PROPRIETARIO, permissoes: todasAsPermissoes },
    { nome: NOME_ROLE_ADMINISTRADOR, permissoes: todasAsPermissoes },
    { nome: NOME_ROLE_SECRETARIO, permissoes: semExclusao },
    { nome: NOME_ROLE_PROFISSIONAL, permissoes: semExclusao },
  ];
}

export type AccessRole = "ADMIN" | "PROPRIETARIO_EMPRESA";

export function canActAs(ctx: AccessContext, role: AccessRole) {
  if (role === "ADMIN") {
    return ctx.isAdmin;
  }

  if (role === "PROPRIETARIO_EMPRESA") {
    return ctx.isAdmin || ctx.membroEmpresa?.roleNome === NOME_ROLE_PROPRIETARIO;
  }

  return false;
}

// Usuário tem algum vínculo ativo com uma empresa (não necessariamente o
// papel de Proprietário) — usado para gates de área administrativa de
// empresa, análogo ao canActAs(ctx, "ADMIN") da área global.
export function temEmpresaAtiva(ctx: AccessContext) {
  return ctx.isAdmin || ctx.membroEmpresa !== null;
}

// Permissão no formato "recurso:acao" (ex.: "agenda:create"). Admin da
// plataforma ignora o perfil de acesso e tem permissão irrestrita; fora
// isso, a permissão precisa estar em duas camadas independentes: no Role
// do vínculo ativo com a empresa (ctx.membroEmpresa.permissoes) E liberada
// no plano da empresa (ctx.membroEmpresa.permissoesPlano). Uma sem a
// outra não é suficiente. Exceção: o Proprietário sempre passa na camada
// de Role (sempre todas as permissões, não editável) — continua sujeito
// ao teto do plano, igual a qualquer outro membro.
export function canUseFeature(ctx: AccessContext, permissao: string) {
  if (ctx.isAdmin) {
    return true;
  }

  if (!ctx.membroEmpresa) {
    return false;
  }

  const permissaoLiberadaPeloRole =
    ctx.membroEmpresa.roleNome === NOME_ROLE_PROPRIETARIO ||
    ctx.membroEmpresa.permissoes.includes(permissao);

  return permissaoLiberadaPeloRole && Boolean(ctx.membroEmpresa.permissoesPlano[permissao]);
}
