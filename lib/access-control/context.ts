import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
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

export async function getAccessContext(): Promise<AccessContext> {
  const session = await auth();
  const usuarioId = session?.user?.id;

  if (!usuarioId) {
    throw new AuthenticationRequiredError();
  }

  const usuario = await db.user.findUnique({
    where: {
      id: usuarioId,
    },
    select: {
      id: true,
      isAdmin: true,
      membrosEmpresa: {
        where: { ativo: true },
        select: {
          id: true,
          empresaId: true,
          roleId: true,
          role: {
            select: { nome: true, permissoes: true },
          },
          empresa: {
            select: { planoId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!usuario) {
    throw new AuthenticationRequiredError("Sessão inválida.");
  }

  const cookieStore = await cookies();
  const empresaAtivaId = cookieStore.get(EMPRESA_ATIVA_COOKIE)?.value;

  const membroAtivo =
    usuario.membrosEmpresa.find((membro) => membro.empresaId === empresaAtivaId) ??
    usuario.membrosEmpresa[0] ??
    null;

  const permissoesPlano = membroAtivo
    ? await planoService.buscarMatriz(membroAtivo.empresa.planoId)
    : {};

  return {
    usuarioId: usuario.id,
    isAdmin: usuario.isAdmin,
    membroEmpresa: membroAtivo
      ? {
          membroId: membroAtivo.id,
          empresaId: membroAtivo.empresaId,
          roleId: membroAtivo.roleId,
          roleNome: membroAtivo.role.nome,
          permissoes: membroAtivo.role.permissoes,
          permissoesPlano,
        }
      : null,
  };
}
