import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Toda requisição HTTP da aplicação passa pelo adapter (lib/api-adapter): `apiClient`
// no servidor e `apiBrowserClient` no navegador. Chamar `fetch` direto perde o log, o padrão de erro e os
// cabeçalhos. Ver a skill `api-adapter`.
const PASTAS = ["app", "components", "hooks", "lib"];
const IGNORADOS = ["lib/api-adapter", "lib/fumadocs/content", "node_modules", ".next"];
const EXTENSOES = [".ts", ".tsx"];

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);

    if (IGNORADOS.some((ignorado) => caminho.replaceAll("\\", "/").startsWith(ignorado))) return [];

    return statSync(caminho).isDirectory()
      ? arquivos(caminho)
      : EXTENSOES.some((extensao) => caminho.endsWith(extensao))
        ? [caminho]
        : [];
  });
}

describe("requisições HTTP", () => {
  it("ninguém chama fetch direto: tudo passa pelo adapter", () => {
    const infratores = PASTAS.flatMap(arquivos).filter((arquivo) =>
      /(^|[^.\w])fetch\(/.test(readFileSync(arquivo, "utf8")),
    );

    expect(infratores).toEqual([]);
  });
});
