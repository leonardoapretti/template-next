"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-drawer";
import { cn } from "@/lib/utils/tailwind";
import type { OcorrenciaAgendamento } from "./engine/agendamento.types";
import { corEvento, rotuloEvento } from "./timeline-estilo";

function formatarDataCompleta(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${data}T00:00:00`));
}

function formatarHorarioOcorrencia(oc: OcorrenciaAgendamento) {
  if (oc.diaTodo) return "Dia inteiro";
  if (oc.data !== oc.dataFim) {
    return oc.horaInicio ? `A partir das ${oc.horaInicio}` : "Vários dias";
  }
  return oc.horaInicio && oc.horaFim ? `${oc.horaInicio} – ${oc.horaFim}` : "Dia inteiro";
}

interface DiaDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: string | null;
  ocorrencias: OcorrenciaAgendamento[];
  onSelecionarEvento: (oc: OcorrenciaAgendamento) => void;
  onNovoEvento: () => void;
}

export function DiaDetalheDialog({
  open,
  onOpenChange,
  data,
  ocorrencias,
  onSelecionarEvento,
  onNovoEvento,
}: DiaDetalheDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{data ? formatarDataCompleta(data) : ""}</DialogTitle>
          <DialogDescription>
            {ocorrencias.length > 0
              ? "Toque em um evento para ver os detalhes."
              : "Nenhum evento nesse dia."}
          </DialogDescription>
        </DialogHeader>

        {ocorrencias.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {ocorrencias.map((oc) => (
              <button
                key={oc.id}
                type="button"
                onClick={() => onSelecionarEvento(oc)}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className={cn("size-2.5 shrink-0 rounded-full", corEvento(oc))} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{rotuloEvento(oc)}</span>
                  <span className="truncate text-xs text-muted-foreground tabular-nums">
                    {formatarHorarioOcorrencia(oc)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" onClick={onNovoEvento}>
          <PlusIcon className="size-4" />
          Novo evento
        </Button>
      </DialogContent>
    </Dialog>
  );
}
