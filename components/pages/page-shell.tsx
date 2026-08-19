import { cn } from "@/lib/utils";
import Link from "next/link";
import type * as React from "react";

const pageSurfaceClassName =
  "min-h-full w-full min-w-0 overflow-x-clip bg-[radial-gradient(circle_at_top_left,var(--color-primary)/10%,transparent_32rem),linear-gradient(to_bottom,var(--color-background),var(--color-muted)/45%)]";

const pageContainerClassName =
  "mx-auto box-border w-full min-w-0 max-w-7xl overflow-x-clip px-4 py-4 sm:px-6 sm:py-6 lg:px-8";

function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(pageSurfaceClassName, className)}>
      <div className={cn(pageContainerClassName, "space-y-5 sm:space-y-6")}>{children}</div>
    </div>
  );
}

function PageHeader({
  title,
  description,
  action,
  icon,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-2xl border bg-card/90 p-4 shadow-sm backdrop-blur sm:rounded-3xl sm:p-6",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-accent to-primary/30" />

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border bg-primary/10 text-primary shadow-sm sm:size-11">
              {icon}
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <h1 className=" wrap-break-word text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>

            {description && (
              <p className="max-w-2xl  wrap-break-word text-sm leading-5 text-muted-foreground sm:leading-6">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && (
          <div className="flex w-full min-w-0 shrink-0 items-center gap-2 sm:w-auto *:w-full sm:*:w-auto">
            {action}
          </div>
        )}
      </div>

      {children && <div className="mt-4 min-w-0 overflow-x-clip sm:mt-5">{children}</div>}
    </header>
  );
}

function PageSection({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-2xl border bg-card/90 p-4 shadow-sm backdrop-blur sm:p-5",
        className,
      )}
    >
      {(title || description || icon || action) && (
        <div className="mb-5 flex min-w-0 flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}

            <div className="min-w-0">
              {title && (
                <h2 className=" wrap-break-word text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {title}
                </h2>
              )}

              {description && (
                <p className="mt-1  wrap-break-word text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          {action && (
            <div className="flex w-full min-w-0 shrink-0 items-center gap-2 sm:w-auto *:w-full sm:*:w-auto">
              {action}
            </div>
          )}
        </div>
      )}

      <div className="min-w-0 overflow-x-clip">{children}</div>
    </section>
  );
}

function PageGrid({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const columnsClassName = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid w-full min-w-0 gap-4", columnsClassName, className)}>{children}</div>
  );
}

function PageColumns({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid w-full min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PageMain({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid min-w-0 gap-6", className)}>{children}</div>;
}

function PageAside({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <aside className={cn("grid min-w-0 gap-6 xl:sticky xl:top-24 xl:self-start", className)}>
      {children}
    </aside>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  href,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const cardClassName = cn(
    "w-full min-w-0 overflow-hidden rounded-2xl border bg-card/90 p-4 shadow-sm backdrop-blur sm:p-5",
    href && "block transition-colors hover:border-primary/35 hover:bg-card",
    className,
  );

  const content = (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className=" wrap-break-word text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-2  wrap-break-word text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>

        {description && (
          <p className="mt-1  wrap-break-word text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {icon && (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link className={cardClassName} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/35 px-4 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}

      <p className=" wrap-break-word text-sm font-medium text-foreground">{title}</p>

      {description && (
        <p className="mt-1 max-w-md  wrap-break-word text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div className="mt-4 max-w-full">{action}</div>}
    </div>
  );
}

function PageCardLink({
  title,
  description,
  href,
  label,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  href: string;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "block w-full min-w-0 overflow-hidden rounded-2xl border bg-muted/40 p-4 transition-colors hover:border-primary/35 hover:bg-muted/65",
        className,
      )}
      href={href}
    >
      {label && (
        <p className=" wrap-break-word text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      )}

      {title && <p className=" wrap-break-word text-sm font-medium text-foreground">{title}</p>}

      {description && (
        <p className="mt-1 wrap-break-word text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
    </Link>
  );
}

export {
  EmptyState,
  PageAside,
  PageCardLink,
  PageColumns,
  pageContainerClassName,
  PageGrid,
  PageHeader,
  PageMain,
  PageSection,
  PageShell,
  pageSurfaceClassName,
  StatCard,
};
