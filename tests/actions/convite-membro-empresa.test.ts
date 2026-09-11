import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/lib/access-control/errors";

const assertCurrentUserCanMock = vi.fn();
const authMock = vi.fn();
const criarConviteEEnviarMock = vi.fn();
const aceitarConviteMock = vi.fn();
const cookiesSetMock = vi.fn();

vi.mock("@/lib/access-control", () => ({
  assertCurrentUserCan: assertCurrentUserCanMock,
}));

vi.mock("@/lib/access-control/context", () => ({
  EMPRESA_ATIVA_COOKIE: "empresa_ativa_id",
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/services/empresa.service", () => ({
  empresaService: {
    criarConviteEEnviar: criarConviteEEnviarMock,
    aceitarConvite: aceitarConviteMock,
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookiesSetMock }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("convidarMembroAction", () => {
  it("nao chama o guard nem o service com dados invalidos", async () => {
    const { convidarMembroAction } = await import(
      "@/app/dashboard/empresa/membros/_components/actions"
    );

    const result = await convidarMembroAction({ email: "invalido", roleId: "" });

    expect(result.success).toBe(false);
    expect(assertCurrentUserCanMock).not.toHaveBeenCalled();
    expect(criarConviteEEnviarMock).not.toHaveBeenCalled();
  });

  it("bloqueia quando o usuario nao tem a permissao empresa:convidar, sem chamar o service", async () => {
    assertCurrentUserCanMock.mockRejectedValue(
      new AccessDeniedError('Você não tem permissão para "empresa:convidar".'),
    );

    const { convidarMembroAction } = await import(
      "@/app/dashboard/empresa/membros/_components/actions"
    );

    await expect(
      convidarMembroAction({ email: "novo@email.com", roleId: "role-1" }),
    ).rejects.toThrow(AccessDeniedError);

    expect(criarConviteEEnviarMock).not.toHaveBeenCalled();
  });

  it("cria o convite escopado a empresa ativa quando autorizado", async () => {
    assertCurrentUserCanMock.mockResolvedValue({
      usuarioId: "user-1",
      isAdmin: false,
      membroEmpresa: { empresaId: "empresa-1", roleId: "role-admin", roleNome: "Administrador" },
    });
    authMock.mockResolvedValue({ user: { nome: "Maria" } });
    criarConviteEEnviarMock.mockResolvedValue({
      success: true,
      serialize: () => ({ success: true, data: { enviado: true } }),
    });

    const { convidarMembroAction } = await import(
      "@/app/dashboard/empresa/membros/_components/actions"
    );

    await convidarMembroAction({ email: "novo@email.com", roleId: "role-1" });

    expect(criarConviteEEnviarMock).toHaveBeenCalledWith({
      empresaId: "empresa-1",
      roleId: "role-1",
      email: "novo@email.com",
      convidadoPorNome: "Maria",
    });
  });
});

describe("aceitarConviteAction", () => {
  it("nao chama o service sem sessao autenticada", async () => {
    authMock.mockResolvedValue(null);

    const { aceitarConviteAction } = await import(
      "@/app/dashboard/empresas/convite/[token]/_components/actions"
    );

    const result = await aceitarConviteAction("token-1");

    expect(result.success).toBe(false);
    expect(aceitarConviteMock).not.toHaveBeenCalled();
    expect(cookiesSetMock).not.toHaveBeenCalled();
  });

  it("aceita o convite e seta o cookie de empresa ativa quando ha sessao", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", email: "ana@email.com" } });
    aceitarConviteMock.mockResolvedValue({
      success: true,
      isSuccess: () => true,
      data: { empresaId: "empresa-1" },
      serialize: () => ({ success: true, data: { empresaId: "empresa-1" } }),
    });

    const { aceitarConviteAction } = await import(
      "@/app/dashboard/empresas/convite/[token]/_components/actions"
    );

    await aceitarConviteAction("token-1");

    expect(aceitarConviteMock).toHaveBeenCalledWith(
      { id: "user-1", email: "ana@email.com" },
      "token-1",
    );
    expect(cookiesSetMock).toHaveBeenCalledWith("empresa_ativa_id", "empresa-1", expect.any(Object));
  });
});
