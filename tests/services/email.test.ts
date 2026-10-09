import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn() } } }));

vi.mock("@/lib/email/resend", () => ({
  resend: { emails: { send: sendMock } },
  resendConfig: { from: "Template <teste@exemplo.com>", destinatarioDev: undefined },
}));

vi.mock("@/lib/access-control/current-user", () => ({
  getUsuarioAtualId: vi.fn().mockRejectedValue(new Error("sem sessão")),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("emailService.enviarEmail", () => {
  it("bloqueia qualquer envio e nunca chama o provedor", async () => {
    const { emailService } = await import("@/lib/services/email.service");

    const response = await emailService.enviarEmail({
      destinatario: "usuario@exemplo.com",
      assunto: "Teste",
      texto: "Olá",
    });

    expect(response.isError()).toBe(true);
    expect(response.getErrorCode()).toBe("EMAIL_DISABLED");
    expect(sendMock).not.toHaveBeenCalled();
  });
});
