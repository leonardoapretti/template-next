import { CalendarClock, CalendarX2, Clock, RefreshCw } from "lucide-react";
import type { StatusOcorrencia } from "./engine/agendamento.types";

interface StatusConfig {
  label: string;
  chip: string;
  badge: string;
  icon: React.ReactNode;
}

export const STATUS_CONFIG: Record<StatusOcorrencia, StatusConfig> = {
  confirmado: {
    label: "Confirmado",
    chip: "bg-primary text-white",
    badge: "bg-white text-primary border-primary/20",
    icon: <CalendarClock className="h-3.5 w-3.5" />,
  },
  cancelado: {
    label: "Cancelado",
    chip: "bg-muted text-white line-through",
    badge: "bg-muted text-muted-foreground border-border line-through",
    icon: <CalendarX2 className="h-3.5 w-3.5" />,
  },
  remarcado: {
    label: "Remarcado",
    chip: "bg-yellow-500 text-white",
    badge: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
  },
  alterado: {
    label: "Alterado",
    chip: "bg-blue-500 text-white",
    badge: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};
