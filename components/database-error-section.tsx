import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";

type DataBaseErrorSectionProps = {
  title?: string;
  description?: string;
  errorCode?: string | null;
  className?: string;
};

export function DataBaseErrorSection({
  title = "Não foi possível carregar os dados",
  description = "Tente novamente em alguns instantes. Se o problema continuar, entre em contato com o suporte.",
  errorCode,
  className,
}: DataBaseErrorSectionProps) {
  return (
    <section
      className={cn(
        "flex min-h-80 w-full items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6",
        className,
      )}
    >
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" aria-hidden />
        </div>

        <h2 className="font-heading text-lg font-medium text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        {errorCode && (
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            Código do erro: {errorCode}
          </p>
        )}
      </div>
    </section>
  );
}
