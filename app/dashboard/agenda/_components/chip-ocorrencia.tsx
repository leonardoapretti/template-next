"use client";

import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/tailwind";
import type { OcorrenciaAgendamento } from "./engine/agendamento.types";
import { corEvento, rotuloEvento } from "./timeline-estilo";

// ─────────────────────────────────────────────────────────────
// BotaoChip — botão visual do chip sem lógica de popover
// Reutilizado pelo ChipOcorrencia e pelo ChipOverflow
// ─────────────────────────────────────────────────────────────

export function BotaoChip({
  oc,
  ...props
}: { oc: OcorrenciaAgendamento } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        event.stopPropagation();
        props.onClick?.(event);
      }}
      className={cn(
        "w-full truncate rounded px-1 py-0.5 text-[10px] font-medium leading-none",
        "cursor-pointer select-none text-left transition-opacity hover:opacity-80",
        corEvento(oc),
        props.className,
      )}
    >
      <span className="tabular-nums">{oc.horaInicio}</span> {rotuloEvento(oc)}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// ChipOcorrencia — chip que abre o modal de detalhes
// ─────────────────────────────────────────────────────────────

interface ChipOcorrenciaProps {
  oc: OcorrenciaAgendamento;
}

export function ChipOcorrencia({ oc }: ChipOcorrenciaProps) {
  const { abrirDiaDetalhe } = useAgenda();

  return <BotaoChip oc={oc} onClick={() => abrirDiaDetalhe(oc.data)} />;
}

// ─────────────────────────────────────────────────────────────
// MaisOcorrencias — "+N mais" que abre popover com chips restantes
// Cada chip no overflow abre seu próprio popover de detalhes
// ─────────────────────────────────────────────────────────────

interface MaisOcorrenciasProps {
  ocorrencias: OcorrenciaAgendamento[];
}

export function MaisOcorrencias({ ocorrencias }: MaisOcorrenciasProps) {
  if (ocorrencias.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="mt-2 w-full cursor-pointer px-1 text-left text-sm leading-none text-muted-foreground transition-colors hover:text-foreground"
          >
            +{ocorrencias.length} mais
          </button>
        }
      />
      <PopoverContent className="w-auto max-w-75 p-2" side="top" align="center" sideOffset={6}>
        <div className="flex flex-col gap-1">
          {ocorrencias.map((oc) => (
            <ChipOcorrencia key={oc.id} oc={oc} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────
// LoadingBar — reutilizada no topo de cada view
// ─────────────────────────────────────────────────────────────

interface LoadingBarProps {
  visible: boolean;
}

export function LoadingBar({ visible }: LoadingBarProps) {
  if (!visible) return null;
  return <div className="h-0.5 animate-pulse bg-primary/30" />;
}
