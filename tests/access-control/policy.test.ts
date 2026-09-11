import { describe, expect, it } from "vitest";
import { NOME_ROLE_PROPRIETARIO, canActAs, canUseFeature, temEmpresaAtiva } from "@/lib/access-control/policy";
import {
  createContext,
  createMembroEmpresa,
  ctxAdministradorEmpresa,
  ctxAdmin,
  ctxProprietarioEmpresa,
  ctxUsuario,
} from "../helpers/access-context-fixtures";

describe("access-control policy", () => {
  describe("canActAs", () => {
    it("permite ADMIN quando o contexto e administrativo", () => {
      expect(canActAs(ctxAdmin, "ADMIN")).toBe(true);
    });

    it("nega ADMIN quando o contexto nao e administrativo", () => {
      expect(canActAs(ctxUsuario, "ADMIN")).toBe(false);
    });

    it("permite PROPRIETARIO_EMPRESA quando o role do vinculo ativo e Proprietario", () => {
      expect(canActAs(ctxProprietarioEmpresa, "PROPRIETARIO_EMPRESA")).toBe(true);
    });

    it("nega PROPRIETARIO_EMPRESA para um membro com outro role", () => {
      expect(canActAs(ctxAdministradorEmpresa, "PROPRIETARIO_EMPRESA")).toBe(false);
    });

    it("nega PROPRIETARIO_EMPRESA para usuario sem vinculo com empresa", () => {
      expect(canActAs(ctxUsuario, "PROPRIETARIO_EMPRESA")).toBe(false);
    });

    it("admin da plataforma sempre pode agir como PROPRIETARIO_EMPRESA", () => {
      expect(canActAs(ctxAdmin, "PROPRIETARIO_EMPRESA")).toBe(true);
    });
  });

  describe("temEmpresaAtiva", () => {
    it("e verdadeiro quando ha vinculo ativo com uma empresa", () => {
      expect(temEmpresaAtiva(ctxAdministradorEmpresa)).toBe(true);
    });

    it("e falso quando o usuario nao tem vinculo com nenhuma empresa", () => {
      expect(temEmpresaAtiva(ctxUsuario)).toBe(false);
    });

    it("e verdadeiro para admin da plataforma mesmo sem vinculo", () => {
      expect(temEmpresaAtiva(ctxAdmin)).toBe(true);
    });
  });

  describe("canUseFeature", () => {
    it("admin da plataforma sempre pode usar qualquer feature", () => {
      expect(canUseFeature(ctxAdmin, "agenda:create")).toBe(true);
    });

    it("permite quando a permissao esta no role do vinculo ativo", () => {
      expect(canUseFeature(ctxAdministradorEmpresa, "agenda:create")).toBe(true);
    });

    it("nega quando a permissao nao esta no role do vinculo ativo", () => {
      expect(canUseFeature(ctxAdministradorEmpresa, "agenda:delete")).toBe(false);
    });

    it("nega quando o usuario nao tem vinculo com nenhuma empresa", () => {
      expect(canUseFeature(ctxUsuario, "agenda:create")).toBe(false);
    });

    it("resolve a permissao pelo vinculo com a empresa ativa, nao por um role global", () => {
      const ctxComOutraEmpresa = createContext({
        membroEmpresa: createMembroEmpresa({
          empresaId: "empresa-2",
          permissoes: ["agenda:create"],
        }),
      });

      expect(canUseFeature(ctxComOutraEmpresa, "agenda:create")).toBe(true);
      expect(canUseFeature(ctxComOutraEmpresa, "empresa:convidar")).toBe(false);
    });

    it("nega quando a permissao esta no role mas nao esta liberada no plano da empresa", () => {
      const ctxComPlanoRestrito = createContext({
        membroEmpresa: createMembroEmpresa({
          permissoes: ["agenda:create"],
          permissoesPlano: { "agenda:create": false },
        }),
      });

      expect(canUseFeature(ctxComPlanoRestrito, "agenda:create")).toBe(false);
    });

    it("admin da plataforma ignora o plano da empresa", () => {
      expect(canUseFeature(ctxAdmin, "agenda:create")).toBe(true);
    });

    it("proprietario sempre tem a permissao no role, mesmo sem ela em Role.permissoes", () => {
      expect(canUseFeature(ctxProprietarioEmpresa, "agenda:delete")).toBe(true);
    });

    it("proprietario continua sujeito ao teto do plano da empresa", () => {
      const ctxProprietarioComPlanoRestrito = createContext({
        membroEmpresa: createMembroEmpresa({
          roleNome: NOME_ROLE_PROPRIETARIO,
          permissoesPlano: { "agenda:delete": false },
        }),
      });

      expect(canUseFeature(ctxProprietarioComPlanoRestrito, "agenda:delete")).toBe(false);
    });
  });
});
