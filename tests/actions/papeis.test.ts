import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/lib/access-control/errors";

const assertCurrentUserCanMock = vi.fn();
const criarPapelMock = vi.fn();
const atualizarPermissoesMock = vi.fn();
const renomearMock = vi.fn();
const removerPapelMock = vi.fn();
const recuperarComPermissoesMock = vi.fn();

vi.mock("@/lib/access-control", () => ({
  assertCurrentUserCan: assertCurrentUserCanMock,
}));

vi.mock("@/lib/services/role.service", () => ({
  roleService: {
    criarPapel: criarPapelMock,
    atualizarPermissoes: atualizarPermissoesMock,
    renomear: renomearMock,
    removerPapel: removerPapelMock,
    recuperarComPermissoes: recuperarComPermissoesMock,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("criarPapelAction", () => {
  it("nao chama o guard nem o service com dados invalidos", async () => {
    const { criarPapelAction } = await import(
      "@/app/dashboard/empresa/papeis/_components/actions"
    );

    const result = await criarPapelAction({ nome: "a" });

    expect(result.success).toBe(false);
    expect(assertCurrentUserCanMock).not.toHaveBeenCalled();
    expect(criarPapelMock).not.toHaveBeenCalled();
  });

  it("bloqueia sem a permissao papeis:gerenciar, sem chamar o service", async () => {
    assertCurrentUserCanMock.mockRejectedValue(
      new AccessDeniedError('Você não tem permissão para "papeis:gerenciar".'),
    );

    const { criarPapelAction } = await import(
      "@/app/dashboard/empresa/papeis/_components/actions"
    );

    await expect(criarPapelAction({ nome: "Recepção" })).rejects.toThrow(AccessDeniedError);
    expect(criarPapelMock).not.toHaveBeenCalled();
  });

  it("cria o papel sem permissoes iniciais quando nao ha copiarDeId", async () => {
    assertCurrentUserCanMock.mockResolvedValue({
      usuarioId: "user-1",
      isAdmin: false,
      membroEmpresa: { empresaId: "empresa-1", roleId: "role-1", roleNome: "Administrador" },
    });
    criarPapelMock.mockResolvedValue({
      success: true,
      isSuccess: () => true,
      serialize: () => ({ success: true, data: {} }),
    });

    const { criarPapelAction } = await import(
      "@/app/dashboard/empresa/papeis/_components/actions"
    );

    await criarPapelAction({ nome: "Recepção" });

    expect(recuperarComPermissoesMock).not.toHaveBeenCalled();
    expect(criarPapelMock).toHaveBeenCalledWith("empresa-1", "Recepção", []);
  });

  it("copia as permissoes do papel de origem quando copiarDeId e informado", async () => {
    assertCurrentUserCanMock.mockResolvedValue({
      usuarioId: "user-1",
      isAdmin: false,
      membroEmpresa: { empresaId: "empresa-1", roleId: "role-1", roleNome: "Administrador" },
    });
    recuperarComPermissoesMock.mockResolvedValue({
      isError: () => false,
      isSuccess: () => true,
      data: { permissoes: ["agenda:read", "agenda:create"] },
    });
    criarPapelMock.mockResolvedValue({
      success: true,
      isSuccess: () => true,
      serialize: () => ({ success: true, data: {} }),
    });

    const { criarPapelAction } = await import(
      "@/app/dashboard/empresa/papeis/_components/actions"
    );

    await criarPapelAction({ nome: "Recepção", copiarDeId: "role-origem" });

    expect(recuperarComPermissoesMock).toHaveBeenCalledWith("role-origem");
    expect(criarPapelMock).toHaveBeenCalledWith("empresa-1", "Recepção", [
      "agenda:read",
      "agenda:create",
    ]);
  });
});

describe("renomearPapelAction", () => {
  it("bloqueia sem a permissao papeis:gerenciar, sem chamar o service", async () => {
    assertCurrentUserCanMock.mockRejectedValue(
      new AccessDeniedError('Você não tem permissão para "papeis:gerenciar".'),
    );

    const { renomearPapelAction } = await import(
      "@/app/dashboard/empresa/papeis/_components/actions"
    );

    await expect(renomearPapelAction({ id: "role-1", nome: "Novo nome" })).rejects.toThrow(
      AccessDeniedError,
    );
    expect(renomearMock).not.toHaveBeenCalled();
  });
});

describe("removerPapelAction", () => {
  it("bloqueia sem a permissao papeis:gerenciar, sem chamar o service", async () => {
    assertCurrentUserCanMock.mockRejectedValue(
      new AccessDeniedError('Você não tem permissão para "papeis:gerenciar".'),
    );

    const { removerPapelAction } = await import(
      "@/app/dashboard/empresa/papeis/_components/actions"
    );

    await expect(removerPapelAction({ id: "role-1" })).rejects.toThrow(AccessDeniedError);
    expect(removerPapelMock).not.toHaveBeenCalled();
  });
});

describe("atualizarPermissoesPapelAction", () => {
  it("bloqueia sem a permissao papeis:gerenciar, sem chamar o service", async () => {
    assertCurrentUserCanMock.mockRejectedValue(
      new AccessDeniedError('Você não tem permissão para "papeis:gerenciar".'),
    );

    const { atualizarPermissoesPapelAction } = await import(
      "@/app/dashboard/empresa/papeis/_components/actions"
    );

    await expect(
      atualizarPermissoesPapelAction({ id: "role-1", permissoes: { "agenda:create": true } }),
    ).rejects.toThrow(AccessDeniedError);
    expect(atualizarPermissoesMock).not.toHaveBeenCalled();
  });
});
