"use client";

import { useMemo } from "react";
import type { DiaGrade } from "@/lib/utils/data";
import { cn } from "@/lib/utils/tailwind";
import { BarraEventoMes } from "./barra-evento-mes";
import type { OcorrenciaAgendamento } from "./engine/agendamento.types";
import { chaveData } from "./engine/chave-data";
import { layoutFaixaDias } from "./engine/layout-eventos-mes";

const MAX_LINHAS = 4;

interface FaixaDiaTodoProps {
  dias: DiaGrade[];
  ocorrencias: OcorrenciaAgendamento[];
  onCriarEvento: (date: Date) => void;
}

/** Faixa "dia inteiro" acima da timeline de horas, para eventos sem horário ou de vários dias. */
export function FaixaDiaTodo({ dias, ocorrencias, onCriarEvento }: FaixaDiaTodoProps) {
  const layout = useMemo(() => layoutFaixaDias(dias, ocorrencias, MAX_LINHAS), [dias, ocorrencias]);

  const linhasUsadas = Math.max(
    1,
    ...layout.barras.map((barra) => barra.linha + 1),
    layout.overflowPorDia.size > 0 ? MAX_LINHAS + 1 : 0,
  );

  if (layout.barras.length === 0 && layout.overflowPorDia.size === 0) {
    return null;
  }

  return (
    <div
      className="grid border-b"
      style={{
        gridTemplateColumns: `repeat(${dias.length}, 1fr)`,
        gridTemplateRows: `repeat(${linhasUsadas}, 20px)`,
      }}
    >
      {dias.map((dia, coluna) => (
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: coluna é estável dentro da faixa
          key={coluna}
          type="button"
          aria-label="Criar evento de dia inteiro"
          onClick={() => onCriarEvento(dia.date)}
          className={cn("border-r hover:bg-accent/40")}
          style={{ gridColumn: coluna + 1, gridRow: "1 / -1" }}
        />
      ))}

      {layout.barras.map((barra) => (
        <BarraEventoMes key={barra.oc.id} barra={barra} linhaBase={1} />
      ))}

      {dias.map((dia, coluna) => {
        const overflow = layout.overflowPorDia.get(chaveData(dia.date)) ?? [];

        if (overflow.length === 0) return null;

        return (
          <span
            key={chaveData(dia.date)}
            className="relative z-10 mx-1 truncate text-[10px] leading-tight text-muted-foreground"
            style={{ gridColumn: coluna + 1, gridRow: MAX_LINHAS + 1 }}
          >
            +{overflow.length} mais
          </span>
        );
      })}
    </div>
  );
}
