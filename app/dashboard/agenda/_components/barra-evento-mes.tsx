"use client";

import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { cn } from "@/lib/utils/tailwind";
import { montarDraftDetalhesEvento } from "./engine/evento-dialog-draft";
import type { BarraPosicionada } from "./engine/layout-eventos-mes";
import { corEvento, rotuloEvento } from "./timeline-estilo";

const ALTURA_LINHA_PX = 20;

interface BarraEventoMesProps {
  barra: BarraPosicionada;
  /** Linha do grid (1-based) em que a linha 0 do layout deve começar. */
  linhaBase?: number;
}

export function BarraEventoMes({ barra, linhaBase = 2 }: BarraEventoMesProps) {
  const { abrirDetalhesEvento } = useAgenda();
  const { oc, colInicio, colFim, linha } = barra;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        abrirDetalhesEvento(montarDraftDetalhesEvento(oc));
      }}
      className={cn(
        "relative z-10 truncate rounded px-1.5 text-left text-[10px] font-medium leading-none",
        "cursor-pointer select-none hover:opacity-80",
        corEvento(oc),
      )}
      style={{
        gridColumn: `${colInicio + 1} / ${colFim + 2}`,
        gridRow: linha + linhaBase,
        height: ALTURA_LINHA_PX - 2,
        marginTop: 1,
      }}
    >
      {oc.diaTodo ? rotuloEvento(oc) : `${oc.horaInicio ?? ""} ${rotuloEvento(oc)}`}
    </button>
  );
}

export { ALTURA_LINHA_PX };
