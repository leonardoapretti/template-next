"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { type BreadcrumbLabel, useBreadcrumbLabels } from "./breadcrumb-labels-context";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  usuarios: "Usuários",
  configuracoes: "Configurações",
  financeiro: "Financeiro",
  pacientes: "Pacientes",
  prontuario: "Prontuário",
  avaliacoes: "Avaliações",
  evolucoes: "Evoluções",
  agenda: "Agenda",
  paciente: "Paciente",
  documentos: "Documentos",
  avaliacao: "Avaliação",
  evolucao: "Evolução",
  faturamento: "Faturamento",
  imprimir: "Imprimir",
  editar: "Editar",
  novo: "Novo",
  nova: "Nova",
  criar: "Criar",
};

const TRACO_REGEX = /[-_]/;
function segmentToLabel(segment: string): string {
  if (labels[segment]) {
    return labels[segment];
  }

  return segment
    .split(TRACO_REGEX)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeLabel(value?: BreadcrumbLabel): {
  label: string;
  clickable: boolean;
} | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return {
      label: value,
      clickable: true,
    };
  }

  return {
    label: value.label,
    clickable: value.clickable ?? true,
  };
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isMobile = useIsMobile();
  const { labels: dynamicLabels } = useBreadcrumbLabels();

  const maxVisible = isMobile ? 2 : 5;

  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment, index) => {
    const normalizedLabel = normalizeLabel(dynamicLabels[segment]);

    return {
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: normalizedLabel?.label ?? segmentToLabel(segment),
      clickable: normalizedLabel?.clickable ?? true,
      isLast: index === segments.length - 1,
    };
  });

  const hasCollapsed = items.length > maxVisible;

  const collapsedItems = hasCollapsed ? items.slice(0, items.length - maxVisible) : [];

  const visibleItems = hasCollapsed ? items.slice(items.length - maxVisible) : items;

  return (
    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {hasCollapsed && (
          <>
            <BreadcrumbItem>
              <DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
                <DropdownMenuTrigger
                  aria-label="Ver níveis anteriores"
                  className="flex items-center gap-1 rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start">
                  {collapsedItems.map((item) =>
                    item.clickable ? (
                      <DropdownMenuItem key={item.href}>
                        <Link href={item.href}>{item.label}</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem disabled key={item.href}>
                        {item.label}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>

            <BreadcrumbSeparator />
          </>
        )}

        {visibleItems.map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbItem className="min-w-0">
              {item.isLast && (
                <BreadcrumbPage className="truncate" title={item.label}>
                  {item.label}
                </BreadcrumbPage>
              )}
              {!item.isLast && item.clickable && (
                <BreadcrumbLink
                  className="max-w-24 truncate sm:max-w-40 md:max-w-56"
                  render={<Link href={item.href}>{item.label}</Link>}
                  title={item.label}
                ></BreadcrumbLink>
              )}
              {!(item.isLast || item.clickable) && (
                <span
                  className="max-w-24 truncate text-muted-foreground sm:max-w-40 md:max-w-56"
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </BreadcrumbItem>

            {!item.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
