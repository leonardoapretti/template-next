"use client";

import { cn } from "@/lib/utils/tailwind";
import { ChipOcorrencia, MaisOcorrencias } from "./chip-ocorrencia";
import type { OcorrenciaAgendamento } from "./engine/agendamento.types";

const MAX_CHIPS = 3;
const MAX_CHIPS_MOBILE = 2;

interface CelulaDiaProps {
  ocorrencias: OcorrenciaAgendamento[];
  isHoje: boolean;
  isSelecionado: boolean;
  /** Presente na ViewMes. Ausente (undefined) na ViewSemana. */
  numeroDia?: number;
  /** Dias fora do mês atual ficam esmaecidos. Irrelevante na ViewSemana. */
  mesAtual?: boolean;
  onClick: () => void;
}

export function CelulaDia({
  ocorrencias,
  isHoje,
  isSelecionado,
  numeroDia,
  mesAtual = true,
  onClick,
}: CelulaDiaProps) {
  const visiveis = ocorrencias.slice(0, MAX_CHIPS);
  const overflow = ocorrencias.slice(MAX_CHIPS);
  const visiveisMobile = ocorrencias.slice(0, MAX_CHIPS_MOBILE);
  const overflowMobile = ocorrencias.length - visiveisMobile.length;

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-start overflow-hidden border-r border-b p-1 sm:p-1.5",
        "cursor-pointer text-sm transition-colors hover:bg-accent/50",
        !mesAtual && "bg-muted/20 text-muted-foreground/40",
        mesAtual && "text-foreground",
        isHoje && !isSelecionado && "bg-primary/5",
        isSelecionado && "bg-accent",
      )}
    >
      <button
        type="button"
        aria-label="Criar evento neste horário"
        onClick={onClick}
        className="absolute inset-0 z-0"
      />

      {/* Número do dia — só na ViewMes */}
      {numeroDia !== undefined && (
        <span
          className={cn(
            "relative z-10 mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            "text-xs font-medium sm:h-7 sm:w-7 sm:text-sm",
            isHoje && "bg-primary font-semibold text-primary-foreground",
          )}
        >
          {numeroDia}
        </span>
      )}

      <div className="relative z-10 hidden w-full min-w-0 flex-col gap-0.5 overflow-hidden sm:flex">
        {visiveis.map((oc) => (
          <ChipOcorrencia key={oc.id} oc={oc} />
        ))}
        <MaisOcorrencias ocorrencias={overflow} />
      </div>

      <div className="relative z-10 flex w-full min-w-0 flex-col gap-0.5 overflow-hidden sm:hidden">
        {visiveisMobile.map((oc) => (
          <ChipOcorrencia key={oc.id} oc={oc} />
        ))}
        {overflowMobile > 0 && (
          <span className="truncate px-1 text-[9px] leading-tight text-muted-foreground">
            +{overflowMobile}
          </span>
        )}
      </div>
    </div>
  );
}
