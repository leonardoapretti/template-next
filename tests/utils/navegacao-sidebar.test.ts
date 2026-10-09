import { describe, expect, it } from "vitest";
import {
  ativaDaSecao,
  filtrarPorAcesso,
  type NavGroup,
  subitensDaSecao,
  topoDoFlyout,
  urlAtiva,
} from "@/lib/dashboard/navegacao";

const URLS = [
  "/dashboard",
  "/dashboard/vendas",
  "/dashboard/vendas/nova",
  "/dashboard/produtos",
  "/dashboard/produtos/estoque",
];

describe("urlAtiva", () => {
  it("escolhe o destino mais específico que casa com a rota", () => {
    expect(urlAtiva("/dashboard/produtos/estoque", URLS)).toBe("/dashboard/produtos/estoque");
    expect(urlAtiva("/dashboard/vendas/nova", URLS)).toBe("/dashboard/vendas/nova");
  });

  it("uma página de detalhe marca a lista à qual pertence", () => {
    expect(urlAtiva("/dashboard/vendas/abc123", URLS)).toBe("/dashboard/vendas");
    expect(urlAtiva("/dashboard/produtos/xyz/editar", URLS)).toBe("/dashboard/produtos");
  });

  it("o Início só fica ativo na própria página", () => {
    expect(urlAtiva("/dashboard", URLS)).toBe("/dashboard");
    expect(urlAtiva("/dashboard/conta", URLS)).toBe("/dashboard");
  });

  it("não confunde prefixo de texto com pasta (/vendas-antigas)", () => {
    expect(urlAtiva("/dashboard/vendas-antigas", URLS)).toBe("/dashboard");
  });

  it("sem nenhum destino que case, não marca nada", () => {
    expect(urlAtiva("/outra", URLS)).toBeNull();
  });
});

describe("subitensDaSecao", () => {
  it("seção com o único subitem igual ao próprio link vira link simples", () => {
    expect(
      subitensDaSecao({ title: "Início", url: "/a", items: [{ title: "Início", url: "/a" }] }),
    ).toEqual([]);
  });

  it("mantém os subitens quando há mais de um destino", () => {
    const items = [
      { title: "A", url: "/a" },
      { title: "B", url: "/b" },
    ];

    expect(subitensDaSecao({ title: "X", url: "/a", items })).toEqual(items);
  });
});

describe("filtrarPorAcesso", () => {
  const grupos: NavGroup[] = [
    { items: [{ title: "Início", url: "/" }] },
    {
      label: "Configurações",
      items: [
        {
          title: "Loja",
          url: "/config/a",
          items: [
            { title: "A", url: "/config/a" },
            { title: "B", url: "/config/b" },
          ],
        },
        { title: "Cupons", url: "/cupons" },
      ],
    },
  ];

  it("sem bloqueios devolve tudo", () => {
    expect(filtrarPorAcesso(grupos, new Set())).toEqual(grupos);
  });

  it("esconde o link bloqueado e o grupo que fica vazio", () => {
    const resultado = filtrarPorAcesso(grupos, new Set(["/cupons", "/config/a", "/config/b"]));

    expect(resultado.map((grupo) => grupo.label)).toEqual([undefined]);
  });

  it("a seção que perde o próprio link aponta para o primeiro subitem liberado", () => {
    const resultado = filtrarPorAcesso(grupos, new Set(["/config/a"]));
    const loja = resultado[1].items[0];

    expect(loja.url).toBe("/config/b");
    expect(loja.items).toEqual([{ title: "B", url: "/config/b" }]);
  });
});

describe("ativaDaSecao", () => {
  const vendas = {
    title: "Vendas",
    url: "/dashboard/vendas",
    items: [
      { title: "Todas", url: "/dashboard/vendas" },
      { title: "Registrar", url: "/dashboard/vendas/nova" },
    ],
  };

  it("passa a URL ativa só para a seção a que ela pertence", () => {
    expect(ativaDaSecao(vendas, "/dashboard/vendas/nova")).toBe("/dashboard/vendas/nova");
    expect(ativaDaSecao(vendas, "/dashboard/vendas")).toBe("/dashboard/vendas");
    expect(ativaDaSecao(vendas, "/dashboard/produtos")).toBeNull();
    expect(ativaDaSecao(vendas, null)).toBeNull();
  });
});

describe("topoDoFlyout", () => {
  it("alinha ao topo do ícone quando cabe na janela", () => {
    expect(topoDoFlyout(200, 3, 900)).toBe(200);
  });

  it("sobe o flyout quando passaria do fim da janela", () => {
    // 32 (título) + 4 × 36 + 16 (respiro) = 192; 700 - 192 - 8 = 500.
    expect(topoDoFlyout(650, 4, 700)).toBe(500);
  });

  it("nunca sobe acima da margem do topo, mesmo em janela baixa", () => {
    expect(topoDoFlyout(50, 6, 200)).toBe(8);
  });
});
