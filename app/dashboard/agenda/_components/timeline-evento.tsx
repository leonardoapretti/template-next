"use client";

import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { cn } from "@/lib/utils/tailwind";
import { montarDraftDetalhesEvento } from "./engine/evento-dialog-draft";
import {
  ALTURA_HORA_PX,
  type EventoPosicionado,
  GUTTER_CRIACAO_PX,
} from "./engine/layout-eventos-timeline";
import { corEvento, rotuloEvento } from "./timeline-estilo";

const GAP_ENTRE_COLUNAS_PX = 2;

interface TimelineEventoProps {
  posicionado: EventoPosicionado;
}

export function TimelineEvento({ posicionado }: TimelineEventoProps) {
  const { abrirDetalhesEvento } = useAgenda();
  const { oc, inicioMinutos, fimMinutos, coluna, totalColunas } = posicionado;

  const top = (inicioMinutos / 60) * ALTURA_HORA_PX;
  const altura = ((fimMinutos - inicioMinutos) / 60) * ALTURA_HORA_PX;
  const compacto = altura < 40;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        abrirDetalhesEvento(montarDraftDetalhesEvento(oc));
      }}
      className={cn(
        "absolute z-10 flex flex-col overflow-hidden rounded-md px-1.5 text-left text-[11px] leading-tight",
        "cursor-pointer shadow-sm ring-1 ring-black/5 transition-opacity hover:opacity-90",
        compacto ? "justify-center py-0" : "justify-start py-1",
        corEvento(oc),
      )}
      style={{
        top,
        height: Math.max(altura, 18),
        left: `calc(${(coluna / totalColunas) * 100}% + ${coluna === 0 ? 0 : GAP_ENTRE_COLUNAS_PX / 2}px)`,
        width:
          coluna === totalColunas - 1
            ? `calc(${100 / totalColunas}% - ${GAP_ENTRE_COLUNAS_PX + GUTTER_CRIACAO_PX}px)`
            : `calc(${100 / totalColunas}% - ${GAP_ENTRE_COLUNAS_PX}px)`,
      }}
    >
      {compacto ? (
        <span className="truncate">
          <span className="tabular-nums">{oc.horaInicio}</span> {rotuloEvento(oc)}
        </span>
      ) : (
        <>
          <span className="truncate font-medium">{rotuloEvento(oc)}</span>
          <span className="truncate tabular-nums opacity-90">
            {oc.horaInicio} – {oc.horaFim}
          </span>
        </>
      )}
    </button>
  );
}
