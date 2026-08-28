"use client";

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { type AgendaView, useAgenda } from "@/components/sidebar/sidebar-agenda/agenda-context";
import { formatarTituloAgenda } from "@/components/sidebar/sidebar-agenda/utils-agenda";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EventoDialog } from "./evento-dialog";
import { ViewDia } from "./views/view-dia";
import { ViewMes } from "./views/view-mes";
import { ViewSemana } from "./views/view-semana";

export function AgendaClient() {
  const searchParams = useSearchParams();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLockRef = useRef(false);
  const {
    selectedDate,
    view,
    setView,
    navegarAnterior,
    navegarProximo,
    setSelectedDate,
    abrirNovoEvento,
  } = useAgenda();

  const titulo = formatarTituloAgenda(selectedDate, view);
  const dataParam = searchParams.get("data");
  const viewParam = searchParams.get("view");

  useEffect(() => {
    if (!dataParam || !/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) {
      return;
    }

    const [ano, mes, dia] = dataParam.split("-").map(Number);
    setSelectedDate(new Date(ano, mes - 1, dia));
  }, [dataParam, setSelectedDate]);

  useEffect(() => {
    if (viewParam === "mes" || viewParam === "semana" || viewParam === "dia") {
      setView(viewParam);
    }
  }, [viewParam, setView]);

  function navegarPorDirecao(direcao: "anterior" | "proximo") {
    if (direcao === "anterior") {
      navegarAnterior();
      return;
    }

    navegarProximo();
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (view !== "mes" || event.ctrlKey || Math.abs(event.deltaY) < 40 || wheelLockRef.current) {
      return;
    }

    wheelLockRef.current = true;
    navegarPorDirecao(event.deltaY > 0 ? "proximo" : "anterior");
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 450);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];

    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) {
      return;
    }

    navegarPorDirecao(deltaX > 0 ? "anterior" : "proximo");
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2 border-b bg-background px-3 py-2 sm:h-14 sm:flex-row sm:items-center sm:gap-2 sm:px-4 sm:py-0">
        <div className="flex min-w-0 items-center gap-2 sm:contents">
          <h2 className="min-w-0 flex-1 truncate font-semibold sm:order-0">{titulo}</h2>

          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs text-muted-foreground sm:hidden"
            onClick={() => setSelectedDate(new Date())}
          >
            Hoje
          </Button>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <Button variant="ghost" size="icon" onClick={navegarAnterior} aria-label="Anterior">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={navegarProximo} aria-label="Próximo">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setSelectedDate(new Date())}
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto sm:shrink-0">
          <div className="flex items-center gap-1 sm:hidden">
            <Button variant="ghost" size="icon" onClick={navegarAnterior} aria-label="Anterior">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navegarProximo} aria-label="Próximo">
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <ToggleGroup
            value={[view]}
            onValueChange={(values) => {
              const value = values[0];

              if (value) {
                setView(value as AgendaView);
              }
            }}
          >
            <ToggleGroupItem value="mes" aria-label="Mês" className="px-3 text-xs">
              Mês
            </ToggleGroupItem>
            <ToggleGroupItem value="semana" aria-label="Semana" className="px-3 text-xs">
              Semana
            </ToggleGroupItem>
            <ToggleGroupItem value="dia" aria-label="Dia" className="px-3 text-xs">
              Dia
            </ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" size="icon" onClick={() => abrirNovoEvento()}>
            <PlusIcon className="size-4" />
            <span className="sr-only">Novo evento</span>
          </Button>
        </div>
      </div>

      <div
        className="flex flex-1 touch-pan-y flex-col overflow-hidden"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {view === "mes" && <ViewMes />}
        {view === "semana" && <ViewSemana />}
        {view === "dia" && <ViewDia />}
      </div>

      <EventoDialog />
    </div>
  );
}
