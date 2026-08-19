import * as React from "react";
import { cn } from "@/lib/utils";
import { pageContainerClassName, pageSurfaceClassName } from "../page-shell";
import { DetalhesSidebarMobile } from "./detalhes-sidebar-mobile";

function PaginaDetalhes({ children }: { children: React.ReactNode }) {
  return (
    <div className={pageSurfaceClassName}>
      <div className={cn(pageContainerClassName, "space-y-6 sm:space-y-8")}>{children}</div>
    </div>
  );
}

function DetalhesHeader({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border bg-card/90 p-4 shadow-sm backdrop-blur sm:rounded-3xl sm:p-6 lg:flex-row lg:items-center lg:justify-between"
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-accent to-primary/40" />
      {children}
    </header>
  );
}

function DetalhesHeaderIdentidade({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-3 sm:items-center sm:gap-4">{children}</div>;
}

function DetalhesHeaderIcone({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border bg-primary/10 text-primary shadow-sm sm:size-12">
      {children}
    </div>
  );
}

function DetalhesHeaderConteudo({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function DetalhesHeaderTitulo({ children }: { children: React.ReactNode }) {
  return <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{children}</h1>;
}

function DetalhesHeaderSubtitulo({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 flex flex-wrap items-center gap-2">{children}</div>;
}

function DetalhesHeaderStats({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-xl border bg-muted/40 shadow-inner sm:rounded-2xl">
      {children}
    </div>
  );
}

function DetalhesHeaderStatsCelula({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-r px-2 py-2 text-center last:border-r-0 sm:px-5 sm:py-3">
      {children}
    </div>
  );
}

function DetalhesHeaderStatsLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="truncate text-[10px] uppercase leading-tight text-muted-foreground sm:text-xs">
      {children}
    </p>
  );
}

function DetalhesHeaderStatsValor({ children }: { children: React.ReactNode }) {
  return <p className="mt-0.5 truncate text-sm font-bold sm:text-lg">{children}</p>;
}

function DetalhesBody({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">{children}</div>;
}

function DetalhesMain({ children }: { children: React.ReactNode }) {
  return <main className="space-y-6">{children}</main>;
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

      return {
        id: child.key ?? `${title}-${index}`,
        title,
        content: child,
      };
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
    <section className="rounded-2xl border bg-card/90 p-5 shadow-sm backdrop-blur">
      <div className="mb-5 flex items-center gap-2 border-b pb-3">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>

      {children}
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
    <div className={className ? `space-y-1 ${className}` : "space-y-1"}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
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
    <div className="rounded-xl border bg-background/60 p-4">
      <div className="flex items-start gap-3">
        {badge}

        <div className="min-w-0 flex-1 space-y-1">
          {title && <p className="text-sm font-medium leading-none">{title}</p>}

          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">{items.map(renderItem)}</div>
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
