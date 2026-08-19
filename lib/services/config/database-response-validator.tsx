import { DataBaseErrorSection } from "@/components/database-error-section";
import { AlertTriangle } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { DataBaseResponseValidatorBase } from "./database-response-validator-base";

type RenderDataBaseResponseValidatorOptions = {
  title?: string;
  description?: string;
  className?: string;
};

export class DataBaseResponseValidator extends DataBaseResponseValidatorBase {
  renderOrContent(
    keys: string | string[],
    successContent: ReactNode | (() => ReactNode),
    fallbackErrorMessage?: string,
  ): JSX.Element {
    const errorMessages = this.getErrorMessages(keys, fallbackErrorMessage);

    if (errorMessages.length === 0) {
      return <>{typeof successContent === "function" ? successContent() : successContent}</>;
    }

    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />

          <span>
            {errorMessages.length > 1 ? "Ocorreram os seguintes erros:" : errorMessages[0]}
          </span>
        </div>

        {errorMessages.length > 1 && (
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
            {errorMessages.map((message, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de erros
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  renderIf(
    properties: unknown[],
    successContent: ReactNode | (() => ReactNode),
    fallbackMessage: string,
  ): JSX.Element {
    const allPropertiesAreValid = properties.every((property) => {
      if (property === null || property === undefined) {
        return false;
      }

      if (typeof property === "string" && property.trim() === "") {
        return false;
      }

      if (Array.isArray(property) && property.length === 0) {
        return false;
      }

      return true;
    });

    if (allPropertiesAreValid) {
      return <>{typeof successContent === "function" ? successContent() : successContent}</>;
    }

    return <span className="text-sm italic text-muted-foreground">{fallbackMessage}</span>;
  }

  renderErrors(options?: RenderDataBaseResponseValidatorOptions): JSX.Element {
    const allErrors = this.getAllErrors();

    if (allErrors.length === 0) {
      return (
        <DataBaseErrorSection
          title={options?.title ?? "Nenhum erro encontrado"}
          description={options?.description ?? "Não existem erros para exibir."}
          className={options?.className}
          errorCode={null}
        />
      );
    }

    return (
      <DataBaseErrorSection
        title={
          options?.title ??
          (allErrors.length > 1
            ? "Foram encontrados os seguintes problemas"
            : "Ocorreu o seguinte problema")
        }
        description={options?.description ?? allErrors.join("\n")}
        className={options?.className}
        errorCode={null}
      />
    );
  }

  renderErrorList(): JSX.Element {
    const allErrors = this.getAllErrors();

    if (allErrors.length === 0) {
      return <div>Não existem erros</div>;
    }

    return (
      <div className="col-span-12 h-full w-full rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-5 w-5" />

          <span>
            {allErrors.length > 1
              ? "Foram encontrados os seguintes problemas:"
              : "Ocorreu o seguinte problema:"}
          </span>
        </div>

        <ul className="mt-2 list-disc space-y-1 pl-8 text-sm">
          {allErrors.map((message, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de erros
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    );
  }
}
