"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { DIAS_SEMANA_ABREV, getDiasDoMes } from "@/lib/utils/data";
import { LoadingBar } from "../chip-ocorrencia";
import { DiaDetalheDialog } from "../dia-detalhe-dialog";
import { janelaDoMes } from "../engine/agenda-janela";
import type { OcorrenciaAgendamento } from "../engine/agendamento.types";
import { chaveData } from "../engine/chave-data";
import { montarDraftDetalhesEvento } from "../engine/evento-dialog-draft";
import { agruparPorData, ehOcorrenciaDeBarra } from "../engine/expandir-recorrencias";
import { layoutFaixaDias } from "../engine/layout-eventos-mes";
import { useAgendamentos } from "../engine/useAgendamentos";
import { SemanaMes } from "../mes-semana-linha";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

export function ViewMes() {
  const searchParams = useSearchParams();
  const eventoAbertoRef = useRef<string | null>(null);
  const {
    selectedDate,
    setSelectedDate,
    abrirNovoEvento,
    abrirDetalhesEvento,
    abrirEditarEvento,
    diaDetalhe,
    abrirDiaDetalhe,
    fecharDiaDetalhe,
  } = useAgenda();
  const ano = selectedDate.getFullYear();
  const mes = selectedDate.getMonth();
  const dias = getDiasDoMes(ano, mes);
  const semanas = useMemo(() => chunk(dias, 7), [dias]);

  const janela = janelaDoMes(selectedDate);
  const { ocorrencias, isFetching } = useAgendamentos(janela);

  const porDataChips = useMemo(
    () => agruparPorData(ocorrencias.filter((oc) => !ehOcorrenciaDeBarra(oc))),
    [ocorrencias],
  );

  const layoutsPorSemana = useMemo(
    () => semanas.map((semana) => layoutFaixaDias(semana, ocorrencias)),
    [semanas, ocorrencias],
  );

  const ocorrenciasDoDiaDetalhe = useMemo(() => {
    if (!diaDetalhe) return [];

    return ocorrencias
      .filter((oc) => oc.data <= diaDetalhe && oc.dataFim >= diaDetalhe)
      .sort((a, b) => (a.horaInicio ?? "").localeCompare(b.horaInicio ?? ""));
  }, [diaDetalhe, ocorrencias]);

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

      {/* Grade do mês, uma linha por semana */}
      <div className="flex flex-1 flex-col">
        {semanas.map((semana, indice) => (
          <SemanaMes
            key={chaveData(semana[0].date)}
            semana={semana}
            layout={layoutsPorSemana[indice]}
            porDataChips={porDataChips}
            selectedDate={selectedDate}
            onClickDia={(date) => {
              setSelectedDate(date);
              abrirDiaDetalhe(chaveData(date));
            }}
          />
        ))}
      </div>

      <DiaDetalheDialog
        open={diaDetalhe !== null}
        onOpenChange={(open) => !open && fecharDiaDetalhe()}
        data={diaDetalhe}
        ocorrencias={ocorrenciasDoDiaDetalhe}
        onSelecionarEvento={(oc: OcorrenciaAgendamento) => {
          fecharDiaDetalhe();
          abrirDetalhesEvento(montarDraftDetalhesEvento(oc));
        }}
        onNovoEvento={() => {
          const data = diaDetalhe;
          fecharDiaDetalhe();
          if (data) {
            abrirNovoEvento({ data, dataFim: data });
          }
        }}
      />
    </div>
  );
}
