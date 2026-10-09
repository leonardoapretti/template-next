import { CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { Badge } from "@/components/ui/badge";
import { planoService } from "@/lib/services/plano.service";
import { routes } from "@/lib/utils/routes";
import { MatrizPlanoForm } from "./_components/matriz-plano-form";
import { NovoPlanoForm } from "./_components/novo-plano-form";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function PlanosAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const planoIdParam = Array.isArray(params.planoId) ? params.planoId[0] : params.planoId;

  const response = await planoService.listar();
  const planos = response.isSuccess() ? response.data : [];

  const planoSelecionado = planos.find((plano) => plano.id === planoIdParam) ?? planos[0] ?? null;
  const matriz = planoSelecionado ? await planoService.buscarMatriz(planoSelecionado.id) : null;

  return (
    <PageShell>
      <PageHeader
        description="Defina, por plano, quais recursos as empresas assinantes podem usar — teto aplicado independentemente das permissões de cada papel da empresa."
        icon={<CreditCardIcon className="size-5" />}
        title="Planos"
      />

      <PageSection title="Novo plano">
        <NovoPlanoForm />
      </PageSection>

      {planos.length > 0 && (
        <PageSection title="Permissões do plano">
          <div className="flex flex-wrap gap-2">
            {planos.map((plano) => (
              <Link
                className="no-underline"
                href={routes.admin.planoSelecionado(plano.id)}
                key={plano.id}
              >
                <Badge variant={plano.id === planoSelecionado?.id ? "default" : "outline"}>
                  {plano.nome}
                </Badge>
              </Link>
            ))}
          </div>

          {planoSelecionado && matriz && (
            <MatrizPlanoForm
              key={planoSelecionado.id}
              planoId={planoSelecionado.id}
              valoresIniciais={matriz}
            />
          )}
        </PageSection>
      )}
    </PageShell>
  );
}
