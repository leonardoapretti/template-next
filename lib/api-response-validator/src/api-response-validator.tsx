import { AlertTriangle } from "lucide-react";
import type { JSX } from "react";
import { ApiResponseValidatorBase } from "./api-response-validator-base";

// Classe que estende o validador base e adiciona métodos de renderização de erros e conteúdos
export class ApiResponseValidator extends ApiResponseValidatorBase {
  /**
   * Renderiza o conteúdo de sucesso ou mensagens de erro.
   * @param keys - chave(s) para validar
   * @param successContent - JSX ou função que retorna JSX em caso de sucesso
   * @param fallbackErrorMessage - mensagem padrão caso não haja mensagem de erro específica
   */
  renderOrContent(
    keys: string | string[],
    successContent: JSX.Element | (() => JSX.Element),
    fallbackErrorMessage?: string,
  ): JSX.Element {
    // Obtém as mensagens de erro para as chaves informadas
    const errorMessages = this.getErrorMessages(keys, fallbackErrorMessage);

    // Se não houver erros, retorna o conteúdo de sucesso
    if (errorMessages.length === 0) {
      return typeof successContent === "function" ? successContent() : successContent;
    }

    // Se houver erros, renderiza uma caixa de alerta com todos os erros
    return (
      <div className="rounded-lg border p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-semibold">
            {errorMessages.length > 1 ? "Ocorreram os seguintes erros:" : errorMessages[0]}
          </span>
        </div>
        {errorMessages.length > 1 && (
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
            {errorMessages.map((message, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: ignoramos o uso do index pois a lista não será reordenada
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /**
   * Renderiza o conteúdo apenas se todas as propriedades fornecidas forem válidas
   * @param properties - array de valores a validar
   * @param successContent - JSX ou função que retorna JSX em caso de sucesso
   * @param fallbackMessage - mensagem a mostrar se houver falha
   */
  renderIf(
    properties: unknown[],
    successContent: JSX.Element | (() => JSX.Element),
    fallbackMessage: string,
  ): JSX.Element {
    // Função que verifica se um valor é válido
    const isValid = (prop: unknown) => {
      if (prop === null || prop === undefined) {
        return false;
      }
      if (typeof prop === "string" && prop.trim() === "") {
        return false;
      }
      if (Array.isArray(prop) && prop.length === 0) {
        return false;
      }
      return true;
    };

    const allPropertiesAreValid = properties.every(isValid);

    // Se todas forem válidas, retorna o conteúdo de sucesso
    if (allPropertiesAreValid) {
      return typeof successContent === "function" ? successContent() : successContent;
    }

    // Caso contrário, retorna a mensagem de fallback
    return <span className="text-muted-foreground text-sm italic">{fallbackMessage}</span>;
  }

  /**
   * Renderiza todos os erros contidos no validador
   */
  renderErrors(): JSX.Element {
    const allKeys = Array.from(this.responseMap.keys());
    const allErrors = this.getErrorMessages(allKeys);

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
            // biome-ignore lint/suspicious/noArrayIndexKey: lista de erros é estática e não será reordenada
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    );
  }
}
