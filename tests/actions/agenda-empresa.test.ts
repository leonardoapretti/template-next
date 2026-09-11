import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmpresaRequiredError } from "@/lib/access-control/errors";

const assertCurrentUserCanMock = vi.fn();
const getAccessContextMock = vi.fn();
const buscarEventosNaJanelaMock = vi.fn();
const criarEventoMock = vi.fn();
const atualizarEventoMock = vi.fn();
const excluirEventoMock = vi.fn();
const listarConflitosNoHorarioMock = vi.fn();

vi.mock("@/lib/access-control", () => ({
  assertCurrentUserCan: assertCurrentUserCanMock,
  getAccessContext: getAccessContextMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/services/agendamento.service", () => ({
  agendamentoService: {
    buscarEventosNaJanela: buscarEventosNaJanelaMock,
    criarEvento: criarEventoMock,
    atualizarEvento: atualizarEventoMock,
    excluirEvento: excluirEventoMock,
    listarConflitosNoHorario: listarConflitosNoHorarioMock,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  listarConflitosNoHorarioMock.mockResolvedValue([]);
});

const eventoValido = {
  titulo: "Reunião extra",
  data: "2026-03-02",
  dataFim: "2026-03-02",
  diaTodo: false,
  horaInicio: "18:00",
  horaFim: "19:00",
  recorrencia: "NENHUMA" as const,
};

describe("getEventosNaJanela", () => {
  it("lanca EmpresaRequiredError e nao consulta eventos sem empresa ativa", async () => {
    getAccessContextMock.mockResolvedValue({ usuarioId: "user-1", isAdmin: false, membroEmpresa: null });

    const { getEventosNaJanela } = await import(
      "@/app/agenda/_components/engine/agendamento.queries"
    );

    await expect(getEventosNaJanela({ inicio: "2026-03-01", fim: "2026-03-31" })).rejects.toThrow(
      EmpresaRequiredError,
    );
    expect(buscarEventosNaJanelaMock).not.toHaveBeenCalled();
  });

  it("busca eventos escopados a empresa ativa", async () => {
    getAccessContextMock.mockResolvedValue({
      usuarioId: "user-1",
      isAdmin: false,
      membroEmpresa: { empresaId: "empresa-1", roleId: "role-1", roleNome: "Administrador" },
    });
    buscarEventosNaJanelaMock.mockResolvedValue([]);

    const { getEventosNaJanela } = await import(
      "@/app/agenda/_components/engine/agendamento.queries"
    );

    await getEventosNaJanela({ inicio: "2026-03-01", fim: "2026-03-31" });

    expect(buscarEventosNaJanelaMock).toHaveBeenCalledWith("empresa-1", {
      inicio: "2026-03-01",
      fim: "2026-03-31",
    });
  });
});

describe("criarEventoAction", () => {
  it("lanca EmpresaRequiredError sem empresa ativa, mesmo com a permissao concedida", async () => {
    assertCurrentUserCanMock.mockResolvedValue({
      usuarioId: "user-admin",
      isAdmin: true,
      membroEmpresa: null,
    });

    const { criarEventoAction } = await import(
      "@/app/agenda/_components/engine/agendamento.actions"
    );

    await expect(criarEventoAction(eventoValido)).rejects.toThrow(EmpresaRequiredError);
    expect(criarEventoMock).not.toHaveBeenCalled();
  });

  it("cria o evento escopado a empresa ativa", async () => {
    assertCurrentUserCanMock.mockResolvedValue({
      usuarioId: "user-1",
      isAdmin: false,
      membroEmpresa: { empresaId: "empresa-1", roleId: "role-1", roleNome: "Administrador" },
    });
    criarEventoMock.mockResolvedValue({ id: "evento-1" });

    const { criarEventoAction } = await import(
      "@/app/agenda/_components/engine/agendamento.actions"
    );

    const result = await criarEventoAction(eventoValido);

    expect(listarConflitosNoHorarioMock).toHaveBeenCalledWith(
      "empresa-1",
      expect.objectContaining({ titulo: "Reunião extra" }),
    );
    expect(criarEventoMock).toHaveBeenCalledWith(
      "empresa-1",
      expect.objectContaining({ titulo: "Reunião extra" }),
    );
    expect(result.success).toBe(true);
  });
});
