import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/lib/access-control/errors";

const assertCurrentUserCanMock = vi.fn();
const authMock = vi.fn();
const criarConviteEEnviarMock = vi.fn();
const aceitarConviteMock = vi.fn();
const revogarConviteMock = vi.fn();
const reenviarConviteMock = vi.fn();
const cookiesSetMock = vi.fn();
const revalidatePathMock = vi.fn();

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
    revogarConvite: revogarConviteMock,
    reenviarConvite: reenviarConviteMock,
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookiesSetMock }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
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
      isSuccess: () => true,
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
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/empresa/membros");
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

describe("revogarConviteAction", () => {
  it("bloqueia quando o usuario nao tem a permissao empresa:convidar, sem chamar o service", async () => {
    assertCurrentUserCanMock.mockRejectedValue(
      new AccessDeniedError('Você não tem permissão para "empresa:convidar".'),
    );

    const { revogarConviteAction } = await import(
      "@/app/dashboard/empresa/membros/_components/actions"
    );

    await expect(revogarConviteAction({ actionTokenId: "token-1" })).rejects.toThrow(
      AccessDeniedError,
    );

    expect(revogarConviteMock).not.toHaveBeenCalled();
  });

  it("revoga o convite escopado a empresa ativa quando autorizado", async () => {
    assertCurrentUserCanMock.mockResolvedValue({
      usuarioId: "user-1",
      isAdmin: false,
      membroEmpresa: { empresaId: "empresa-1", roleId: "role-admin", roleNome: "Administrador" },
    });
    revogarConviteMock.mockResolvedValue({
      success: true,
      isSuccess: () => true,
      serialize: () => ({ success: true, data: null }),
    });

    const { revogarConviteAction } = await import(
      "@/app/dashboard/empresa/membros/_components/actions"
    );

    await revogarConviteAction({ actionTokenId: "token-1" });

    expect(revogarConviteMock).toHaveBeenCalledWith("empresa-1", "token-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/empresa/membros");
  });
});

describe("reenviarConviteAction", () => {
  it("bloqueia quando o usuario nao tem a permissao empresa:convidar, sem chamar o service", async () => {
    assertCurrentUserCanMock.mockRejectedValue(
      new AccessDeniedError('Você não tem permissão para "empresa:convidar".'),
    );

    const { reenviarConviteAction } = await import(
      "@/app/dashboard/empresa/membros/_components/actions"
    );

    await expect(reenviarConviteAction({ actionTokenId: "token-1" })).rejects.toThrow(
      AccessDeniedError,
    );

    expect(reenviarConviteMock).not.toHaveBeenCalled();
  });

  it("reenvia o convite escopado a empresa ativa quando autorizado", async () => {
    assertCurrentUserCanMock.mockResolvedValue({
      usuarioId: "user-1",
      isAdmin: false,
      membroEmpresa: { empresaId: "empresa-1", roleId: "role-admin", roleNome: "Administrador" },
    });
    authMock.mockResolvedValue({ user: { nome: "Maria" } });
    reenviarConviteMock.mockResolvedValue({
      success: true,
      isSuccess: () => true,
      serialize: () => ({ success: true, data: { enviado: true } }),
    });

    const { reenviarConviteAction } = await import(
      "@/app/dashboard/empresa/membros/_components/actions"
    );

    await reenviarConviteAction({ actionTokenId: "token-1" });

    expect(reenviarConviteMock).toHaveBeenCalledWith("empresa-1", "token-1", "Maria");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/empresa/membros");
  });
});
