"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { DIAS_SEMANA_ABREV } from "@/lib/utils/data";
import { LoadingBar } from "../chip-ocorrencia";
import { janelaDoDia } from "../engine/agenda-janela";
import { chaveData } from "../engine/chave-data";
import { agruparPorData, ehOcorrenciaDeBarra } from "../engine/expandir-recorrencias";
import { calcularScrollInicialPx } from "../engine/layout-eventos-timeline";
import { useAgendamentos } from "../engine/useAgendamentos";
import { FaixaDiaTodo } from "../faixa-dia-todo";
import { TimelineColunaDia } from "../timeline-coluna-dia";
import { TimelineEixoHoras } from "../timeline-eixo-horas";

export function ViewDia() {
  const { selectedDate, abrirNovoEvento } = useAgenda();
  const scrollRef = useRef<HTMLDivElement>(null);

  const janela = janelaDoDia(selectedDate);
  const { ocorrencias, isFetching } = useAgendamentos(janela);
  const isHoje = chaveData(selectedDate) === chaveData(new Date());
  const porDataTimed = useMemo(
    () => agruparPorData(ocorrencias.filter((oc) => !ehOcorrenciaDeBarra(oc))),
    [ocorrencias],
  );
  const ocorrenciasDoDia = porDataTimed.get(chaveData(selectedDate)) ?? [];
  const diaGrade = useMemo(
    () => [{ date: selectedDate, mesAtual: true, isHoje }],
    [selectedDate, isHoje],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: calcularScrollInicialPx(isHoje) });
  }, [isHoje]);

  return (
    <div className="flex h-full flex-1 select-none flex-col overflow-hidden">
      <div className="flex shrink-0 border-b">
        <div className="w-12 shrink-0 border-r sm:w-16" />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {DIAS_SEMANA_ABREV[selectedDate.getDay()]}
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {selectedDate.getDate()}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 border-b">
        <div className="w-12 shrink-0 border-r sm:w-16" />
        <div className="min-w-0 flex-1">
          <FaixaDiaTodo
            dias={diaGrade}
            ocorrencias={ocorrencias}
            onCriarEvento={(date) =>
              abrirNovoEvento({ data: chaveData(date), dataFim: chaveData(date), diaTodo: true })
            }
          />
        </div>
      </div>

      <LoadingBar visible={isFetching} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex">
          <TimelineEixoHoras />
          <TimelineColunaDia
            className="flex-1"
            ocorrencias={ocorrenciasDoDia}
            isHoje={isHoje}
            onSelectHorario={(horaInicio) => {
              abrirNovoEvento({
                data: chaveData(selectedDate),
                horaInicio,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
