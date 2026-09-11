import { describe, expect, it } from "vitest";
import { aplicarDependenciasDeLeitura, permissionKeysExcludingKind } from "@/lib/access-control/permission-registry";

describe("aplicarDependenciasDeLeitura", () => {
  it("libera a leitura automaticamente quando uma escrita esta liberada", () => {
    const resultado = aplicarDependenciasDeLeitura({ "agenda:create": true });

    expect(resultado["agenda:read"]).toBe(true);
    expect(resultado["agenda:create"]).toBe(true);
  });

  it("nao mexe na leitura quando nenhuma escrita esta liberada", () => {
    const resultado = aplicarDependenciasDeLeitura({ "agenda:read": false });

    expect(resultado["agenda:read"]).toBe(false);
  });

  it("nao afeta recursos sem operacao de leitura no catalogo", () => {
    const resultado = aplicarDependenciasDeLeitura({ "empresa:configurar": true });

    expect(resultado["empresa:configurar"]).toBe(true);
  });
});

describe("permissionKeysExcludingKind", () => {
  it("exclui apenas as chaves do kind informado", () => {
    const semExclusao = permissionKeysExcludingKind("delete");

    expect(semExclusao).not.toContain("agenda:delete");
    expect(semExclusao).toContain("agenda:create");
    expect(semExclusao).toContain("agenda:read");
  });
});
