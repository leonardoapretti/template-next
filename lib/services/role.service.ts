import { aplicarDependenciasDeLeitura, permissionKeys } from "@/lib/access-control/permission-registry";
import { NOME_ROLE_PROPRIETARIO } from "@/lib/access-control/policy";
import { db } from "../db";
import { BaseService } from "./config/base-service";
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

  listarTodos() {
    return DataBaseResponse.fromPromise(() =>
      this.recuperarTodos({
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, permissoes: true },
      }),
    );
  }

  // Query própria (não via BaseService.recuperarTodos) porque a tipagem
  // genérica do BaseService não propaga `select`/relações no retorno.
  listarComContagemDeMembros() {
    return DataBaseResponse.fromPromise(async () => {
      const contexto = await this.contextoUsuarioAtual();

      if (!contexto.empresaId) {
        return [];
      }

      return db.role.findMany({
        where: { empresaId: contexto.empresaId },
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          permissoes: true,
          padraoSistema: true,
          _count: { select: { membros: true } },
        },
      });
    });
  }

  // Cria um perfil de acesso customizado na empresa.
  criarPapel(empresaId: string, nome: string, permissoes: string[]) {
    return DataBaseResponse.fromPromise(() =>
      db.role.create({ data: { empresaId, nome, permissoes: normalizarPermissoes(permissoes) } }),
    );
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

      return this.atualizar({ where: { id }, data: { permissoes: normalizarPermissoes(permissoes) } });
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

      return this.atualizar({ where: { id }, data: { nome } });
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
    });
  }
}

export const roleService = new RoleService();
