import type { DataBaseResponse } from "./database-response";

export type CustomValidation<T = unknown> = {
  validator: (data: T) => boolean;
  errorMessage: string;
};

export class DataBaseResponseValidatorBase {
  protected readonly responseMap = new Map<string, DataBaseResponse<unknown>>();

  protected readonly customValidationsMap = new Map<string, CustomValidation<unknown>[]>();

  protected readonly errorCodeValidationsMap = new Map<string, Record<string, string>>();

  constructor(responses?: Record<string, DataBaseResponse<unknown>>) {
    if (responses) {
      for (const [key, response] of Object.entries(responses)) {
        this.responseMap.set(key, response);
      }
    }
  }

  addResponse(key: string, response: DataBaseResponse<unknown>): void {
    this.responseMap.set(key, response);
  }

  addCustomValidation<T>(key: string, validator: (data: T) => boolean, errorMessage: string): void {
    const newValidation: CustomValidation<unknown> = {
      validator: validator as (data: unknown) => boolean,
      errorMessage,
    };

    const existingValidations = this.customValidationsMap.get(key) ?? [];

    existingValidations.push(newValidation);

    this.customValidationsMap.set(key, existingValidations);
  }

  addErrorCodeValidation(key: string, messages: Record<string, string>): void {
    this.errorCodeValidationsMap.set(key, messages);
  }

  requireAttribute<T extends object, K extends keyof T>(
    key: string,
    response: DataBaseResponse<T>,
    attribute: K,
    errorMessage?: string,
  ): response is DataBaseResponse<T & Record<K, NonNullable<T[K]>>> {
    if (response.isError()) {
      return false;
    }

    const data = response.getValidData();

    const exists =
      data != null &&
      attribute in data &&
      data[attribute] !== undefined &&
      data[attribute] !== null;

    if (!exists) {
      const message =
        errorMessage ?? `O atributo "${String(attribute)}" está ausente na resposta "${key}".`;

      const existingValidations = this.customValidationsMap.get(key) ?? [];

      existingValidations.push({
        validator: () => false,
        errorMessage: message,
      });

      this.customValidationsMap.set(key, existingValidations);
    }

    return exists;
  }

  getErrorMessages(keys: string | string[], fallbackErrorMessage?: string): string[] {
    const allErrors = new Set<string>();

    for (const key of this.normalizeKeys(keys)) {
      const response = this.responseMap.get(key);

      if (!response) {
        allErrors.add(`Configuração de resposta não encontrada para a chave: "${key}".`);
        continue;
      }

      if (response.isSuccess()) {
        const customErrors = this.getCustomValidationErrors(key, response);

        for (const error of customErrors) {
          allErrors.add(error);
        }

        continue;
      }

      allErrors.add(this.getDataBaseErrorMessage(key, response, fallbackErrorMessage));
    }

    return Array.from(allErrors);
  }

  hasError(keys?: string | string[], fallbackErrorMessage?: string): boolean {
    const allKeys = keys ?? Array.from(this.responseMap.keys());

    return this.getErrorMessages(allKeys, fallbackErrorMessage).length > 0;
  }

  isValid(keys?: string | string[], fallbackErrorMessage?: string): boolean {
    return !this.hasError(keys, fallbackErrorMessage);
  }

  getAllErrors(fallbackErrorMessage?: string): string[] {
    return this.getErrorMessages(Array.from(this.responseMap.keys()), fallbackErrorMessage);
  }

  protected getDataBaseErrorMessage(
    key: string,
    response: DataBaseResponse<unknown>,
    fallbackErrorMessage?: string,
  ): string {
    const errorCodeMessages = this.errorCodeValidationsMap.get(key);
    const errorCode = response.getErrorCode();

    if (errorCode && errorCodeMessages?.[errorCode]) {
      return errorCodeMessages[errorCode];
    }

    if (fallbackErrorMessage) {
      return fallbackErrorMessage;
    }

    return response.getErrorMessage() || "Ocorreu um erro inesperado.";
  }

  protected getCustomValidationErrors(key: string, response: DataBaseResponse<unknown>): string[] {
    const validationErrors: string[] = [];
    const customValidations = this.customValidationsMap.get(key);

    if (!customValidations) {
      return validationErrors;
    }

    const data = response.getValidData();

    for (const validation of customValidations) {
      if (!validation.validator(data)) {
        validationErrors.push(validation.errorMessage);
      }
    }

    return validationErrors;
  }

  protected normalizeKeys(keys: string | string[]): string[] {
    return Array.isArray(keys) ? keys : [keys];
  }
}
