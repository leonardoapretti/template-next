import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/utils";

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
        "flex w-full min-w-0 flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-primary/10 text-primary-text sm:size-10">
            {icon}
          </div>
        )}

        <div className="min-w-0 space-y-1">
          <h1 className="wrap-break-word text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {title}
          </h1>

          {description && (
            <p className="max-w-2xl wrap-break-word text-sm leading-5 text-muted-foreground sm:leading-6">
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

      {children && <div className="min-w-0 basis-full">{children}</div>}
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
    <section className={cn("w-full min-w-0", className)}>
      {(title || description || icon || action) && (
        <div className="mb-4 flex min-w-0 flex-col gap-3 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <span className="mt-0.5 shrink-0 text-primary-text">{icon}</span>}

            <div className="min-w-0">
              {title && (
                <h2 className="wrap-break-word text-sm font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              )}

              {description && (
                <p className="mt-0.5 wrap-break-word text-sm text-muted-foreground">
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
      )}

      <div className="min-w-0">{children}</div>
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
        "grid w-full min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PageMain({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid min-w-0 gap-4", className)}>{children}</div>;
}

function PageAside({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <aside className={cn("grid min-w-0 gap-4 xl:sticky xl:top-24 xl:self-start", className)}>
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
    "w-full min-w-0 overflow-hidden rounded-lg border bg-card p-4",
    href && "block transition-colors hover:border-primary/35 hover:bg-muted/30",
    className,
  );

  const content = (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="wrap-break-word text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-2 wrap-break-word text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>

        {description && (
          <p className="mt-1 wrap-break-word text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-text">
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
        "flex w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/35 px-4 py-8 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-text">
          {icon}
        </div>
      )}

      <p className="wrap-break-word text-sm font-medium text-foreground">{title}</p>

      {description && (
        <p className="mt-1 max-w-md wrap-break-word text-sm text-muted-foreground">{description}</p>
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
  icon,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  href: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-lg border bg-muted/40 p-4 text-left transition-colors hover:border-primary/35 hover:bg-muted/65",
        className,
      )}
      href={href}
    >
      {icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-primary/10 text-primary-text">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {label && (
          <p className="mb-1 wrap-break-word text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        )}

        {title && <p className="wrap-break-word text-sm font-medium text-foreground">{title}</p>}

        {description && (
          <p className="mt-1 wrap-break-word text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}

export {
  EmptyState,
  PageAside,
  PageCardLink,
  PageColumns,
  PageGrid,
  PageHeader,
  PageMain,
  PageSection,
  PageShell,
  pageContainerClassName,
  pageSurfaceClassName,
  StatCard,
};
