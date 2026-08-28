import { HORAS_DIA } from "@/lib/utils/data";
import { ALTURA_HORA_PX } from "./engine/layout-eventos-timeline";

export function TimelineEixoHoras() {
  return (
    <div className="w-12 shrink-0 sm:w-16">
      {HORAS_DIA.map((hora) => (
        <div
          key={hora}
          className="shrink-0 border-r border-b px-1 pt-1.5 text-right text-[10px] leading-none text-muted-foreground sm:px-2 sm:text-xs"
          style={{ height: ALTURA_HORA_PX }}
        >
          {hora}
        </div>
      ))}
    </div>
  );
}
