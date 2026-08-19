import { describe, expect, it } from "vitest";
import { decrypt, encrypt, hashForLookup } from "@/lib/services/crypto/encryption-engine";

describe("encryption-engine", () => {
  describe("encrypt/decrypt", () => {
    // Testa o ciclo completo cifrar->decifrar. Esperado: valor decifrado é idêntico ao original.
    it("decifra de volta para o texto original", () => {
      const original = "15725360717";

      expect(decrypt(encrypt(original))).toBe(original);
    });

    // Testa o prefixo de versão do formato cifrado. Esperado: valor sempre começa com "v1:".
    it("gera valor cifrado com prefixo de versão v1:", () => {
      expect(encrypt("qualquer valor")).toMatch(/^v1:/);
    });

    // Testa que o IV aleatório evita cifrados repetidos. Esperado: dois cifrados do mesmo texto claro são diferentes.
    it("gera cifrados diferentes para o mesmo texto claro (IV aleatório)", () => {
      const a = encrypt("mesmo-valor");
      const b = encrypt("mesmo-valor");

      expect(a).not.toBe(b);
      expect(decrypt(a)).toBe("mesmo-valor");
      expect(decrypt(b)).toBe("mesmo-valor");
    });

    // Testa string vazia como caso de borda. Esperado: cifra e decifra sem erro.
    it("cifra e decifra string vazia", () => {
      expect(decrypt(encrypt(""))).toBe("");
    });

    // Testa caracteres multibyte (acentos, emoji). Esperado: preserva UTF-8 corretamente.
    it("preserva caracteres UTF-8 (acentos, emoji)", () => {
      const original = "Endereço: Rua José Ñañez, 123 🏠";

      expect(decrypt(encrypt(original))).toBe(original);
    });

    // Testa detecção de adulteração pelo authTag do GCM. Esperado: lança ao decifrar payload alterado.
    it("lança ao decifrar um valor cifrado adulterado", () => {
      const cifrado = encrypt("valor sensível");
      const [versao, payload] = cifrado.split(":");
      const bytes = Buffer.from(payload, "base64");
      bytes[bytes.length - 1] ^= 0xff;
      const adulterado = `${versao}:${bytes.toString("base64")}`;

      expect(() => decrypt(adulterado)).toThrow();
    });

    // Testa formato/versão desconhecidos. Esperado: lança erro descritivo em vez de decifrar silenciosamente.
    it("lança ao decifrar valor com prefixo de versão desconhecido", () => {
      expect(() => decrypt("v2:qualquercoisa")).toThrow(/versão/i);
    });

    // Testa valor sem o separador ":". Esperado: lança em vez de tratar como cifrado válido.
    it("lança ao decifrar valor sem o formato esperado", () => {
      expect(() => decrypt("texto-claro-sem-prefixo")).toThrow();
    });
  });

  describe("hashForLookup", () => {
    // Testa determinismo do HMAC. Esperado: mesmo texto claro sempre gera o mesmo hash.
    it("gera o mesmo hash para o mesmo texto claro em chamadas diferentes", () => {
      expect(hashForLookup("15725360717")).toBe(hashForLookup("15725360717"));
    });

    // Testa sensibilidade do HMAC a qualquer diferença no texto claro. Esperado: hashes diferentes.
    it("gera hashes diferentes para textos claros diferentes", () => {
      expect(hashForLookup("15725360717")).not.toBe(hashForLookup("15725360718"));
    });

    // Testa que o hash não vaza o valor original. Esperado: hash não contém o texto claro nem é reversível por inspeção.
    it("não expõe o texto claro no hash gerado", () => {
      const original = "leonardoapretti@gmail.com";

      expect(hashForLookup(original)).not.toContain(original);
    });
  });
});
