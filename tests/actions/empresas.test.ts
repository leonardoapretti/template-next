import { beforeEach, describe, expect, it, vi } from "vitest";

const getAccessContextMock = vi.fn();
const criarEmpresaMock = vi.fn();
const possuiVinculoAtivoMock = vi.fn();
const cookiesSetMock = vi.fn();
const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/lib/access-control", () => ({
  getAccessContext: getAccessContextMock,
}));

vi.mock("@/lib/access-control/context", () => ({
  EMPRESA_ATIVA_COOKIE: "empresa_ativa_id",
}));

vi.mock("@/lib/services/empresa.service", () => ({
  empresaService: {
    criarEmpresa: criarEmpresaMock,
    possuiVinculoAtivo: possuiVinculoAtivoMock,
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookiesSetMock }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("criarEmpresaAction", () => {
  it("nao chama o service nem monta contexto com nome invalido", async () => {
    const { criarEmpresaAction } = await import(
      "@/app/dashboard/empresas/novo/_components/actions"
    );

    const result = await criarEmpresaAction({ nome: "a" });

    expect(result.success).toBe(false);
    expect(getAccessContextMock).not.toHaveBeenCalled();
    expect(criarEmpresaMock).not.toHaveBeenCalled();
  });

  it("cria a empresa e seta o cookie de empresa ativa quando os dados sao validos", async () => {
    getAccessContextMock.mockResolvedValue({ usuarioId: "user-1" });
    criarEmpresaMock.mockResolvedValue({
      success: true,
      isSuccess: () => true,
      isError: () => false,
      data: { id: "empresa-1", nome: "Empresa Alfa" },
      serialize: () => ({ success: true, data: { id: "empresa-1" } }),
    });

    const { criarEmpresaAction } = await import(
      "@/app/dashboard/empresas/novo/_components/actions"
    );

    const result = await criarEmpresaAction({ nome: "Empresa Alfa" });

    expect(criarEmpresaMock).toHaveBeenCalledWith("user-1", { nome: "Empresa Alfa" });
    expect(cookiesSetMock).toHaveBeenCalledWith(
      "empresa_ativa_id",
      "empresa-1",
      expect.any(Object),
    );
    expect(result.success).toBe(true);
  });
});

describe("selecionarEmpresaAtivaAction", () => {
  it("nao seta o cookie e retorna erro quando o usuario nao tem vinculo ativo com a empresa", async () => {
    getAccessContextMock.mockResolvedValue({ usuarioId: "user-1" });
    possuiVinculoAtivoMock.mockResolvedValue(false);

    const { selecionarEmpresaAtivaAction } = await import("@/components/sidebar/actions");

    const result = await selecionarEmpresaAtivaAction("empresa-de-outro-usuario");

    expect(possuiVinculoAtivoMock).toHaveBeenCalledWith("user-1", "empresa-de-outro-usuario");
    expect(cookiesSetMock).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it("seta o cookie e revalida o layout quando o usuario tem vinculo ativo com a empresa", async () => {
    getAccessContextMock.mockResolvedValue({ usuarioId: "user-1" });
    possuiVinculoAtivoMock.mockResolvedValue(true);

    const { selecionarEmpresaAtivaAction } = await import("@/components/sidebar/actions");

    const result = await selecionarEmpresaAtivaAction("empresa-1");

    expect(cookiesSetMock).toHaveBeenCalledWith("empresa_ativa_id", "empresa-1", expect.any(Object));
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(result.success).toBe(true);
  });
});
