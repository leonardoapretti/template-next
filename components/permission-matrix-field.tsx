"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  aplicarDependenciasDeLeitura,
  type OperationKind,
  permissionKeys,
  resourceRegistry,
} from "@/lib/access-control/permission-registry";
import { cn } from "@/lib/utils";

// Matriz de permissões usada na tela de perfis (`app/dashboard/equipe/papeis`)
// — só precisa de um `Record<chave, boolean>` + callback de mudança, sem
// acoplamento a Role. Recursos com operações de CRUD viram linhas de uma
// tabela (recurso × Ver/Criar/Editar/Excluir, com "Tudo" por linha); os
// que só têm operações `extra` (gerenciar, convidar...) ficam numa lista
// separada, logo abaixo.
type Resource = (typeof resourceRegistry)[number];

const COLUNAS: { kind: Exclude<OperationKind, "extra">; titulo: string }[] = [
  { kind: "read", titulo: "Ver" },
  { kind: "create", titulo: "Criar" },
  { kind: "update", titulo: "Editar" },
  { kind: "delete", titulo: "Excluir" },
];

const OPERACOES_DE_ESCRITA: OperationKind[] = ["create", "update", "delete"];

const GRADE_COLUNAS =
  "grid grid-cols-[minmax(0,1fr)_repeat(5,2.75rem)] items-center sm:grid-cols-[minmax(0,1fr)_repeat(5,4.5rem)]";

type PermissionMatrixFieldProps = {
  valores: Record<string, boolean>;
  onChange: (valores: Record<string, boolean>) => void;
  somenteLeitura?: boolean;
};

export function PermissionMatrixField({
  valores,
  onChange,
  somenteLeitura = false,
}: PermissionMatrixFieldProps) {
  const comCrud = resourceRegistry.filter((recurso) =>
    recurso.operations.some((operacao) => operacao.kind !== "extra"),
  );
  const extras = resourceRegistry.flatMap((recurso) =>
    recurso.operations
      .filter((operacao) => operacao.kind === "extra")
      .map((operacao) => ({ recurso, operacao })),
  );

  function definir(chaves: string[], permitido: boolean) {
    const proximo = { ...valores };

    for (const chave of chaves) {
      proximo[chave] = permitido;
    }

    onChange(aplicarDependenciasDeLeitura(proximo));
  }

  return (
    <div className="space-y-6">
      {!somenteLeitura && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => definir([...permissionKeys], true)}
            size="sm"
            type="button"
            variant="outline"
          >
            Marcar tudo
          </Button>
          <Button
            onClick={() => definir([...permissionKeys], false)}
            size="sm"
            type="button"
            variant="ghost"
          >
            Limpar
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <div
          className={cn(
            GRADE_COLUNAS,
            "border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground",
          )}
        >
          <span>Recurso</span>
          {COLUNAS.map((coluna) => (
            <span className="text-center" key={coluna.kind}>
              {coluna.titulo}
            </span>
          ))}
          <span className="text-center">Tudo</span>
        </div>

        <div className="divide-y">
          {comCrud.map((recurso) => (
            <LinhaDoRecurso
              key={recurso.key}
              onDefinir={definir}
              recurso={recurso}
              somenteLeitura={somenteLeitura}
              valores={valores}
            />
          ))}
        </div>
      </div>

      {extras.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground">Gestão e configurações</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Permissões avulsas, que não seguem o ciclo ver/criar/editar/excluir.
          </p>

          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {extras.map(({ recurso, operacao }) => (
              <li key={operacao.key}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40 has-data-checked:border-primary/40 has-data-checked:bg-primary/5",
                    somenteLeitura && "cursor-default hover:bg-transparent",
                  )}
                  htmlFor={`operacao-${operacao.key}`}
                >
                  <Checkbox
                    checked={Boolean(valores[operacao.key])}
                    className="mt-0.5"
                    disabled={somenteLeitura}
                    id={`operacao-${operacao.key}`}
                    onCheckedChange={(marcado) => definir([operacao.key], marcado === true)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{recurso.label}</span>
                    <span className="block text-xs text-muted-foreground">{operacao.label}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function LinhaDoRecurso({
  recurso,
  valores,
  somenteLeitura,
  onDefinir,
}: {
  recurso: Resource;
  valores: Record<string, boolean>;
  somenteLeitura: boolean;
  onDefinir: (chaves: string[], permitido: boolean) => void;
}) {
  const nucleo = recurso.operations.filter((operacao) => operacao.kind !== "extra");
  const chavesDoNucleo = nucleo.map((operacao) => operacao.key);
  const todasMarcadas = nucleo.every((operacao) => valores[operacao.key]);
  const algumaMarcada = nucleo.some((operacao) => valores[operacao.key]);
  // A leitura fica travada enquanto alguma escrita do recurso estiver
  // liberada — não editar/excluir sem poder ver. Desligar a escrita
  // primeiro libera a leitura de novo.
  const temEscritaLiberada = nucleo.some(
    (operacao) => OPERACOES_DE_ESCRITA.includes(operacao.kind) && valores[operacao.key],
  );

  return (
    <div
      className={cn(
        GRADE_COLUNAS,
        "px-3 py-2.5 transition-colors hover:bg-muted/30",
        algumaMarcada && "bg-primary/3",
      )}
    >
      <span className="pr-2 text-sm font-medium wrap-break-word">{recurso.label}</span>

      {COLUNAS.map((coluna) => {
        const operacao = nucleo.find((item) => item.kind === coluna.kind);

        if (!operacao) {
          return (
            <span aria-hidden className="text-center text-muted-foreground/40" key={coluna.kind}>
              –
            </span>
          );
        }

        const leituraTravada = coluna.kind === "read" && temEscritaLiberada;

        return (
          <span className="flex justify-center" key={coluna.kind}>
            <Checkbox
              aria-label={`${recurso.label}: ${operacao.label}`}
              checked={Boolean(valores[operacao.key])}
              disabled={somenteLeitura || leituraTravada}
              onCheckedChange={(marcado) => onDefinir([operacao.key], marcado === true)}
              title={
                leituraTravada
                  ? "Necessário enquanto criar, editar ou excluir estiver ativo"
                  : operacao.label
              }
            />
          </span>
        );
      })}

      <span className="flex justify-center">
        <Checkbox
          aria-label={`${recurso.label}: todas as permissões`}
          checked={todasMarcadas}
          disabled={somenteLeitura}
          indeterminate={algumaMarcada && !todasMarcadas}
          onCheckedChange={(marcado) => onDefinir(chavesDoNucleo, marcado === true)}
        />
      </span>
    </div>
  );
}
