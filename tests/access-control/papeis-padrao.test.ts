import { describe, expect, it } from "vitest";
import { permissionKeys } from "@/lib/access-control/permission-registry";
import {
  NOME_ROLE_ADMINISTRADOR,
  NOME_ROLE_PROFISSIONAL,
  NOME_ROLE_PROPRIETARIO,
  NOME_ROLE_SECRETARIO,
  papeisPadraoDoSistema,
} from "@/lib/access-control/policy";

describe("papeisPadraoDoSistema", () => {
  const papeis = papeisPadraoDoSistema();

  it("semeia exatamente os 4 papeis padrao do sistema", () => {
    expect(papeis.map((papel) => papel.nome)).toEqual([
      NOME_ROLE_PROPRIETARIO,
      NOME_ROLE_ADMINISTRADOR,
      NOME_ROLE_SECRETARIO,
      NOME_ROLE_PROFISSIONAL,
    ]);
  });

  it("Proprietario e Administrador nascem com todas as permissoes", () => {
    const proprietario = papeis.find((papel) => papel.nome === NOME_ROLE_PROPRIETARIO);
    const administrador = papeis.find((papel) => papel.nome === NOME_ROLE_ADMINISTRADOR);

    expect(proprietario?.permissoes).toEqual(permissionKeys);
    expect(administrador?.permissoes).toEqual(permissionKeys);
  });

  it("Secretario e Profissional nascem com tudo exceto operacoes de exclusao", () => {
    const secretario = papeis.find((papel) => papel.nome === NOME_ROLE_SECRETARIO);
    const profissional = papeis.find((papel) => papel.nome === NOME_ROLE_PROFISSIONAL);

    expect(secretario?.permissoes).not.toContain("agenda:delete");
    expect(profissional?.permissoes).not.toContain("agenda:delete");
    expect(secretario?.permissoes).toContain("agenda:read");
  });
});
