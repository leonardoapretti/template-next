import { describe, expect, it } from "vitest";
import { verificarRateLimit } from "@/lib/utils/rate-limit";

describe("verificarRateLimit", () => {
  it("permite tentativas dentro do limite", () => {
    const chave = `teste:${crypto.randomUUID()}`;

    for (let i = 0; i < 3; i++) {
      const resultado = verificarRateLimit(chave, 3, 60_000);
      expect(resultado.permitido).toBe(true);
    }
  });

  it("bloqueia após exceder o limite", () => {
    const chave = `teste:${crypto.randomUUID()}`;

    verificarRateLimit(chave, 2, 60_000);
    verificarRateLimit(chave, 2, 60_000);
    const resultado = verificarRateLimit(chave, 2, 60_000);

    expect(resultado.permitido).toBe(false);
  });

  it("mantém contadores independentes por chave", () => {
    const chaveA = `teste-a:${crypto.randomUUID()}`;
    const chaveB = `teste-b:${crypto.randomUUID()}`;

    verificarRateLimit(chaveA, 1, 60_000);
    const resultadoA = verificarRateLimit(chaveA, 1, 60_000);
    const resultadoB = verificarRateLimit(chaveB, 1, 60_000);

    expect(resultadoA.permitido).toBe(false);
    expect(resultadoB.permitido).toBe(true);
  });

  it("reinicia a contagem após a janela expirar", async () => {
    const chave = `teste:${crypto.randomUUID()}`;

    verificarRateLimit(chave, 1, 10);
    const bloqueado = verificarRateLimit(chave, 1, 10);
    expect(bloqueado.permitido).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 20));

    const resultado = verificarRateLimit(chave, 1, 10);
    expect(resultado.permitido).toBe(true);
  });

  it("calcula a quantidade restante corretamente", () => {
    const chave = `teste:${crypto.randomUUID()}`;

    const primeira = verificarRateLimit(chave, 3, 60_000);
    expect(primeira.restante).toBe(2);

    const segunda = verificarRateLimit(chave, 3, 60_000);
    expect(segunda.restante).toBe(1);
  });
});
