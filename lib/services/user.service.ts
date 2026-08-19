// services/user.service.ts

import bcrypt from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import { getAppBaseUrl } from "@/lib/utils/routes/auth-links";
import { db } from "../db";
import { actionTokenService } from "./actiontoken.service";
import { auditTxContext } from "./audit-log-context";
import { BaseService } from "./config/base-service";
import { DataBaseResponse } from "./config/database-response";
import type { SemCamposHash } from "./crypto/tipos";
import { criarEmailHtml, emailService } from "./email.service";

const DURACAO_TOKEN_CONFIRMACAO_EMAIL_MS = 24 * 60 * 60 * 1000;
const DURACAO_TOKEN_REDEFINICAO_SENHA_MS = 60 * 60 * 1000;
const DURACAO_TOKEN_ALTERACAO_EMAIL_MS = 60 * 60 * 1000;

type CriarUsuarioInput = {
  nome: string;
  email: string;
  senha: string;
  emailVerificadoEm?: Date | null;
};

function formatarDuracaoToken(duracaoMs: number) {
  const minutos = Math.floor(duracaoMs / (60 * 1000));
  const horas = Math.floor(duracaoMs / (60 * 60 * 1000));
  const dias = Math.floor(duracaoMs / (24 * 60 * 60 * 1000));

  if (dias >= 1 && duracaoMs % (24 * 60 * 60 * 1000) === 0) {
    return dias === 1 ? "1 dia" : `${dias} dias`;
  }

  if (horas >= 1 && duracaoMs % (60 * 60 * 1000) === 0) {
    return horas === 1 ? "1 hora" : `${horas} horas`;
  }

  if (minutos >= 1) {
    return minutos === 1 ? "1 minuto" : `${minutos} minutos`;
  }

  return "alguns instantes";
}

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

class UserService extends BaseService<typeof db.user> {
  constructor() {
    super(db.user);
  }

  private criarUsuarioNoBanco(input: CriarUsuarioInput) {
    return db.$transaction(async (tx) =>
      auditTxContext.run(tx, async () => {
        const usuario = await tx.user.create({
          data: {
            nome: input.nome,
            email: normalizarEmail(input.email),
            senha: input.senha,
            emailVerificado: input.emailVerificadoEm ?? null,
          } satisfies SemCamposHash<Prisma.UserCreateInput> as Prisma.UserCreateInput,
          select: {
            id: true,
            nome: true,
            email: true,
            isAdmin: true,
            emailVerificado: true,
            createdAt: true,
          },
        });

        return usuario;
      }),
    );
  }

