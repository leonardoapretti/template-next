import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { papeisTag, userTag } from "@/lib/services/config/cache-tags";
import { planoService } from "@/lib/services/plano.service";
import { AuthenticationRequiredError } from "./errors";

// Nome do cookie que guarda a empresa ativa do usuário na sessão atual.
// Nunca é confiado diretamente: getAccessContext sempre revalida o valor
// contra os vínculos ativos (MembroEmpresa) do usuário no banco.
export const EMPRESA_ATIVA_COOKIE = "empresa_ativa_id";

export type MembroEmpresaContexto = {
  membroId: string;
  empresaId: string;
  roleId: string;
  roleNome: string;
  permissoes: string[];
  // Teto de features liberadas pelo plano da empresa — `null` (empresa
  // sem plano vinculado) equivale a tudo liberado, ver
  // `planoService.buscarMatriz`. `canUseFeature` exige as duas camadas.
  permissoesPlano: Record<string, boolean>;
};

export type AccessContext = {
  usuarioId: string;
  isAdmin: boolean;
  membroEmpresa: MembroEmpresaContexto | null;
};

// Vínculos de empresa do usuário — não inclui as permissões do papel nem a
// matriz do plano de propósito: essas duas mudam por motivos diferentes
// (edição de papel, edição de plano) e são cacheadas/invalidadas cada uma
// pela sua própria tag (buscarPapelParaAccessContextCached, abaixo, e
// planoService.buscarMatriz). Compor assim evita ter que invalidar o cache
// de cada usuário da empresa quando só a permissão de um papel muda.
async function buscarUsuarioComMembrosCached(usuarioId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(userTag(usuarioId));

  return db.user.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      isAdmin: true,
      membrosEmpresa: {
        where: { ativo: true },
        select: {
          id: true,
          empresaId: true,
          roleId: true,
          empresa: {
            select: { planoId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

async function buscarPapelParaAccessContextCached(roleId: string, empresaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(papeisTag(empresaId));

  return db.role.findUniqueOrThrow({
    where: { id: roleId },
    select: { nome: true, permissoes: true },
  });
}

export async function getAccessContext(): Promise<AccessContext> {
  const session = await auth();
  const usuarioId = session?.user?.id;

  if (!usuarioId) {
    throw new AuthenticationRequiredError();
  }

  const usuario = await buscarUsuarioComMembrosCached(usuarioId);

  if (!usuario) {
    throw new AuthenticationRequiredError("Sessão inválida.");
  }

  const cookieStore = await cookies();
  const empresaAtivaId = cookieStore.get(EMPRESA_ATIVA_COOKIE)?.value;

  const membroAtivo =
    usuario.membrosEmpresa.find((membro) => membro.empresaId === empresaAtivaId) ??
    usuario.membrosEmpresa[0] ??
    null;

  if (!membroAtivo) {
    return {
      usuarioId: usuario.id,
      isAdmin: usuario.isAdmin,
      membroEmpresa: null,
    };
  }

  const [role, permissoesPlano] = await Promise.all([
    buscarPapelParaAccessContextCached(membroAtivo.roleId, membroAtivo.empresaId),
    planoService.buscarMatriz(membroAtivo.empresa.planoId),
  ]);

  return {
    usuarioId: usuario.id,
    isAdmin: usuario.isAdmin,
    membroEmpresa: {
      membroId: membroAtivo.id,
      empresaId: membroAtivo.empresaId,
      roleId: membroAtivo.roleId,
      roleNome: role.nome,
      permissoes: role.permissoes,
      permissoesPlano,
    },
  };
}
