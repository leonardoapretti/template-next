import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/logger/src", () => ({ default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/services/audit-log-autor", () => ({
  autorDaRequisicao: vi.fn(async () => ({
    usuarioId: "u1",
    usuarioEmail: "u@x.com",
    usuarioNome: "U",
    ip: "1.1.1.1",
    userAgent: "ua",
  })),
}));
vi.mock("@/lib/services/crypto/encryption-extension", () => ({
  recifrarParaAuditoria: (_model: string, snapshot: unknown) => snapshot,
}));

import { auditLogService } from "@/lib/services/audit-log.service";
import { snapshotsParaAuditoria } from "@/lib/services/audit-log-extension";

type Linha = Record<string, unknown>;

function clienteFake() {
  const linhas: Linha[] = [];
  const tx = {
    $executeRaw: vi.fn(async () => 1),
    $queryRaw: vi.fn(async () => (linhas.length ? [linhas[linhas.length - 1]] : [])),
    auditLog: {
      create: vi.fn(async ({ data }: { data: Linha }) => {
        linhas.push({ id: `id${linhas.length}`, ...data });
      }),
    },
  };

  return { tx, linhas };
}

describe("auditLogService.registrar", () => {
  it("grava sob a trava da cadeia, completa o autor e encadeia o hash", async () => {
    const { tx, linhas } = clienteFake();

    await auditLogService.registrar({ acao: "A" }, tx as never);
    await auditLogService.registrar({ acao: "B", usuarioEmail: "outro@x.com" }, tx as never);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(linhas[0]).toMatchObject({ usuarioId: "u1", ip: "1.1.1.1", hashAnterior: null });
    expect(linhas[1]).toMatchObject({ usuarioEmail: "outro@x.com", usuarioId: null });
    expect(linhas[1].hashAnterior).toBe(linhas[0].hash);
    expect((linhas[1].createdAt as Date).getTime()).toBeGreaterThan(
      (linhas[0].createdAt as Date).getTime(),
    );
  });
});

describe("snapshotsParaAuditoria", () => {
  it("tira a senha e registra só que ela mudou", () => {
    const { dadosAntes, dadosDepois } = snapshotsParaAuditoria(
      "User",
      { id: "1", senha: "hash-antigo" },
      { id: "1", senha: "hash-novo" },
    );

    expect(dadosAntes).toEqual({ id: "1" });
    expect(dadosDepois).toEqual({ id: "1", segredosAlterados: ["senha"] });
  });
});
