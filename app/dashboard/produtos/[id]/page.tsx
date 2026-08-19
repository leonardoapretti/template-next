import { BoxIcon, InfoIcon, PackageIcon, TagIcon } from "lucide-react";
import { notFound } from "next/navigation";
import {
  DetalhesHeader,
  DetalhesHeaderConteudo,
  DetalhesHeaderIcone,
  DetalhesHeaderIdentidade,
  DetalhesHeaderStats,
  DetalhesHeaderStatsCelula,
  DetalhesHeaderStatsLabel,
  DetalhesHeaderStatsValor,
  DetalhesHeaderSubtitulo,
  DetalhesHeaderTitulo,
  DetalhesInfoCard,
  PaginaDetalhes,
} from "@/components/pages/detalhes";
import { Badge } from "@/components/ui/badge";

// Dado mockado — em uma implementação real, isso viria de um service
// (ex: produtoService.buscarPorId(id)) que retorna DataBaseResponse.
const PRODUTO_EXEMPLO = {
  id: "exemplo",
  nome: "Produto de exemplo",
  sku: "TPL-0001",
  categoria: "Demonstração",
  status: "Ativo",
  preco: "R$ 129,90",
  estoque: 42,
  vendas: 187,
  descricao:
    "Este é um recurso fictício, usado apenas para demonstrar o padrão de página de detalhes (components/pages/detalhes) do template. Substitua por um recurso real do seu domínio.",
  atributos: [
    { label: "Peso", value: "320g" },
    { label: "Dimensões", value: "12 x 8 x 4 cm" },
    { label: "Fornecedor", value: "Fornecedor Exemplo Ltda." },
  ],
};

export default async function ProdutoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id !== PRODUTO_EXEMPLO.id) {
    notFound();
  }

  const produto = PRODUTO_EXEMPLO;

  return (
    <PaginaDetalhes>
      <DetalhesHeader>
        <DetalhesHeaderIdentidade>
          <DetalhesHeaderIcone>
            <PackageIcon className="size-5" />
          </DetalhesHeaderIcone>

          <DetalhesHeaderConteudo>
            <DetalhesHeaderTitulo>{produto.nome}</DetalhesHeaderTitulo>
            <DetalhesHeaderSubtitulo>
              <Badge variant="secondary">{produto.sku}</Badge>
              <Badge>{produto.status}</Badge>
            </DetalhesHeaderSubtitulo>
          </DetalhesHeaderConteudo>
        </DetalhesHeaderIdentidade>

        <DetalhesHeaderStats>
          <DetalhesHeaderStatsCelula>
            <DetalhesHeaderStatsLabel>Preço</DetalhesHeaderStatsLabel>
            <DetalhesHeaderStatsValor>{produto.preco}</DetalhesHeaderStatsValor>
          </DetalhesHeaderStatsCelula>
          <DetalhesHeaderStatsCelula>
            <DetalhesHeaderStatsLabel>Estoque</DetalhesHeaderStatsLabel>
            <DetalhesHeaderStatsValor>{produto.estoque}</DetalhesHeaderStatsValor>
          </DetalhesHeaderStatsCelula>
          <DetalhesHeaderStatsCelula>
            <DetalhesHeaderStatsLabel>Vendas</DetalhesHeaderStatsLabel>
            <DetalhesHeaderStatsValor>{produto.vendas}</DetalhesHeaderStatsValor>
          </DetalhesHeaderStatsCelula>
        </DetalhesHeaderStats>
      </DetalhesHeader>

      <PaginaDetalhes.Body>
        <PaginaDetalhes.Main>
          <PaginaDetalhes.Section title="Sobre" icon={<InfoIcon className="size-4" />}>
            <p className="text-sm leading-relaxed text-muted-foreground">{produto.descricao}</p>
          </PaginaDetalhes.Section>

          <PaginaDetalhes.Section title="Atributos" icon={<TagIcon className="size-4" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {produto.atributos.map((atributo) => (
                <PaginaDetalhes.Field
                  key={atributo.label}
                  label={atributo.label}
                  value={atributo.value}
                />
              ))}
            </div>
          </PaginaDetalhes.Section>
        </PaginaDetalhes.Main>

        <PaginaDetalhes.Sidebar>
          <PaginaDetalhes.Section title="Categoria" icon={<BoxIcon className="size-4" />}>
            <DetalhesInfoCard
              title={produto.categoria}
              description="Categoria fictícia usada apenas para ilustrar o layout da sidebar."
            />
          </PaginaDetalhes.Section>
        </PaginaDetalhes.Sidebar>
      </PaginaDetalhes.Body>
    </PaginaDetalhes>
  );
}
