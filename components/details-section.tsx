// components/details-section.tsx

import type { ReactNode } from "react";

export function DetailsHeader({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>

      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function DetailsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="border-b pb-2 text-sm font-semibold">{title}</h4>
      {children}
    </section>
  );
}

export function DetailsField({
  label,
  value,
}: {
  label: string;
  value?: string | number | Date | null;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="mt-1 font-medium">{String(value)}</p>
    </div>
  );
}

export function DetailsTextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="mt-1 whitespace-pre-wrap font-medium">{value}</p>
    </div>
  );
}
