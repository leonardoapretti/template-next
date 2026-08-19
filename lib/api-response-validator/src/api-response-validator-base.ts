import { ApiResponse } from "@/lib/api-adapter/src";

export type CustomValidation<T = unknown> = {
  validator: (data: T) => boolean;
  errorMessage: string;
};

export class ApiResponseValidatorBase {
  protected readonly responseMap = new Map<string, ApiResponse<unknown>>();
  protected readonly customValidationsMap = new Map<
    string,
    CustomValidation<unknown>[]
  >();
  protected readonly httpValidationsMap = new Map<
    string,
    Record<number, string>
  >();

  constructor(responses?: Record<string, ApiResponse<unknown>>) {
    if (responses) {
      for (const [key, response] of Object.entries(responses)) {
        this.responseMap.set(key, response);
      }
    }
  }

  addCustomValidation<T>(
    key: string,
    validator: (data: T) => boolean,
    errorMessage: string
  ): void {
    const newValidation = {
      validator: validator as (data: unknown) => boolean,
      errorMessage,
    };
    const existingValidations = this.customValidationsMap.get(key) || [];
    existingValidations.push(newValidation);
    this.customValidationsMap.set(key, existingValidations);
  }

  addHttpValidation(key: string, messages: Record<number, string>): void {
    this.httpValidationsMap.set(key, messages);
  }

  /**
   * Exige que um determinado atributo exista em uma resposta específica.
   * Caso não exista, registra automaticamente um erro no mapa de validações.
   */
  requireAttribute<T extends object, K extends keyof T>(
    key: string,
    response: ApiResponse<T>,
    attribute: K,
    errorMessage?: string
  ): response is ApiResponse<T & Record<K, NonNullable<T[K]>>> {
    const data = response.getValidData();

    const exists =
      data != null &&
      attribute in data &&
      data[attribute] !== undefined &&
      data[attribute] !== null;

    if (!exists) {
      const message =
        errorMessage ??
        `O atributo "${String(attribute)}" está ausente na resposta "${key}".`;
      const existing = this.customValidationsMap.get(key) || [];
      existing.push({
        validator: () => false,
        errorMessage: message,
      });
      this.customValidationsMap.set(key, existing);
    }

    return exists;
  }

  getErrorMessages(
    keys: string | string[],
    fallbackErrorMessage?: string
  ): string[] {
    const allErrors = new Set<string>();
    for (const key of this.normalizeKeys(keys)) {
      const response = this.responseMap.get(key);
      if (!response) {
        allErrors.add(
          `Configuração de resposta não encontrada para a chave: "${key}"`
        );
        continue;
      }
      if (response.isSuccess()) {
        const customErrors = this._getCustomValidationErrors(key, response);
        for (const error of customErrors) {
          allErrors.add(error);
        }
      } else {
        const apiError = this._getApiErrorMessage(
          key,
          response,
          fallbackErrorMessage
        );
        allErrors.add(apiError);
      }
    }
    return Array.from(allErrors);
  }

  addResponse(key: string, response: ApiResponse<unknown>): void {
    this.responseMap.set(key, response);
  }

  /** 🔹 Retorna true se houver qualquer erro nas chaves passadas (ou em todas se não passar nada). */
  hasError(keys?: string | string[], fallbackErrorMessage?: string): boolean {
    const allKeys = keys ?? Array.from(this.responseMap.keys());
    return this.getErrorMessages(allKeys, fallbackErrorMessage).length > 0;
  }

  /** 🔹 Retorna true se todas as chaves estiverem válidas (sem erros). */
  isValid(keys?: string | string[], fallbackErrorMessage?: string): boolean {
    return !this.hasError(keys, fallbackErrorMessage);
  }

  /** 🔹 Retorna todos os erros de todas as respostas do validador. */
  getAllErrors(fallbackErrorMessage?: string): string[] {
    const allKeys = Array.from(this.responseMap.keys());
    return this.getErrorMessages(allKeys, fallbackErrorMessage);
  }

  protected _getApiErrorMessage(
    key: string,
    response: ApiResponse<unknown>,
    fallbackErrorMessage?: string
  ): string {
    const httpMessages = this.httpValidationsMap.get(key);
    const { status } = response;

    if (httpMessages?.[status]) {
      return `${httpMessages[status]}`;
    }
    if (fallbackErrorMessage) {
      return `${fallbackErrorMessage}`;
    }

    const responseError = response.getErrorMessage();
    return `${responseError ?? 'Ocorreu um erro inesperado.'}`;
  }

  protected _getCustomValidationErrors(
    key: string,
    response: ApiResponse<unknown>
  ): string[] {
    const validationErrors: string[] = [];
    const customValidations = this.customValidationsMap.get(key);
    if (customValidations) {
      const data = response.getValidData();
      for (const validation of customValidations) {
        if (!validation.validator(data)) {
          validationErrors.push(validation.errorMessage);
        }
      }
    }
    return validationErrors;
  }

  protected normalizeKeys(keys: string | string[]): string[] {
    return Array.isArray(keys) ? keys : [keys];
  }
}
