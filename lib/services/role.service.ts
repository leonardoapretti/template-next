import { cacheLife, cacheTag, updateTag } from "next/cache";
import { aplicarDependenciasDeLeitura, permissionKeys } from "@/lib/access-control/permission-registry";
import { NOME_ROLE_PROPRIETARIO } from "@/lib/access-control/policy";
import { db } from "../db";
import { BaseService } from "./config/base-service";
import { papeisTag } from "./config/cache-tags";
import { DataBaseResponse } from "./config/database-response";

// Normaliza a trava de leitura também no servidor (não só na UI) — a
// lista de permissões trafega como string[] (chaves liberadas), então
// convertemos pra Record, aplicamos a dependência e devolvemos só as
// chaves que ficaram liberadas.
function normalizarPermissoes(permissoes: string[]): string[] {
  const valores = Object.fromEntries(permissionKeys.map((chave) => [chave, permissoes.includes(chave)]));
  const normalizado = aplicarDependenciasDeLeitura(valores);

  return Object.entries(normalizado)
    .filter(([, permitido]) => permitido)
    .map(([chave]) => chave);
}

async function listarTodosCached(empresaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(papeisTag(empresaId));

  return db.role.findMany({
    where: { empresaId },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, permissoes: true },
  });
}

async function listarComContagemDeMembrosCached(empresaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(papeisTag(empresaId));

  return db.role.findMany({
    where: { empresaId },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      permissoes: true,
      padraoSistema: true,
      _count: { select: { membros: true } },
    },
  });
}

class RoleService extends BaseService<typeof db.role> {
  constructor() {
    super(db.role, {
      // Role é por empresa e não tem visão global — nem admin da
      // plataforma vê papéis de outra empresa aqui (diferente de Plano,
      // que é genuinamente global). Cada tela de papéis/membros está
      // sempre atrelada à empresa ativa da sessão, admin ou não.
      scope: (contexto) => ({ empresaId: contexto.empresaId }),
    });
  }

  recuperarComPermissoes(id: string) {
    return DataBaseResponse.fromPromise(async () => {
      const role = await this.recuperar({
        where: { id },
        select: { id: true, nome: true, permissoes: true },
      });

      if (!role) {
        throw new Error("Perfil não encontrado.");
      }

      return role;
    });
  }

  // Recebe empresaId explícito (em vez de resolver via contexto/cookie
  // internamente) porque o método é cacheado com "use cache", que não
  // permite ler cookies() na pilha de chamadas. Quem chama já tem o
  // empresaId da empresa ativa (getAccessContext), igual ao restante dos
  // services (ver empresaService).
  listarTodos(empresaId: string) {
    return DataBaseResponse.fromPromise(() => listarTodosCached(empresaId));
  }

  // Mesmo motivo de listarTodos acima: empresaId explícito pra poder
  // cachear com "use cache".
  listarComContagemDeMembros(empresaId: string) {
    return DataBaseResponse.fromPromise(() => listarComContagemDeMembrosCached(empresaId));
  }

  // Cria um perfil de acesso customizado na empresa.
  criarPapel(empresaId: string, nome: string, permissoes: string[]) {
    return DataBaseResponse.fromPromise(() =>
      db.role.create({ data: { empresaId, nome, permissoes: normalizarPermissoes(permissoes) } }),
    ).then((response) => {
      if (response.isSuccess()) {
        updateTag(papeisTag(empresaId));
      }

      return response;
    });
  }

  // O Proprietário sempre tem todas as permissões (canUseFeature em
  // policy.ts já garante isso por bypass, independente do que está
  // gravado aqui) — bloqueado aqui pra a UI/action nem conseguir tentar
  // editar, não só por não aparecer o formulário.
  atualizarPermissoes(id: string, permissoes: string[]) {
    return DataBaseResponse.fromPromise(async () => {
      const role = await this.recuperarPorId(id);

      if (!role) {
        throw new Error("Perfil não encontrado.");
      }

      if (role.nome === NOME_ROLE_PROPRIETARIO) {
        throw new Error("O perfil Proprietário sempre tem todas as permissões e não pode ser editado.");
      }

      const atualizado = await this.atualizar({
        where: { id },
        data: { permissoes: normalizarPermissoes(permissoes) },
      });

      updateTag(papeisTag(role.empresaId));

      return atualizado;
    });
  }

  // Perfis padraoSistema (os 4 papéis padrão do sistema, ver
  // policy.ts.papeisPadraoDoSistema) não podem ser renomeados — só têm as
  // permissões editadas (exceto o Proprietário, ver atualizarPermissoes).
  renomear(id: string, nome: string) {
    return DataBaseResponse.fromPromise(async () => {
      const role = await this.recuperarPorId(id);

      if (!role) {
        throw new Error("Perfil não encontrado.");
      }

      if (role.padraoSistema) {
        throw new Error("Perfis padrão do sistema não podem ser renomeados.");
      }

      const atualizado = await this.atualizar({ where: { id }, data: { nome } });

      updateTag(papeisTag(role.empresaId));

      return atualizado;
    });
  }

  // Bloqueia exclusão de perfis padraoSistema e de perfis com membros
  // ativos vinculados — uma empresa nunca pode ficar com um membro sem
  // perfil.
  removerPapel(id: string) {
    return DataBaseResponse.fromPromise(async () => {
      const role = await this.recuperarPorId(id);

      if (!role) {
        throw new Error("Perfil não encontrado.");
      }

      if (role.padraoSistema) {
        throw new Error("Perfis padrão do sistema não podem ser excluídos.");
      }

      const membrosVinculados = await db.membroEmpresa.count({
        where: { roleId: id, ativo: true },
      });

      if (membrosVinculados > 0) {
        throw new Error(
          "Este perfil tem membros vinculados. Mova-os para outro perfil antes de excluir.",
        );
      }

      await db.role.delete({ where: { id } });

      updateTag(papeisTag(role.empresaId));
    });
  }
}

export const roleService = new RoleService();
