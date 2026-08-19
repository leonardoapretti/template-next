import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { auditLogService } from "@/lib/services/audit-log.service";
import { userService } from "@/lib/services/user.service";
import { verificarRateLimit } from "@/lib/utils/rate-limit";
import { getDadosAuditoriaAssinatura } from "@/lib/utils/request";
import { EmailNaoVerificadoError, RateLimitExcedidoError } from "./auth-errors";

const SESSION_MAX_AGE_SECONDS = 7200; // 2 horas
const SESSION_UPDATE_AGE_SECONDS = 5 * 60; // tenta renovar a cada 5 minutos

// Limite de tentativas de login por IP+e-mail, para dificultar força bruta
// de senha. Ver lib/utils/rate-limit.ts para as limitações (em memória, por
// processo).
const LOGIN_LIMITE_TENTATIVAS = 5;
const LOGIN_JANELA_MS = 15 * 60 * 1000; // 15 minutos

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const { ip, userAgent } = getDadosAuditoriaAssinatura(await headers());
        const emailTentado = typeof credentials?.email === "string" ? credentials.email : null;

        const registrarFalha = () =>
          auditLogService.registrar(
            {
              usuarioEmail: emailTentado,
              acao: "LOGIN_FAILED",
              ip,
              userAgent,
            },
            db,
          );

        if (!credentials?.email || !credentials?.password) {
          await registrarFalha();
          return null;
        }

        const rateLimit = verificarRateLimit(
          `login:${ip}:${(credentials.email as string).trim().toLowerCase()}`,
          LOGIN_LIMITE_TENTATIVAS,
          LOGIN_JANELA_MS,
        );

        if (!rateLimit.permitido) {
          await registrarFalha();
          throw new RateLimitExcedidoError();
        }

        const user = await userService.recuperarUsuarioLogin(credentials.email as string);

        if (!user?.senha) {
          await registrarFalha();
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password as string, user.senha);

        if (!passwordMatch) {
          await registrarFalha();
          return null;
        }

        if (!user.emailVerificado) {
          await registrarFalha();
          throw new EmailNaoVerificadoError();
        }

        await auditLogService.registrar(
          {
            usuarioId: user.id,
            usuarioEmail: user.email,
            usuarioNome: user.nome,
            acao: "LOGIN_SUCCESS",
            ip,
            userAgent,
          },
          db,
        );

        return {
          id: user.id,
          name: user.nome,
          nome: user.nome,
          email: user.email,
          image: user.imagem,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nome = user.nome;
        token.email = user.email;
        token.picture = user.image;
        token.isAdmin = user.isAdmin;
      }

      if (!user && token.id) {
        const usuarioAtual = await db.user.findUnique({
          where: {
            id: token.id as string,
          },
          select: {
            isAdmin: true,
          },
        });

        if (usuarioAtual) {
          token.isAdmin = usuarioAtual.isAdmin;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.nome = token.nome as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
});