  recuperarPorEmail(email: string) {
    return DataBaseResponse.fromPromise(() =>
      db.user.findUnique({
        where: {
          email: normalizarEmail(email),
        } as Prisma.UserWhereUniqueInput,
        select: {
          id: true,
          nome: true,
          email: true,
          imagem: true,
          isAdmin: true,
          emailVerificado: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
  }

  recuperarPerfilPorId(id: string) {
    return DataBaseResponse.fromPromise(() =>
      db.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          imagem: true,
          isAdmin: true,
          emailVerificado: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
  }

  recuperarEmailPorEmail(email: string) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await db.user.findUniqueOrThrow({
        where: {
          email: normalizarEmail(email),
        } as Prisma.UserWhereUniqueInput,
        select: {
          email: true,
        },
      });

      return usuario.email;
    });
  }

  recuperarUsuarioLogin(email: string) {
    return db.user.findUnique({
      where: {
        email: normalizarEmail(email),
      } as Prisma.UserWhereUniqueInput,
      select: {
        id: true,
        nome: true,
        email: true,
        imagem: true,
        senha: true,
        emailVerificado: true,
        isAdmin: true,
      },
    });
  }

  buscarPerfilAcesso(id: string) {
    return DataBaseResponse.fromPromise(() =>
      db.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          isAdmin: true,
        },
      }),
    );
  }

  criarUsuario(input: CriarUsuarioInput) {
    return DataBaseResponse.fromPromise(() => this.criarUsuarioNoBanco(input));
  }

  criarUsuarioComConfirmacaoEmail(input: CriarUsuarioInput) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await this.criarUsuarioNoBanco(input);

      const envioResponse = await this.enviarEmailConfirmacaoConta(usuario.id);

      if (envioResponse.isError()) {
        throw new Error(envioResponse.getErrorMessage());
      }

      return {
        usuario,
        confirmacaoEmail: envioResponse.data,
      };
    });
  }

  enviarEmailConfirmacaoConta(userId: string) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await db.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          emailVerificado: true,
        },
      });

      if (usuario.emailVerificado) {
        return {
          enviado: false,
          jaVerificado: true,
          expiresAt: null,
        };
      }

      const duracaoTokenMs = DURACAO_TOKEN_CONFIRMACAO_EMAIL_MS;
      const duracaoTokenTexto = formatarDuracaoToken(duracaoTokenMs);

      const tokenResponse = await actionTokenService.criar({
        tipo: "VERIFICACAO_EMAIL",
        duracaoMs: duracaoTokenMs,
        userId: usuario.id,
        email: usuario.email,
        revogarAnteriores: true,
      });

      if (tokenResponse.isError()) {
        throw new Error(tokenResponse.getErrorMessage());
      }

      const { token, expiresAt } = tokenResponse.data;

      const link = new URL(`/login/verificar-email/${token}`, getAppBaseUrl()).toString();

      const emailResponse = await emailService.enviarEmail({
        destinatario: usuario.email,
        assunto: "Confirme seu e-mail",
        usarEmailUsuarioComoReplyTo: false,
        texto: [
          `Olá, ${usuario.nome}.`,
          "",
          "Para ativar sua conta, confirme seu e-mail acessando o link abaixo:",
          "",
          link,
          "",
          `Este link expira em ${duracaoTokenTexto}.`,
          "",
          "Se você não criou uma conta, ignore esta mensagem.",
        ].join("\n"),
        html: criarEmailHtml({
          preheader: "Confirme seu e-mail para ativar sua conta.",
          titulo: "Confirme seu e-mail",
          saudacao: `Olá, ${usuario.nome}.`,
          paragrafos: [
            "Para ativar sua conta, confirme seu e-mail acessando o botão abaixo.",
            `Este link expira em ${duracaoTokenTexto}.`,
          ],
          cta: {
            label: "Confirmar e-mail",
            url: link,
          },
          observacao: "Se você não criou uma conta, ignore esta mensagem.",
        }),
      });

      if (emailResponse.isError()) {
        throw new Error(emailResponse.getErrorMessage());
      }

      return {
        enviado: true,
        jaVerificado: false,
        expiresAt,
      };
    });
  }

  reenviarEmailConfirmacaoConta(email: string) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await db.user.findUnique({
        where: {
          email: normalizarEmail(email),
        } as Prisma.UserWhereUniqueInput,
        select: {
          id: true,
          emailVerificado: true,
        },
      });

      /**
       * Retorno genérico para evitar enumeração de e-mails.
       * Assim ninguém consegue descobrir se o e-mail existe ou não no sistema.
       */
      if (!usuario || usuario.emailVerificado) {
        return {
          enviado: true,
        };
      }

      const envioResponse = await this.enviarEmailConfirmacaoConta(usuario.id);

      if (envioResponse.isError()) {
        throw new Error(envioResponse.getErrorMessage());
      }

      return {
        enviado: true,
      };
    });
  }

  confirmarEmailContaPorToken(token: string) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await db.actionToken.findFirst({
        where: {
          tipo: "VERIFICACAO_EMAIL",
          tokenHash: actionTokenService.hashToken(token),
          usedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              emailVerificado: true,
            },
          },
        },
      });

      if (!actionToken?.user) {
        throw new Error("Este link de confirmação é inválido ou expirou.");
      }

      if (actionToken.user.emailVerificado) {
        await db.actionToken.update({
          where: {
            id: actionToken.id,
          },
          data: {
            usedAt: new Date(),
          },
        });

        return {
          emailVerificado: true,
          jaEstavaVerificado: true,
        };
      }

      await db.$transaction([
        db.user.update({
          where: {
            id: actionToken.user.id,
          },
          data: {
            emailVerificado: new Date(),
          },
        }),

        db.actionToken.update({
          where: {
            id: actionToken.id,
          },
          data: {
            usedAt: new Date(),
          },
        }),
      ]);

      return {
        emailVerificado: true,
        jaEstavaVerificado: false,
      };
    });
  }

  enviarEmailAlteracaoSenha(userId: string) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await db.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      });

      const duracaoTokenMs = DURACAO_TOKEN_REDEFINICAO_SENHA_MS;
      const duracaoTokenTexto = formatarDuracaoToken(duracaoTokenMs);

      const tokenResponse = await actionTokenService.criar({
        tipo: "REDEFINICAO_SENHA",
        duracaoMs: duracaoTokenMs,
        userId: usuario.id,
        email: usuario.email,
        revogarAnteriores: true,
      });

      if (tokenResponse.isError()) {
        throw new Error(tokenResponse.getErrorMessage());
      }

      const { token, expiresAt } = tokenResponse.data;

      const link = new URL(`/login/redefinir-senha/${token}`, getAppBaseUrl()).toString();

      const emailResponse = await emailService.enviarEmail({
        destinatario: usuario.email,
        assunto: "Altere sua senha",
        usarEmailUsuarioComoReplyTo: false,
        texto: [
          `Olá, ${usuario.nome}.`,
          "",
          "Para alterar sua senha, acesse o link abaixo:",
          "",
          link,
          "",
          `Este link expira em ${duracaoTokenTexto}.`,
          "",
          "Se você não solicitou esta alteração, ignore esta mensagem.",
        ].join("\n"),
        html: criarEmailHtml({
          preheader: "Use este link para alterar sua senha.",
          titulo: "Alterar senha",
          saudacao: `Olá, ${usuario.nome}.`,
          paragrafos: [
            "Para alterar sua senha, acesse o botão abaixo.",
            `Este link expira em ${duracaoTokenTexto}.`,
          ],
          cta: {
            label: "Alterar senha",
            url: link,
          },
          observacao: "Se você não solicitou esta alteração, ignore esta mensagem.",
        }),
      });

      if (emailResponse.isError()) {
        throw new Error(emailResponse.getErrorMessage());
      }

      return {
        enviado: true,
        expiresAt,
      };
    });
  }

  verificarTokenAlteracaoSenha(token: string) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await db.actionToken.findFirst({
        where: {
          tipo: "REDEFINICAO_SENHA",
          tokenHash: actionTokenService.hashToken(token),
          usedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      if (!actionToken?.user) {
        throw new Error("Este link de alteração de senha é inválido ou expirou.");
      }

      return {
        usuario: actionToken.user,
        expiresAt: actionToken.expiresAt,
      };
    });
  }

  alterarSenhaPorToken(token: string, senha: string) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await db.actionToken.findFirst({
        where: {
          tipo: "REDEFINICAO_SENHA",
          tokenHash: actionTokenService.hashToken(token),
          usedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!actionToken?.user) {
        throw new Error("Este link de alteração de senha é inválido ou expirou.");
      }

      const senhaHash = await bcrypt.hash(senha, 12);

      await db.$transaction([
        db.user.update({
          where: {
            id: actionToken.user.id,
          },
          data: {
            senha: senhaHash,
          },
        }),
        db.actionToken.update({
          where: {
            id: actionToken.id,
          },
          data: {
            usedAt: new Date(),
          },
        }),
        db.actionToken.updateMany({
          where: {
            tipo: "REDEFINICAO_SENHA",
            userId: actionToken.user.id,
            usedAt: null,
            revokedAt: null,
            id: {
              not: actionToken.id,
            },
          },
          data: {
            revokedAt: new Date(),
          },
        }),
      ]);

      return {
        senhaAlterada: true,
      };
    });
  }

  verificarSenhaAtual(userId: string, senha: string) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await db.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          senha: true,
        },
      });

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      if (!senhaCorreta) {
        throw new Error("Senha atual incorreta.");
      }

      return { senhaCorreta: true };
    });
  }

  enviarEmailAlteracaoEmail(userId: string, novoEmail: string) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await db.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          id: true,
          nome: true,
        },
      });

      const emailEmUso = await db.user.findUnique({
        where: {
          email: normalizarEmail(novoEmail),
        } as Prisma.UserWhereUniqueInput,
        select: {
          id: true,
        },
      });

      if (emailEmUso) {
        throw new Error("Já existe uma conta com este e-mail.");
      }

      const duracaoTokenMs = DURACAO_TOKEN_ALTERACAO_EMAIL_MS;
      const duracaoTokenTexto = formatarDuracaoToken(duracaoTokenMs);

      const tokenResponse = await actionTokenService.criar({
        tipo: "ALTERACAO_EMAIL",
        duracaoMs: duracaoTokenMs,
        userId: usuario.id,
        email: normalizarEmail(novoEmail),
        revogarAnteriores: true,
      });

      if (tokenResponse.isError()) {
        throw new Error(tokenResponse.getErrorMessage());
      }

      const { token, expiresAt } = tokenResponse.data;

      const link = new URL(`/dashboard/conta/confirmar-email/${token}`, getAppBaseUrl()).toString();

      const emailResponse = await emailService.enviarEmail({
        destinatario: normalizarEmail(novoEmail),
        assunto: "Confirme seu novo e-mail",
        usarEmailUsuarioComoReplyTo: false,
        texto: [
          `Olá, ${usuario.nome}.`,
          "",
          "Para confirmar este endereço como o novo e-mail da sua conta, acesse o link abaixo:",
          "",
          link,
          "",
          `Este link expira em ${duracaoTokenTexto}.`,
          "",
          "Se você não solicitou esta alteração, ignore esta mensagem.",
        ].join("\n"),
        html: criarEmailHtml({
          preheader: "Confirme seu novo e-mail.",
          titulo: "Confirme seu novo e-mail",
          saudacao: `Olá, ${usuario.nome}.`,
          paragrafos: [
            "Para confirmar este endereço como o novo e-mail da sua conta, acesse o botão abaixo.",
            `Este link expira em ${duracaoTokenTexto}.`,
          ],
          cta: {
            label: "Confirmar novo e-mail",
            url: link,
          },
          observacao: "Se você não solicitou esta alteração, ignore esta mensagem.",
        }),
      });

      if (emailResponse.isError()) {
        throw new Error(emailResponse.getErrorMessage());
      }

      return {
        enviado: true,
        expiresAt,
      };
    });
  }

  confirmarAlteracaoEmailPorToken(token: string) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await db.actionToken.findFirst({
        where: {
          tipo: "ALTERACAO_EMAIL",
          tokenHash: actionTokenService.hashToken(token),
          usedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!actionToken?.user || !actionToken.email) {
        throw new Error("Este link de confirmação é inválido ou expirou.");
      }

      const emailEmUso = await db.user.findUnique({
        where: {
          email: actionToken.email,
        } as Prisma.UserWhereUniqueInput,
        select: {
          id: true,
        },
      });

      if (emailEmUso && emailEmUso.id !== actionToken.user.id) {
        throw new Error("Já existe uma conta com este e-mail.");
      }

      await db.$transaction([
        db.user.update({
          where: {
            id: actionToken.user.id,
          },
          data: {
            email: actionToken.email,
            emailVerificado: new Date(),
          } satisfies SemCamposHash<Prisma.UserUpdateInput> as Prisma.UserUpdateInput,
        }),
        db.actionToken.update({
          where: {
            id: actionToken.id,
          },
          data: {
            usedAt: new Date(),
          },
        }),
      ]);

      return {
        emailAlterado: true,
      };
    });
  }

  usuarioIsEmailVerificado(userId: string) {
    return DataBaseResponse.fromPromise(async () => {
      const usuario = await db.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          emailVerificado: true,
        },
      });

      return Boolean(usuario.emailVerificado);
    });
  }
}

export const userService = new UserService();
