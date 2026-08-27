"use client";

import { useEffect, useState } from "react";
import { HORAS_DIA } from "@/lib/utils/data";
import { cn } from "@/lib/utils/tailwind";
import type { OcorrenciaAgendamento } from "./engine/agendamento.types";
import { ALTURA_HORA_PX, layoutEventosDoDia } from "./engine/layout-eventos-timeline";
import { TimelineEvento } from "./timeline-evento";
import { TimelineOverflow } from "./timeline-overflow";

const ALTURA_TOTAL_PX = ALTURA_HORA_PX * HORAS_DIA.length;

function minutosAgora() {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

interface TimelineColunaDiaProps {
  ocorrencias: OcorrenciaAgendamento[];
  isHoje: boolean;
  onSelectHorario: (hora: string) => void;
  className?: string;
}

export function TimelineColunaDia({
  ocorrencias,
  isHoje,
  onSelectHorario,
  className,
}: TimelineColunaDiaProps) {
  const [minutosAtuais, setMinutosAtuais] = useState<number | null>(isHoje ? minutosAgora() : null);

  useEffect(() => {
    if (!isHoje) {
      setMinutosAtuais(null);
      return;
    }

    setMinutosAtuais(minutosAgora());
    const intervalo = window.setInterval(() => setMinutosAtuais(minutosAgora()), 60_000);

    return () => window.clearInterval(intervalo);
  }, [isHoje]);

  const { eventos, overflows } = layoutEventosDoDia(ocorrencias);

  return (
    <div className={cn("relative min-w-0 border-r", className)} style={{ height: ALTURA_TOTAL_PX }}>
      {HORAS_DIA.map((hora, indice) => (
        <button
          key={hora}
          type="button"
          aria-label={`Criar evento às ${hora}`}
          onClick={() => onSelectHorario(hora)}
          className="absolute inset-x-0 cursor-pointer border-b hover:bg-accent/40"
          style={{ top: indice * ALTURA_HORA_PX, height: ALTURA_HORA_PX }}
        />
      ))}

      {minutosAtuais !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
          style={{ top: (minutosAtuais / 60) * ALTURA_HORA_PX }}
        >
          <span className="-ml-1 size-2 shrink-0 rounded-full bg-red-500" />
          <span className="h-px w-full bg-red-500" />
        </div>
      )}

      {eventos.map((posicionado) => (
        <TimelineEvento key={posicionado.oc.id} posicionado={posicionado} />
      ))}

      {overflows.map((overflow) => (
        <TimelineOverflow
          key={`overflow-${overflow.inicioMinutos}-${overflow.coluna}`}
          overflow={overflow}
        />
      ))}
    </div>
  );
}
