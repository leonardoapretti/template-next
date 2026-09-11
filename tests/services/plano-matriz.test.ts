import { beforeEach, describe, expect, it, vi } from "vitest";
import { permissionKeys } from "@/lib/access-control/permission-registry";

const findManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    planoPermissao: { findMany: findManyMock },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("planoService.buscarMatriz", () => {
  it("retorna tudo liberado quando a empresa nao tem plano vinculado (planoId null)", async () => {
    const { planoService } = await import("@/lib/services/plano.service");

    const matriz = await planoService.buscarMatriz(null);

    expect(findManyMock).not.toHaveBeenCalled();
    for (const chave of permissionKeys) {
      expect(matriz[chave]).toBe(true);
    }
  });

  it("preenche false para chaves sem linha na matriz do plano", async () => {
    findManyMock.mockResolvedValue([{ chave: "agenda:create", permitido: true }]);

    const { planoService } = await import("@/lib/services/plano.service");

    const matriz = await planoService.buscarMatriz("plano-1");

    expect(matriz["agenda:create"]).toBe(true);
    expect(matriz["agenda:delete"]).toBe(false);
  });
});
