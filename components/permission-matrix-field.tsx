"use client";

import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { aplicarDependenciasDeLeitura, resourceRegistry } from "@/lib/access-control/permission-registry";

const OPERACOES_DE_ESCRITA = ["create", "update", "delete"];

// Matriz de permissões reutilizável entre a tela de papéis da empresa
// (`app/dashboard/empresa/papeis`) e a tela global de planos
// (`app/(admin)/admin/planos`) — ambas só precisam de um
// `Record<chave, boolean>` + callback de mudança, então o mesmo componente
// serve pras duas sem acoplamento a Role nem a Plano. Padrão de UI (card
// por recurso, checkbox mestre + "+ opções" colapsável).
type Resource = (typeof resourceRegistry)[number];

type PermissionMatrixFieldProps = {
  valores: Record<string, boolean>;
  onChange: (valores: Record<string, boolean>) => void;
};

export function PermissionMatrixField({ valores, onChange }: PermissionMatrixFieldProps) {
  function alternarOperacao(chave: string, permitido: boolean) {
    onChange(aplicarDependenciasDeLeitura({ ...valores, [chave]: permitido }));
  }

  function alternarOperacoes(chaves: string[], permitido: boolean) {
    const proximo = { ...valores };

    for (const chave of chaves) {
      proximo[chave] = permitido;
    }

    onChange(aplicarDependenciasDeLeitura(proximo));
  }

  return (
    <div className="grid gap-2">
      {resourceRegistry.map((resource) => (
        <ResourceRow
          key={resource.key}
          resource={resource}
          valores={valores}
          onToggleOperacao={alternarOperacao}
          onToggleOperacoes={alternarOperacoes}
        />
      ))}
    </div>
  );
}

function ResourceRow({
  resource,
  valores,
  onToggleOperacao,
  onToggleOperacoes,
}: {
  resource: Resource;
  valores: Record<string, boolean>;
  onToggleOperacao: (chave: string, permitido: boolean) => void;
  onToggleOperacoes: (chaves: string[], permitido: boolean) => void;
}) {
  const nucleo = resource.operations.filter((operacao) => operacao.kind !== "extra");
  // Recursos sem nenhuma operação central (ex.: "empresa", só com "extra")
  // usam todas as operações como núcleo — senão o checkbox mestre ficaria
  // sempre marcado (every/some num array vazio) e sem efeito ao clicar.
  const operacoesControladasPeloMestre = nucleo.length > 0 ? nucleo : resource.operations;
  const chavesControladasPeloMestre = operacoesControladasPeloMestre.map((operacao) => operacao.key);
  const todasNucleoMarcadas = operacoesControladasPeloMestre.every((operacao) => valores[operacao.key]);
  const algumaNucleoMarcada = operacoesControladasPeloMestre.some((operacao) => valores[operacao.key]);
  const temOpcoesIndividuais = resource.operations.length > 1;

  return (
    <Collapsible className="group/recurso rounded-xl border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Checkbox
            id={`recurso-${resource.key}`}
            checked={todasNucleoMarcadas}
            indeterminate={algumaNucleoMarcada && !todasNucleoMarcadas}
            onCheckedChange={(checked) =>
              onToggleOperacoes(chavesControladasPeloMestre, checked === true)
            }
          />
          <label htmlFor={`recurso-${resource.key}`} className="truncate text-sm font-medium">
            {resource.label}
          </label>
        </div>

        {temOpcoesIndividuais && (
          <CollapsibleTrigger className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            + opções
            <ChevronDown className="size-3.5 transition-transform group-data-open/recurso:rotate-180" />
          </CollapsibleTrigger>
        )}
      </div>

      <CollapsibleContent>
        <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
          {resource.operations.map((operacao) => {
            // Trava a leitura enquanto alguma escrita do recurso estiver
            // liberada — não editar/excluir sem poder ver não faz sentido.
            // Desligar a escrita primeiro libera a leitura de novo.
            const leituraBloqueada =
              operacao.kind === "read" &&
              resource.operations.some(
                (outra) => OPERACOES_DE_ESCRITA.includes(outra.kind) && valores[outra.key],
              );

            return (
              <div key={operacao.key} className="flex items-center gap-2">
                <Checkbox
                  disabled={leituraBloqueada}
                  id={`operacao-${operacao.key}`}
                  checked={Boolean(valores[operacao.key])}
                  onCheckedChange={(checked) => onToggleOperacao(operacao.key, checked === true)}
                />
                <label
                  className="text-sm data-[disabled]:text-muted-foreground"
                  data-disabled={leituraBloqueada || undefined}
                  htmlFor={`operacao-${operacao.key}`}
                >
                  {operacao.label}
                </label>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
