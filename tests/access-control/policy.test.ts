import { describe, expect, it } from "vitest";
import { canActAs } from "@/lib/access-control/policy";
import { ctxAdmin, ctxUsuario } from "../helpers/access-context-fixtures";

describe("access-control policy", () => {
  describe("canActAs", () => {
    it("permite ADMIN quando o contexto e administrativo", () => {
      expect(canActAs(ctxAdmin, "ADMIN")).toBe(true);
    });

    it("nega ADMIN quando o contexto nao e administrativo", () => {
      expect(canActAs(ctxUsuario, "ADMIN")).toBe(false);
    });
  });
});
