import { describe, expect, it, vi } from "vitest";
import { encrypt, hashForLookup } from "@/lib/services/crypto/encryption-engine";
import {
  encryptionExtension,
  recifrarParaAuditoria,
} from "@/lib/services/crypto/encryption-extension";

const allOperations = encryptionExtension.query.$allModels.$allOperations;

function chamar(model: string, args: unknown, resultado: unknown = null) {
  const query = vi.fn().mockResolvedValue(resultado);

  return { promise: allOperations({ model, args, query }), query };
}

describe("encryptionExtension", () => {
  describe("models fora do escopo de PII", () => {
    // Testa passagem direta para models sem PII cifrada. Esperado: args e resultado não são tocados.
    it("não reescreve args nem decifra resultado para um model não listado", async () => {
      const args = { where: { email: "ana@example.com" } };
      const resultado = { id: "1", email: "ana@example.com" };
      const { promise, query } = chamar("AuditLog", args, resultado);

      await expect(promise).resolves.toEqual(resultado);
      expect(query).toHaveBeenCalledWith(args);
    });
  });

  describe("create/update (cifragem de data)", () => {
    // Testa normalização de email antes de cifrar/hashear. Esperado: hash é calculado sobre o valor normalizado (trim + lowercase).
    it("normaliza email (trim + lowercase) antes de cifrar e gerar emailHash", async () => {
      const { promise, query } = chamar("User", { data: { email: "  Ana@Example.com  " } });

      await promise;

      const argsRecebidos = query.mock.calls[0][0] as {
        data: { email: string; emailHash: string };
      };

      expect(argsRecebidos.data.email).toMatch(/^v1:/);
      expect(argsRecebidos.data.emailHash).toBe(hashForLookup("ana@example.com"));
    });

    // Testa data sem nenhum campo PII. Esperado: bloco data não é alterado.
    it("não altera data quando não há campos PII presentes", async () => {
      const { promise, query } = chamar("User", { data: { nome: "Ana" } });

      await promise;

      expect(query.mock.calls[0][0]).toEqual({ data: { nome: "Ana" } });
    });

    // Testa createMany (data como array). Esperado: cada item do array é cifrado individualmente.
    it("cifra cada item de um createMany (data como array)", async () => {
      const { promise, query } = chamar("User", {
        data: [{ email: "ana@example.com" }, { email: "bia@example.com" }],
      });

      await promise;

      const argsRecebidos = query.mock.calls[0][0] as { data: { emailHash: string }[] };

      expect(argsRecebidos.data[0].emailHash).toBe(hashForLookup("ana@example.com"));
      expect(argsRecebidos.data[1].emailHash).toBe(hashForLookup("bia@example.com"));
    });

    // Testa upsert (create + update em vez de data). Esperado: ambos os blocos são cifrados.
    it("cifra tanto `create` quanto `update` em um upsert", async () => {
      const { promise, query } = chamar("User", {
        create: { email: "ana@example.com" },
        update: { email: "bia@example.com" },
        where: { id: "u1" },
      });

      await promise;

      const argsRecebidos = query.mock.calls[0][0] as {
        create: { emailHash: string };
        update: { emailHash: string };
      };

      expect(argsRecebidos.create.emailHash).toBe(hashForLookup("ana@example.com"));
      expect(argsRecebidos.update.emailHash).toBe(hashForLookup("bia@example.com"));
    });
  });

  describe("where (lookup por hash)", () => {
    // Testa reescrita de where com campo único (email). Esperado: email vira emailHash, campo email original não sobra no where.
    it("reescreve where.email para where.emailHash", async () => {
      const { promise, query } = chamar("User", { where: { email: "  Ana@Example.com  " } });

      await promise;

      const argsRecebidos = query.mock.calls[0][0] as { where: Record<string, unknown> };

      expect(argsRecebidos.where).toEqual({ emailHash: hashForLookup("ana@example.com") });
    });

    // Testa where preservando outros filtros que não têm hash. Esperado: filtros extras permanecem intactos.
    it("reescreve where.email preservando outros filtros", async () => {
      const { promise, query } = chamar("User", {
        where: { isAdmin: true, email: "ana@example.com" },
      });

      await promise;

      const argsRecebidos = query.mock.calls[0][0] as { where: Record<string, unknown> };

      expect(argsRecebidos.where).toEqual({
        isAdmin: true,
        emailHash: hashForLookup("ana@example.com"),
      });
    });

    // Testa where sem nenhum campo com hash (ex: lookup só por id). Esperado: where não é alterado.
    it("não altera where quando não há campos com hash presentes", async () => {
      const { promise, query } = chamar("User", { where: { id: "u1" } });

      await promise;

      expect((query.mock.calls[0][0] as { where: unknown }).where).toEqual({ id: "u1" });
    });
  });

  describe("decifragem do resultado", () => {
    // Testa decifragem de campos PII no nível raiz do resultado. Esperado: valores voltam em texto claro.
    it("decifra campos PII no resultado", async () => {
      const { promise } = chamar(
        "User",
        { where: { id: "u1" } },
        { id: "u1", nome: "Ana", email: encrypt("ana@example.com") },
      );

      await expect(promise).resolves.toEqual({
        id: "u1",
        nome: "Ana",
        email: "ana@example.com",
      });
    });

    // Testa decifragem recursiva em relations aninhadas (include/select). Esperado: campos PII de relations também são decifrados.
    it("decifra campos PII em relations aninhadas", async () => {
      const { promise } = chamar(
        "User",
        { where: { id: "u1" } },
        {
          id: "u1",
          autor: { id: "a1", email: encrypt("bia@example.com") },
        },
      );

      await expect(promise).resolves.toEqual({
        id: "u1",
        autor: { id: "a1", email: "bia@example.com" },
      });
    });

    // Testa decifragem em arrays de resultados (findMany). Esperado: cada item da lista é decifrado.
    it("decifra campos PII em uma lista de resultados", async () => {
      const { promise } = chamar("User", { where: {} }, [
        { id: "u1", email: encrypt("ana@example.com") },
        { id: "u2", email: encrypt("bia@example.com") },
      ]);

      await expect(promise).resolves.toEqual([
        { id: "u1", email: "ana@example.com" },
        { id: "u2", email: "bia@example.com" },
      ]);
    });

    // Testa resultado nulo (ex: findUnique sem match). Esperado: retorna null sem lançar.
    it("retorna null sem lançar quando o resultado é null", async () => {
      const { promise } = chamar("User", { where: { id: "inexistente" } }, null);

      await expect(promise).resolves.toBeNull();
    });

    // Testa que um valor de texto claro (não cifrado, ex: dado legado antes da migração) não é tratado como cifrado. Esperado: retorna como está, sem lançar.
    it("mantém valores em texto claro (sem prefixo v1:) como estão", async () => {
      const { promise } = chamar(
        "User",
        { where: { id: "u1" } },
        { id: "u1", email: "ana@example.com" },
      );

      await expect(promise).resolves.toEqual({ id: "u1", email: "ana@example.com" });
    });
  });

  describe("recifrarParaAuditoria", () => {
    // Testa recifragem de um snapshot decifrado para persistir no audit log. Esperado: campos PII voltam cifrados, com hash populado.
    it("cifra novamente um snapshot decifrado de um model com PII", () => {
      const resultado = recifrarParaAuditoria("User", { id: "u1", email: "ana@example.com" }) as {
        id: string;
        email: string;
        emailHash: string;
      };

      expect(resultado.email).toMatch(/^v1:/);
      expect(resultado.emailHash).toBe(hashForLookup("ana@example.com"));
    });

    // Testa model fora do escopo de PII. Esperado: snapshot retorna inalterado.
    it("não altera snapshot de um model sem PII cifrada", () => {
      const snapshot = { id: "p1", valor: 100 };

      expect(recifrarParaAuditoria("AuditLog", snapshot)).toEqual(snapshot);
    });
  });
});
