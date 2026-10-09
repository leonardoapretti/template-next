import { describe, expect, it } from "vitest";
import { SIDEBAR_COOKIE_NAME, sidebarAbertaPorPadrao } from "@/lib/dashboard/sidebar-estado";

describe("sidebarAbertaPorPadrao", () => {
  it("começa aberta na primeira visita (sem cookie)", () => {
    expect(sidebarAbertaPorPadrao(undefined)).toBe(true);
  });

  it("respeita a escolha gravada no cookie", () => {
    expect(sidebarAbertaPorPadrao("true")).toBe(true);
    expect(sidebarAbertaPorPadrao("false")).toBe(false);
  });

  it("o nome do cookie é o que o componente da sidebar grava", () => {
    expect(SIDEBAR_COOKIE_NAME).toBe("sidebar_state");
  });
});
