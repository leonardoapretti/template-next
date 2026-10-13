import * as React from "react";
import { cn } from "@/lib/utils";
import { pageContainerClassName, pageSurfaceClassName } from "../page-shell";
import { DetalhesSidebarMobile } from "./detalhes-sidebar-mobile";

function PaginaDetalhes({ children }: { children: React.ReactNode }) {
  return (
    <div className={pageSurfaceClassName}>
      <div className={cn(pageContainerClassName, "space-y-4 sm:space-y-5")}>{children}</div>
    </div>
  );
}

function DetalhesHeader({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between"
      {...props}
    >
      {children}
    </header>
  );
}

function DetalhesHeaderIdentidade({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-3 sm:items-center">{children}</div>;
}

function DetalhesHeaderIcone({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-primary/10 text-primary-text sm:size-10">
      {children}
    </div>
  );
}

function DetalhesHeaderConteudo({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

function DetalhesHeaderTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="wrap-break-word text-lg font-semibold tracking-tight sm:text-xl">{children}</h1>
  );
}

function DetalhesHeaderSubtitulo({ children }: { children: React.ReactNode }) {
  return <div className="mt-0.5 flex flex-wrap items-center gap-1.5">{children}</div>;
}

function DetalhesHeaderStats({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-md border bg-muted/30">{children}</div>
  );
}

function DetalhesHeaderStatsCelula({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-r px-2.5 py-1.5 text-center last:border-r-0 sm:px-4 sm:py-2">
      {children}
    </div>
  );
}

function DetalhesHeaderStatsLabel({ children }: { children: React.ReactNode }) {
  return <p className="truncate text-xs leading-tight text-muted-foreground">{children}</p>;
}

function DetalhesHeaderStatsValor({ children }: { children: React.ReactNode }) {
  return <p className="mt-0.5 truncate text-sm font-semibold sm:text-base">{children}</p>;
}

function DetalhesBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-0">
      {children}
    </div>
  );
}

function DetalhesMain({ children }: { children: React.ReactNode }) {
  return <main className="space-y-6 lg:pr-6">{children}</main>;
}

function DetalhesSidebar({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child, index) => {
      const props = child.props as { sidebarTitle?: unknown; title?: unknown };
      const title =
        typeof props.sidebarTitle === "string"
          ? props.sidebarTitle
          : typeof props.title === "string"
            ? props.title
            : index === 0
              ? "Ações"
              : "Detalhes";

      return { id: child.key ?? `${title}-${index}`, title, content: child };
    });

  return <DetalhesSidebarMobile items={items} />;
}

function DetalhesSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 border-b pb-2.5">
        {icon && <span className="text-primary-text">{icon}</span>}
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function DetalhesField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className={className ? `space-y-0.5 ${className}` : "space-y-0.5"}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function DetalhesInfoCard({
  badge,
  title,
  description,
}: {
  badge?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-start gap-2.5">
        {badge}
        <div className="min-w-0 flex-1 space-y-0.5">
          {title && <p className="text-sm font-medium leading-5">{title}</p>}
          {description && <p className="text-sm leading-5 text-muted-foreground">{description}</p>}
        </div>
      </div>
    </div>
  );
}

function DetalhesListGroup<T>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items?: readonly T[] | null;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2.5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid gap-2.5 md:grid-cols-2">{items.map(renderItem)}</div>
    </div>
  );
}

PaginaDetalhes.Header = DetalhesHeader;
PaginaDetalhes.Body = DetalhesBody;
PaginaDetalhes.Main = DetalhesMain;
PaginaDetalhes.Sidebar = DetalhesSidebar;
PaginaDetalhes.Section = DetalhesSection;
PaginaDetalhes.Field = DetalhesField;
PaginaDetalhes.InfoCard = DetalhesInfoCard;
PaginaDetalhes.ListGroup = DetalhesListGroup;

DetalhesHeader.Identidade = DetalhesHeaderIdentidade;
DetalhesHeader.Icone = DetalhesHeaderIcone;
DetalhesHeader.Conteudo = DetalhesHeaderConteudo;
DetalhesHeader.Titulo = DetalhesHeaderTitulo;
DetalhesHeader.Subtitulo = DetalhesHeaderSubtitulo;
DetalhesHeader.Stats = DetalhesHeaderStats;
DetalhesHeader.StatsCelula = DetalhesHeaderStatsCelula;
DetalhesHeader.StatsLabel = DetalhesHeaderStatsLabel;
DetalhesHeader.StatsValor = DetalhesHeaderStatsValor;

export {
  DetalhesBody,
  DetalhesField,
  DetalhesHeader,
  DetalhesHeaderConteudo,
  DetalhesHeaderIcone,
  DetalhesHeaderIdentidade,
  DetalhesHeaderStats,
  DetalhesHeaderStatsCelula,
  DetalhesHeaderStatsLabel,
  DetalhesHeaderStatsValor,
  DetalhesHeaderSubtitulo,
  DetalhesHeaderTitulo,
  DetalhesInfoCard,
  DetalhesListGroup,
  DetalhesMain,
  DetalhesSection,
  DetalhesSidebar,
  PaginaDetalhes,
};
