import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Guarda de contraste do design system (WCAG 2.2 AA): lê os tokens de
// app/globals.css nos dois temas e confere os pares de cor que a aplicação usa.
// Regras: .claude/skills/design-system/references/contraste-e-cores.md

type Cor = { l: number; c: number; h: number; alpha: number };
type Rgb = [number, number, number];

const css = readFileSync("app/globals.css", "utf8");

function bloco(seletor: string): string {
  const inicio = css.indexOf(`${seletor} {`);
  const fim = css.indexOf("\n}", inicio);

  return css.slice(inicio, fim);
}

function lerTokens(texto: string): Record<string, Cor> {
  const tokens: Record<string, Cor> = {};

  for (const [, nome, valor] of texto.matchAll(/--([\w-]+):\s*oklch\(([^)]+)\)/g)) {
    const [cor, alfa] = valor.split("/").map((parte) => parte.trim());
    const [l, c, h] = cor.split(/\s+/).map(Number);
    const alpha = alfa ? Number.parseFloat(alfa) / (alfa.endsWith("%") ? 100 : 1) : 1;

    tokens[nome] = { l, c, h: h || 0, alpha };
  }

  return tokens;
}

// OKLCH -> sRGB linear (matrizes de Björn Ottosson).
function paraRgb({ l, c, h }: Cor): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const limitar = (valor: number) => Math.min(1, Math.max(0, valor));

  return [
    limitar(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    limitar(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    limitar(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  ];
}

const luminancia = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function razao(a: Rgb, b: Rgb): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);

  return (claro + 0.05) / (escuro + 0.05);
}

// Cor com transparência composta sobre um fundo opaco.
function sobre(frente: Cor, fundo: Rgb, alpha = frente.alpha): Rgb {
  const rgb = paraRgb(frente);

  return rgb.map((canal, i) => canal * alpha + fundo[i] * (1 - alpha)) as Rgb;
}

const TEMAS = {
  claro: lerTokens(bloco(":root")),
  escuro: { ...lerTokens(bloco(":root")), ...lerTokens(bloco(".dark")) },
} as const;

// Opacidade do fundo translúcido dos badges (ver components/ui/badge.tsx).
const TINTA_DO_BADGE = {
  claro: { "success-text": 0.1, "info-text": 0.1, "destructive-text": 0.1, "warning-text": 0.15 },
  escuro: { "success-text": 0.1, "info-text": 0.1, "destructive-text": 0.1, "warning-text": 0.1 },
} as const;

const TEXTO = 4.5;
const COMPONENTE = 3;

for (const [tema, t] of Object.entries(TEMAS) as [keyof typeof TEMAS, Record<string, Cor>][]) {
  const fundo = (nome: string): Rgb => sobre(t[nome], paraRgb(t.background), 1);
  const par = (frente: Cor | string, atras: string) => {
    const cor = typeof frente === "string" ? t[frente] : frente;

    return razao(sobre(cor, fundo(atras)), fundo(atras));
  };

  describe(`contraste — tema ${tema}`, () => {
    const textos: [string, string, string][] = [
      ["texto principal", "foreground", "background"],
      ["texto em card", "card-foreground", "card"],
      ["texto secundário no fundo", "muted-foreground", "background"],
      ["texto secundário em card", "muted-foreground", "card"],
      ["texto secundário em muted", "muted-foreground", "muted"],
      ["link/texto dourado", "primary-text", "background"],
      ["texto do botão primário", "primary-foreground", "primary"],
      ["texto secundário (secondary)", "secondary-foreground", "secondary"],
      ["texto em accent", "accent-foreground", "accent"],
      ["texto de erro", "destructive-text", "background"],
      ["texto de sucesso", "success-text", "background"],
      ["texto informativo", "info-text", "background"],
      ["texto de aviso", "warning-text", "background"],
      ["texto de sucesso em card", "success-text", "card"],
      ["texto de aviso em card", "warning-text", "card"],
      ["texto sobre fundo de sucesso", "success-foreground", "success"],
      ["texto sobre fundo informativo", "info-foreground", "info"],
      ["texto sobre fundo de aviso", "warning-foreground", "warning"],
    ];

    it.each(textos)("%s ≥ 4,5:1 (%s sobre %s)", (_rotulo, frente, atras) => {
      expect(par(frente, atras)).toBeGreaterThanOrEqual(TEXTO);
    });

    it("texto sobre o fundo de erro (destructive-foreground) ≥ 4,5:1", () => {
      expect(par("destructive-foreground", "destructive")).toBeGreaterThanOrEqual(TEXTO);
    });

    it.each(
      Object.entries(TINTA_DO_BADGE[tema]),
    )("texto do badge %s sobre a tinta translúcida ≥ 4,5:1", (nome, alpha) => {
      const tinta = sobre(t[nome], paraRgb(t.background), alpha);

      expect(razao(paraRgb(t[nome]), tinta)).toBeGreaterThanOrEqual(TEXTO);
    });

    // Borda de campo e anel de foco (WCAG 1.4.11, ≥ 3:1), inclusive sobre card.
    it("borda de campo (--input) ≥ 3:1 contra o fundo e o card", () => {
      expect(par("input", "background")).toBeGreaterThanOrEqual(COMPONENTE);
      expect(par("input", "card")).toBeGreaterThanOrEqual(COMPONENTE);
    });

    it("anel de foco (--ring) ≥ 3:1 contra o fundo e o card", () => {
      expect(par("ring", "background")).toBeGreaterThanOrEqual(COMPONENTE);
      expect(par("ring", "card")).toBeGreaterThanOrEqual(COMPONENTE);
    });
  });
}
