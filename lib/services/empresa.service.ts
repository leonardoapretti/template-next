import { cacheLife, cacheTag, updateTag } from "next/cache";
import { NOME_ROLE_PROPRIETARIO, papeisPadraoDoSistema } from "@/lib/access-control/policy";
import { getAppBaseUrl } from "@/lib/utils/routes/auth-links";
import { db } from "../db";
import { actionTokenService } from "./actiontoken.service";
import { auditLogService } from "./audit-log.service";
import { auditTxContext } from "./audit-log-context";
import {
  convitesTag,
  empresaTag,
  empresasDoUsuarioTag,
  membrosTag,
  userTag,
} from "./config/cache-tags";
import { DataBaseResponse } from "./config/database-response";
import { criarEmailHtml, emailService } from "./email.service";

async function listarDoUsuarioCached(usuarioId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(empresasDoUsuarioTag(usuarioId));

  return db.membroEmpresa.findMany({
    where: { usuarioId, ativo: true },
    select: {
      empresa: { select: { id: true, nome: true, ativo: true } },
      role: { select: { nome: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function buscarPorIdCached(empresaId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(empresaTag(empresaId));

  return db.empresa.findUniqueOrThrow({ where: { id: empresaId } });
}

async function listarMembrosCached(empresaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(membrosTag(empresaId));

  return db.membroEmpresa.findMany({
    where: { empresaId },
    select: {
      id: true,
      usuarioId: true,
      ativo: true,
      usuario: { select: { nome: true, email: true } },
      role: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function listarConvitesPendentesCached(empresaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(convitesTag(empresaId));

  return db.actionToken.findMany({
    where: {
      tipo: "CONVITE_MEMBRO_EMPRESA",
      empresaId,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      role: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

// Código do único plano existente hoje. Novas empresas nascem vinculadas
// a ele quando existe; se ainda não foi semeado, a empresa nasce sem
// plano — tratado como "tudo liberado" por planoService.buscarMatriz,
// sem regressão.
const CODIGO_PLANO_PADRAO = "PADRAO";

// Convite expira em 24h.
const DURACAO_CONVITE_MS = 24 * 60 * 60 * 1000;

type CriarEmpresaInput = {
  nome: string;
};

type CriarConviteInput = {
  empresaId: string;
  roleId: string;
  email: string;
  convidadoPorNome: string;
};

class EmpresaService {
  // Cria a empresa e semeia os 4 papéis padrão do sistema (ver
  // policy.ts.papeisPadraoDoSistema), vinculando quem criou como
  // Proprietário.
  criarEmpresa(usuarioId: string, input: CriarEmpresaInput) {
    return DataBaseResponse.fromPromise(() =>
      db.$transaction((tx) =>
        auditTxContext.run(tx, async () => {
          const planoPadrao = await tx.plano.findUnique({
            where: { codigo: CODIGO_PLANO_PADRAO },
            select: { id: true },
          });

          const empresa = await tx.empresa.create({
            data: { nome: input.nome, planoId: planoPadrao?.id },
          });

          const papeisCriados = await Promise.all(
            papeisPadraoDoSistema().map((papel) =>
              tx.role.create({
                data: {
                  empresaId: empresa.id,
                  nome: papel.nome,
                  permissoes: papel.permissoes,
                  padraoSistema: true,
                },
              }),
            ),
          );

          const roleProprietario = papeisCriados.find(
            (papel) => papel.nome === NOME_ROLE_PROPRIETARIO,
          );

          if (!roleProprietario) {
            throw new Error("Papel Proprietário não foi semeado corretamente.");
          }

          await tx.membroEmpresa.create({
            data: {
              empresaId: empresa.id,
              usuarioId,
              roleId: roleProprietario.id,
            },
          });

          return empresa;
        }),
      ),
    ).then((response) => {
      if (response.isSuccess()) {
        updateTag(empresasDoUsuarioTag(usuarioId));
        updateTag(userTag(usuarioId));
      }

      return response;
    });
  }

  // Empresas às quais o usuário tem vínculo ativo — base para a tela de
  // seleção/troca de empresa (um usuário pode ter vínculo com várias).
  listarDoUsuario(usuarioId: string) {
    return DataBaseResponse.fromPromise(() => listarDoUsuarioCached(usuarioId));
  }

  buscarPorId(empresaId: string) {
    return DataBaseResponse.fromPromise(() => buscarPorIdCached(empresaId));
  }

  atualizarConfiguracao(empresaId: string, input: { nome: string }) {
    return DataBaseResponse.fromPromise(() =>
      db.empresa.update({ where: { id: empresaId }, data: { nome: input.nome } }),
    ).then((response) => {
      if (response.isSuccess()) {
        updateTag(empresaTag(empresaId));
      }

      return response;
    });
  }

  // Confirma que o usuário tem vínculo ativo com a empresa antes de
  // permitir selecioná-la como empresa ativa — nunca aceitar um empresaId
  // vindo do cliente sem essa checagem.
  async possuiVinculoAtivo(usuarioId: string, empresaId: string) {
    const membro = await db.membroEmpresa.findFirst({
      where: { usuarioId, empresaId, ativo: true },
      select: { id: true },
    });

    return membro !== null;
  }

  // Traz ativos e inativos — a tela de membros filtra por status na
  // própria data-table, então precisa dos dois pra o filtro fazer sentido.
  listarMembros(empresaId: string) {
    return DataBaseResponse.fromPromise(() => listarMembrosCached(empresaId));
  }

  // Convites de CONVITE_MEMBRO_EMPRESA ainda pendentes (não aceitos, não
  // revogados, não expirados) — a tela de membros mostra essas pessoas na
  // mesma lista com status "Convite enviado", pra quem convidou saber que
  // já convidou sem precisar ir na tela de e-mails/logs.
  listarConvitesPendentes(empresaId: string) {
    return DataBaseResponse.fromPromise(() => listarConvitesPendentesCached(empresaId));
  }

  // Troca o papel de um membro da empresa — sempre confirma que o membro
  // pertence à empresa informada antes de escrever, nunca aceitando o
  // vínculo do cliente sem essa checagem.
  alterarPapelMembro(empresaId: string, membroId: string, roleId: string) {
    let usuarioIdDoMembro: string | null = null;

    return DataBaseResponse.fromPromise(async () => {
      const membro = await db.membroEmpresa.findFirst({
        where: { id: membroId, empresaId, ativo: true },
        select: { id: true, usuarioId: true },
      });

      if (!membro) {
        throw new Error("Membro não encontrado nesta empresa.");
      }

      const role = await db.role.findFirst({
        where: { id: roleId, empresaId },
        select: { id: true },
      });

      if (!role) {
        throw new Error("Perfil não encontrado nesta empresa.");
      }

      usuarioIdDoMembro = membro.usuarioId;

      return db.membroEmpresa.update({ where: { id: membroId }, data: { roleId } });
    }).then((response) => {
      if (response.isSuccess()) {
        updateTag(membrosTag(empresaId));
        if (usuarioIdDoMembro) {
          updateTag(userTag(usuarioIdDoMembro));
        }
      }

      return response;
    });
  }

  // Uma empresa nunca pode ficar sem Proprietário — bloqueia inativar o
  // único membro ativo com esse papel, e bloqueia um membro de inativar a
  // si mesmo.
  inativarMembro(empresaId: string, membroId: string, usuarioSolicitanteId: string) {
    let usuarioIdDoMembro: string | null = null;

    return DataBaseResponse.fromPromise(async () => {
      const membro = await db.membroEmpresa.findFirst({
        where: { id: membroId, empresaId, ativo: true },
        select: { id: true, usuarioId: true, role: { select: { nome: true } } },
      });

      if (!membro) {
        throw new Error("Membro não encontrado nesta empresa.");
      }

      if (membro.usuarioId === usuarioSolicitanteId) {
        throw new Error("Você não pode inativar seu próprio vínculo com a empresa.");
      }

      if (membro.role.nome === NOME_ROLE_PROPRIETARIO) {
        const proprietariosAtivos = await db.membroEmpresa.count({
          where: { empresaId, ativo: true, role: { nome: NOME_ROLE_PROPRIETARIO } },
        });

        if (proprietariosAtivos <= 1) {
          throw new Error("A empresa precisa ter ao menos um Proprietário ativo.");
        }
      }

      usuarioIdDoMembro = membro.usuarioId;

      return db.membroEmpresa.update({ where: { id: membroId }, data: { ativo: false } });
    }).then((response) => {
      if (response.isSuccess()) {
        updateTag(membrosTag(empresaId));
        if (usuarioIdDoMembro) {
          updateTag(userTag(usuarioIdDoMembro));
        }
      }

      return response;
    });
  }

  // Cria o convite (ActionToken, 24h) e envia por e-mail. revogarAnteriores
  // invalida convites pendentes anteriores para o mesmo e-mail nesta
  // empresa, evitando múltiplos links válidos simultâneos.
  criarConviteEEnviar(input: CriarConviteInput) {
    return DataBaseResponse.fromPromise(async () => {
      const empresa = await db.empresa.findUniqueOrThrow({
        where: { id: input.empresaId },
        select: { nome: true },
      });

      const tokenResponse = await actionTokenService.criar({
        tipo: "CONVITE_MEMBRO_EMPRESA",
        duracaoMs: DURACAO_CONVITE_MS,
        email: input.email,
        empresaId: input.empresaId,
        roleId: input.roleId,
        revogarAnteriores: true,
      });

      if (tokenResponse.isError()) {
        throw new Error(tokenResponse.getErrorMessage());
      }

      const link = new URL(
        `/dashboard/empresas/convite/${tokenResponse.data.token}`,
        getAppBaseUrl(),
      ).toString();

      const envioResponse = await emailService.enviarEmail({
        destinatario: input.email,
        assunto: `Convite para ${empresa.nome}`,
        texto: `${input.convidadoPorNome} convidou você para fazer parte de ${empresa.nome}. Acesse: ${link}`,
        html: criarEmailHtml({
          titulo: `Convite para ${empresa.nome}`,
          paragrafos: [
            `${input.convidadoPorNome} convidou você para fazer parte de ${empresa.nome}.`,
            "Este convite expira em 24 horas.",
          ],
          cta: { label: "Ver convite", url: link },
        }),
      });

      if (envioResponse.isError()) {
        throw new Error(envioResponse.getErrorMessage() || "Não foi possível enviar o convite.");
      }

      return { enviado: true };
    }).then((response) => {
      if (response.isSuccess()) {
        updateTag(convitesTag(input.empresaId));
      }

      return response;
    });
  }

  // Revoga um convite pendente — nunca aceita revogar um token de outra
  // empresa (empresaId sempre vem do vínculo ativo de quem chama, nunca do
  // client) nem um já usado/revogado.
  revogarConvite(empresaId: string, actionTokenId: string) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await db.actionToken.findFirst({
        where: {
          id: actionTokenId,
          empresaId,
          tipo: "CONVITE_MEMBRO_EMPRESA",
          usedAt: null,
          revokedAt: null,
        },
        select: { id: true },
      });

      if (!actionToken) {
        throw new Error("Convite não encontrado ou já respondido.");
      }

      await db.actionToken.update({
        where: { id: actionToken.id },
        data: { revokedAt: new Date() },
      });
    }).then((response) => {
      if (response.isSuccess()) {
        updateTag(convitesTag(empresaId));
      }

      return response;
    });
  }

  // Reenvia um convite pendente — reaproveita criarConviteEEnviar com o
  // mesmo e-mail/papel do token atual, que já revoga o token anterior
  // (revogarAnteriores) antes de criar e enviar o novo, então nunca ficam
  // dois links válidos ao mesmo tempo.
  reenviarConvite(empresaId: string, actionTokenId: string, convidadoPorNome: string) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await db.actionToken.findFirst({
        where: {
          id: actionTokenId,
          empresaId,
          tipo: "CONVITE_MEMBRO_EMPRESA",
          usedAt: null,
          revokedAt: null,
        },
        select: { email: true, roleId: true },
      });

      if (!actionToken?.email || !actionToken.roleId) {
        throw new Error("Convite não encontrado ou já respondido.");
      }

      const resposta = await this.criarConviteEEnviar({
        empresaId,
        roleId: actionToken.roleId,
        email: actionToken.email,
        convidadoPorNome,
      });

      if (resposta.isError()) {
        throw new Error(resposta.getErrorMessage());
      }

      return resposta.data;
    });
  }

  // Convite sempre exige aceite explícito, mesmo se o e-mail já tiver
  // conta na plataforma (associada a outra empresa ou não). Só confirma
  // que o token é válido e expõe os dados para a tela de aceite — não
  // vincula nada ainda.
  buscarConvitePorToken(token: string) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await actionTokenService.buscarValido({
        token,
        tipo: "CONVITE_MEMBRO_EMPRESA",
      });

      if (!actionToken?.empresa || !actionToken.role || !actionToken.email) {
        throw new Error("Convite inválido ou expirado.");
      }

      return {
        empresaNome: actionToken.empresa.nome,
        roleNome: actionToken.role.nome,
        email: actionToken.email,
      };
    });
  }

  // Aceite explícito — o e-mail da sessão precisa bater com o e-mail
  // convidado, e o aceite é registrado no AuditLog (evento explícito, não
  // uma escrita de model auditada automaticamente).
  aceitarConvite(usuario: { id: string; email: string }, token: string) {
    return DataBaseResponse.fromPromise(() =>
      db.$transaction((tx) =>
        auditTxContext.run(tx, async () => {
          const actionToken = await tx.actionToken.findFirst({
            where: {
              tipo: "CONVITE_MEMBRO_EMPRESA",
              tokenHash: actionTokenService.hashToken(token),
              usedAt: null,
              revokedAt: null,
              expiresAt: { gt: new Date() },
            },
          });

          if (!actionToken?.empresaId || !actionToken.roleId || !actionToken.email) {
            throw new Error("Convite inválido ou expirado.");
          }

          if (actionToken.email.toLowerCase() !== usuario.email.trim().toLowerCase()) {
            throw new Error("Este convite foi enviado para outro e-mail.");
          }

          const jaMembro = await tx.membroEmpresa.findUnique({
            where: {
              empresaId_usuarioId: { empresaId: actionToken.empresaId, usuarioId: usuario.id },
            },
          });

          if (jaMembro) {
            throw new Error("Você já faz parte desta empresa.");
          }

          await tx.membroEmpresa.create({
            data: {
              empresaId: actionToken.empresaId,
              usuarioId: usuario.id,
              roleId: actionToken.roleId,
            },
          });

          await tx.actionToken.update({
            where: { id: actionToken.id },
            data: { usedAt: new Date() },
          });

          await auditLogService.registrar(
            {
              usuarioId: usuario.id,
              usuarioEmail: usuario.email,
              acao: "CONVITE_MEMBRO_EMPRESA_ACEITO",
              entidade: "Empresa",
              entidadeId: actionToken.empresaId,
            },
            tx,
          );

          return { empresaId: actionToken.empresaId };
        }),
      ),
    ).then((response) => {
      if (response.isSuccess()) {
        updateTag(membrosTag(response.data.empresaId));
        updateTag(convitesTag(response.data.empresaId));
        updateTag(empresasDoUsuarioTag(usuario.id));
        updateTag(userTag(usuario.id));
      }

      return response;
    });
  }
}

export const empresaService = new EmpresaService();
