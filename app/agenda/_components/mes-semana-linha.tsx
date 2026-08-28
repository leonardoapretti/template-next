"use client";

import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import type { DiaGrade } from "@/lib/utils/data";
import { cn } from "@/lib/utils/tailwind";
import { BarraEventoMes } from "./barra-evento-mes";
import { ChipOcorrencia, MaisOcorrencias } from "./chip-ocorrencia";
import type { OcorrenciaAgendamento } from "./engine/agendamento.types";
import { chaveData } from "./engine/chave-data";
import { type LayoutFaixaDias, MAX_LINHAS_BARRA } from "./engine/layout-eventos-mes";

const MAX_CHIPS = 3;
const MAX_CHIPS_MOBILE = 2;

interface SemanaMesProps {
  semana: DiaGrade[];
  layout: LayoutFaixaDias;
  porDataChips: Map<string, OcorrenciaAgendamento[]>;
  selectedDate: Date;
  onClickDia: (date: Date) => void;
}

export function SemanaMes({
  semana,
  layout,
  porDataChips,
  selectedDate,
  onClickDia,
}: SemanaMesProps) {
  const { abrirDiaDetalhe } = useAgenda();

  return (
    <div
      className="grid flex-1 grid-cols-7 border-b"
      style={{ gridTemplateRows: `auto repeat(${MAX_LINHAS_BARRA}, 20px) 1fr` }}
    >
      {semana.map((dia, coluna) => {
        const isSelecionado =
          dia.date.getDate() === selectedDate.getDate() &&
          dia.date.getMonth() === selectedDate.getMonth() &&
          dia.date.getFullYear() === selectedDate.getFullYear();

        return (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: coluna é estável (0-6) dentro da semana
            key={coluna}
            type="button"
            aria-label="Ver eventos deste dia"
            onClick={() => onClickDia(dia.date)}
            className={cn(
              "border-r text-left transition-colors hover:bg-accent/50",
              !dia.mesAtual && "bg-muted/20",
              dia.isHoje && !isSelecionado && "bg-primary/5",
              isSelecionado && "bg-accent",
            )}
            style={{ gridColumn: coluna + 1, gridRow: "1 / -1" }}
          />
        );
      })}

      {semana.map((dia, coluna) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: coluna é estável (0-6) dentro da semana
          key={coluna}
          className={cn(
            "pointer-events-none relative z-10 mx-1 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm",
            !dia.mesAtual && "text-muted-foreground/40",
            dia.isHoje && "bg-primary font-semibold text-primary-foreground",
          )}
          style={{ gridColumn: coluna + 1, gridRow: 1 }}
        >
          {dia.date.getDate()}
        </span>
      ))}

      {layout.barras.map((barra) => (
        <BarraEventoMes
          key={barra.oc.id}
          barra={barra}
          onClick={() => abrirDiaDetalhe(barra.oc.data)}
        />
      ))}

      {semana.map((dia, coluna) => {
        const chave = chaveData(dia.date);
        const chips = porDataChips.get(chave) ?? [];
        const overflowBarras = layout.overflowPorDia.get(chave) ?? [];
        const maxChips = MAX_CHIPS - Math.min(overflowBarras.length, MAX_CHIPS);
        const visiveis = chips.slice(0, Math.max(maxChips, 0));
        const overflow = [...chips.slice(visiveis.length), ...overflowBarras];

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: coluna é estável (0-6) dentro da semana
            key={coluna}
            className="relative z-10 flex min-w-0 flex-col gap-0.5 overflow-hidden px-1 pb-1 sm:hidden"
            style={{ gridColumn: coluna + 1, gridRow: 2 + MAX_LINHAS_BARRA }}
          >
            {visiveis.slice(0, MAX_CHIPS_MOBILE).map((oc) => (
              <ChipOcorrencia key={oc.id} oc={oc} />
            ))}
            {visiveis.length > MAX_CHIPS_MOBILE || overflow.length > 0 ? (
              <span className="truncate px-1 text-[9px] leading-tight text-muted-foreground">
                +{visiveis.length - MAX_CHIPS_MOBILE + overflow.length} mais
              </span>
            ) : null}
          </div>
        );
      })}

      {semana.map((dia, coluna) => {
        const chave = chaveData(dia.date);
        const chips = porDataChips.get(chave) ?? [];
        const overflowBarras = layout.overflowPorDia.get(chave) ?? [];
        const maxChips = MAX_CHIPS - Math.min(overflowBarras.length, MAX_CHIPS);
        const visiveis = chips.slice(0, Math.max(maxChips, 0));
        const overflow = [...chips.slice(visiveis.length), ...overflowBarras];

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: coluna é estável (0-6) dentro da semana
            key={coluna}
            className="relative z-10 hidden min-w-0 flex-col gap-0.5 overflow-hidden px-1 pb-1 sm:flex"
            style={{ gridColumn: coluna + 1, gridRow: 2 + MAX_LINHAS_BARRA }}
          >
            {visiveis.map((oc) => (
              <ChipOcorrencia key={oc.id} oc={oc} />
            ))}
            <MaisOcorrencias ocorrencias={overflow} />
          </div>
        );
      })}
    </div>
  );
}
