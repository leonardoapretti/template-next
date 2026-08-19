import { createHash, randomBytes } from "node:crypto";
import type { ActionTokenTipo } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { DataBaseResponse } from "./config/database-response";

const DURACAO_PADRAO_TOKEN_MS = 60 * 60 * 1000; // 1 hora

type FormatoActionToken = "LINK" | "CODIGO_6_DIGITOS";

type CriarActionTokenParams = {
  tipo: ActionTokenTipo;
  duracaoMs?: number;
  formato?: FormatoActionToken;

  userId?: string;
  email?: string | null;

  revogarAnteriores?: boolean;
};

type ConsumirActionTokenParams = {
  token: string;
  tipo: ActionTokenTipo;
};

function gerarCodigo6Digitos() {
  const numero = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return numero.toString().padStart(6, "0");
}

function gerarToken(formato: FormatoActionToken = "LINK") {
  return formato === "CODIGO_6_DIGITOS"
    ? gerarCodigo6Digitos()
    : randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getExpiresAt(duracaoMs?: number) {
  const duracaoMsFormatada = duracaoMs ?? DURACAO_PADRAO_TOKEN_MS;
  return new Date(Date.now() + duracaoMsFormatada);
}

class ActionTokenService {
  gerarToken() {
    return gerarToken();
  }

  hashToken(token: string) {
    return hashToken(token);
  }

  criar(params: CriarActionTokenParams) {
    return DataBaseResponse.fromPromise(async () => {
      const token = gerarToken(params.formato);
      const tokenHash = hashToken(token);
      const expiresAt = getExpiresAt(params.duracaoMs);

      if (params.revogarAnteriores) {
        await db.actionToken.updateMany({
          where: {
            tipo: params.tipo,
            usedAt: null,
            revokedAt: null,
            ...(params.userId ? { userId: params.userId } : {}),
            ...(params.email ? { email: params.email.toLowerCase() } : {}),
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }

      const actionToken = await db.actionToken.create({
        data: {
          tipo: params.tipo,
          tokenHash,
          expiresAt,
          userId: params.userId,
          email: params.email?.toLowerCase() ?? null,
        },
      });

      return {
        token,
        tokenHash,
        actionTokenId: actionToken.id,
        expiresAt,
      };
    });
  }

  buscarValido(params: ConsumirActionTokenParams) {
    return db.actionToken.findFirst({
      where: {
        tipo: params.tipo,
        tokenHash: hashToken(params.token),
        usedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  consumir(params: ConsumirActionTokenParams) {
    return DataBaseResponse.fromPromise(async () => {
      const actionToken = await this.buscarValido(params);

      if (!actionToken) {
        throw new Error("Token inválido ou expirado.");
      }

      await db.actionToken.update({
        where: {
          id: actionToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      });

      return actionToken;
    });
  }

  revogarPorId(id: string) {
    return DataBaseResponse.fromPromise(async () => {
      await db.actionToken.update({
        where: {
          id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  }

  revogarPendentes(params: { tipo: ActionTokenTipo; userId?: string; email?: string | null }) {
    return DataBaseResponse.fromPromise(async () => {
      await db.actionToken.updateMany({
        where: {
          tipo: params.tipo,
          usedAt: null,
          revokedAt: null,
          ...(params.userId ? { userId: params.userId } : {}),
          ...(params.email ? { email: params.email.toLowerCase() } : {}),
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  }
}

export const actionTokenService = new ActionTokenService();
