"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { chaveData } from "@/app/dashboard/agenda/_components/engine/chave-data";
import { adicionarMinutosHorario } from "@/lib/utils/data";

export type AgendaView = "mes" | "semana" | "dia";
export type EventoDialogDraft = {
  modo: "novo" | "editar" | "detalhes";
  eventoId?: string;
  titulo?: string;
  data: string;
  dataFim: string;
  diaTodo: boolean;
  dataOriginal?: string;
  horaInicio?: string;
  horaFim?: string;
  recorrencia?: "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL" | "ANUAL";
  recorrenciaAte?: string;
  observacao?: string;
};

interface AgendaContextValue {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: AgendaView;
  setView: (view: AgendaView) => void;
  navegarAnterior: () => void;
  navegarProximo: () => void;
  eventoDialogDraft: EventoDialogDraft | null;
  abrirNovoEvento: (draft?: Partial<EventoDialogDraft>) => void;
  abrirDetalhesEvento: (draft: EventoDialogDraft) => void;
  abrirEditarEvento: (draft: EventoDialogDraft) => void;
  fecharEventoDialog: () => void;
}

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<AgendaView>("mes");
  const [eventoDialogDraft, setEventoDialogDraft] = useState<EventoDialogDraft | null>(null);

  const navegarAnterior = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (view === "mes") {
        d.setMonth(d.getMonth() - 1);
      } else if (view === "semana") {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  }, [view]);

  const navegarProximo = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (view === "mes") {
        d.setMonth(d.getMonth() + 1);
      } else if (view === "semana") {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  }, [view]);

  const abrirNovoEvento = useCallback(
    (draft?: Partial<EventoDialogDraft>) => {
      const data = draft?.data ?? chaveData(selectedDate);
      const diaTodo = draft?.diaTodo ?? false;
      const horaInicio = diaTodo ? undefined : (draft?.horaInicio ?? "08:00");
      const horaFim = diaTodo
        ? undefined
        : (draft?.horaFim ?? adicionarMinutosHorario(horaInicio ?? "08:00", 60));

      setEventoDialogDraft({
        modo: "novo",
        data,
        dataFim: draft?.dataFim ?? data,
        diaTodo,
        horaInicio,
        horaFim,
      });
    },
    [selectedDate],
  );

  const abrirEditarEvento = useCallback((draft: EventoDialogDraft) => {
    setEventoDialogDraft(draft);
  }, []);

  const abrirDetalhesEvento = useCallback((draft: EventoDialogDraft) => {
    setEventoDialogDraft(draft);
  }, []);

  const fecharEventoDialog = useCallback(() => {
    setEventoDialogDraft(null);
  }, []);

  return (
    <AgendaContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        view,
        setView,
        navegarAnterior,
        navegarProximo,
        eventoDialogDraft,
        abrirNovoEvento,
        abrirDetalhesEvento,
        abrirEditarEvento,
        fecharEventoDialog,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda deve ser usado dentro de AgendaProvider");
  return ctx;
}
