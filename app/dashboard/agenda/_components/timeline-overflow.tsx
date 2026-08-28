"use client";

import { useState } from "react";
import { useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog-drawer";
import { cn } from "@/lib/utils/tailwind";
import { montarDraftDetalhesEvento } from "./engine/evento-dialog-draft";
import {
  ALTURA_HORA_PX,
  GUTTER_CRIACAO_PX,
  type OverflowPosicionado,
} from "./engine/layout-eventos-timeline";
import { corEvento, rotuloEvento } from "./timeline-estilo";

const GAP_ENTRE_COLUNAS_PX = 2;

interface TimelineOverflowProps {
  overflow: OverflowPosicionado;
}

export function TimelineOverflow({ overflow }: TimelineOverflowProps) {
  const { abrirDetalhesEvento } = useAgenda();
  const [open, setOpen] = useState(false);
  const { ocorrencias, inicioMinutos, fimMinutos, coluna, totalColunas } = overflow;

  const top = (inicioMinutos / 60) * ALTURA_HORA_PX;
  const altura = ((fimMinutos - inicioMinutos) / 60) * ALTURA_HORA_PX;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "absolute z-10 flex cursor-pointer items-center justify-center rounded-md border border-dashed",
              "bg-muted/70 text-[10px] font-medium text-muted-foreground hover:bg-muted",
            )}
            style={{
              top,
              height: Math.max(altura, 18),
              left: `calc(${(coluna / totalColunas) * 100}% + ${GAP_ENTRE_COLUNAS_PX / 2}px)`,
              width: `calc(${100 / totalColunas}% - ${GAP_ENTRE_COLUNAS_PX + GUTTER_CRIACAO_PX}px)`,
            }}
          >
            +{ocorrencias.length}
          </button>
        }
      />

      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mais {ocorrencias.length} eventos</DialogTitle>
          <DialogDescription>Toque em um evento para ver os detalhes.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          {ocorrencias.map((oc) => (
            <button
              key={oc.id}
              type="button"
              onClick={() => {
                setOpen(false);
                abrirDetalhesEvento(montarDraftDetalhesEvento(oc));
              }}
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-xs transition-opacity hover:opacity-90",
                corEvento(oc),
              )}
            >
              <span className="block truncate font-medium">{rotuloEvento(oc)}</span>
              <span className="block truncate tabular-nums opacity-90">
                {oc.horaInicio} – {oc.horaFim}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
