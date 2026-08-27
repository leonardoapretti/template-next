"use client";

import { useEffect, useRef } from "react";
import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { DIAS_SEMANA_ABREV, getDiasDaSemana } from "@/lib/utils/data";
import { cn } from "@/lib/utils/tailwind";
import { LoadingBar } from "../chip-ocorrencia";
import { janelaDaSemana } from "../engine/agenda-janela";
import { chaveData } from "../engine/chave-data";
import { calcularScrollInicialPx } from "../engine/layout-eventos-timeline";
import { useAgendamentos } from "../engine/useAgendamentos";
import { TimelineColunaDia } from "../timeline-coluna-dia";
import { TimelineEixoHoras } from "../timeline-eixo-horas";

export function ViewSemana() {
  const { selectedDate, setSelectedDate, abrirNovoEvento } = useAgenda();
  const dias = getDiasDaSemana(selectedDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  const janela = janelaDaSemana(selectedDate);
  const { porData, isFetching } = useAgendamentos(janela);
  const semanaTemHoje = dias.some((dia) => dia.isHoje);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: calcularScrollInicialPx(semanaTemHoje) });
  }, [semanaTemHoje]);

  return (
    <div className="flex h-full flex-1 select-none flex-col overflow-hidden">
      {/* Cabeçalho fixo */}
      <div className="flex shrink-0 border-b">
        <div className="w-12 shrink-0 border-r sm:w-16" />
        {dias.map((dia) => {
          const isSelecionado =
            dia.date.getDate() === selectedDate.getDate() &&
            dia.date.getMonth() === selectedDate.getMonth() &&
            dia.date.getFullYear() === selectedDate.getFullYear();

          return (
            <button
              key={dia.date.toISOString()}
              type="button"
              onClick={() => setSelectedDate(new Date(dia.date))}
              className={cn(
                "flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-0.5 border-r py-2 transition-colors",
                "hover:bg-accent/50",
                isSelecionado && "bg-accent",
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                <span className="hidden sm:inline">{DIAS_SEMANA_ABREV[dia.date.getDay()]}</span>
                <span className="sm:hidden">{DIAS_SEMANA_ABREV[dia.date.getDay()][0]}</span>
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm",
                  dia.isHoje && "bg-primary text-primary-foreground",
                  !dia.isHoje && "text-foreground",
                )}
              >
                {dia.date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <LoadingBar visible={isFetching} />

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex">
          <TimelineEixoHoras />
          {dias.map((dia) => (
            <TimelineColunaDia
              key={dia.date.toISOString()}
              className="flex-1"
              ocorrencias={porData.get(chaveData(dia.date)) ?? []}
              isHoje={dia.isHoje}
              onSelectHorario={(horaInicio) => {
                const data = new Date(dia.date);
                setSelectedDate(data);
                abrirNovoEvento({ data: chaveData(data), horaInicio });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
