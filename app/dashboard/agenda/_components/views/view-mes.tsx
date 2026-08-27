/** biome-ignore-all lint/suspicious/noArrayIndexKey: dias da grade do mês não têm chave estável melhor */
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { DIAS_SEMANA_ABREV, getDiasDoMes, proximoHorarioPadrao } from "@/lib/utils/data";
import { CelulaDia } from "../celula-exibicao";
import { LoadingBar } from "../chip-ocorrencia";
import { janelaDoMes } from "../engine/agenda-janela";
import { chaveData } from "../engine/chave-data";
import { montarDraftDetalhesEvento } from "../engine/evento-dialog-draft";
import { useAgendamentos } from "../engine/useAgendamentos";

export function ViewMes() {
  const searchParams = useSearchParams();
  const eventoAbertoRef = useRef<string | null>(null);
  const { selectedDate, setSelectedDate, abrirNovoEvento, abrirDetalhesEvento, abrirEditarEvento } =
    useAgenda();
  const ano = selectedDate.getFullYear();
  const mes = selectedDate.getMonth();
  const dias = getDiasDoMes(ano, mes);

  const janela = janelaDoMes(selectedDate);
  const { ocorrencias, porData, isFetching } = useAgendamentos(janela);
  const eventoIdParam = searchParams.get("eventoId");
  const dataParam = searchParams.get("data");
  const modoParam = searchParams.get("modo");
  const ocorrenciasPorChaveEvento = useMemo(() => {
    const porEventoData = new Map<string, (typeof ocorrencias)[number]>();
    const porEvento = new Map<string, (typeof ocorrencias)[number]>();

    for (const ocorrencia of ocorrencias) {
      porEventoData.set(`${ocorrencia.eventoId}:${ocorrencia.data}`, ocorrencia);

      if (!porEvento.has(ocorrencia.eventoId)) {
        porEvento.set(ocorrencia.eventoId, ocorrencia);
      }
    }

    return { porEvento, porEventoData };
  }, [ocorrencias]);

  useEffect(() => {
    const chaveEvento = eventoIdParam ? `${eventoIdParam}:${dataParam ?? ""}` : null;

    if (!eventoIdParam || eventoAbertoRef.current === chaveEvento) {
      return;
    }

    const ocorrencia =
      ocorrenciasPorChaveEvento.porEventoData.get(`${eventoIdParam}:${dataParam ?? ""}`) ??
      ocorrenciasPorChaveEvento.porEvento.get(eventoIdParam);

    if (!ocorrencia) {
      return;
    }

    const draft = montarDraftDetalhesEvento(ocorrencia);

    eventoAbertoRef.current = chaveEvento;
    if (modoParam === "editar") {
      abrirEditarEvento({ ...draft, modo: "editar" });
      return;
    }

    abrirDetalhesEvento(draft);
  }, [
    abrirDetalhesEvento,
    abrirEditarEvento,
    dataParam,
    eventoIdParam,
    modoParam,
    ocorrenciasPorChaveEvento,
  ]);

  return (
    <div className="flex h-full flex-1 select-none flex-col">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 border-b">
        {DIAS_SEMANA_ABREV.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            <span className="hidden sm:inline">{dia}</span>
            <span className="sm:hidden">{dia[0]}</span>
          </div>
        ))}
      </div>

      <LoadingBar visible={isFetching} />

      {/* Grade de dias */}
      <div className="grid flex-1 grid-cols-7" style={{ gridAutoRows: "1fr" }}>
        {dias.map((dia, i) => {
          const isSelecionado =
            dia.date.getDate() === selectedDate.getDate() &&
            dia.date.getMonth() === selectedDate.getMonth() &&
            dia.date.getFullYear() === selectedDate.getFullYear();

          return (
            <CelulaDia
              key={i}
              ocorrencias={porData.get(chaveData(dia.date)) ?? []}
              isHoje={dia.isHoje}
              isSelecionado={isSelecionado}
              mesAtual={dia.mesAtual}
              numeroDia={dia.date.getDate()}
              onClick={() => {
                setSelectedDate(new Date(dia.date));
                const horaInicio = proximoHorarioPadrao();
                abrirNovoEvento({
                  data: chaveData(dia.date),
                  horaInicio,
                });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
