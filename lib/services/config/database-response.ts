import { createElement, type ReactNode } from "react";
import { DataBaseErrorSection } from "@/components/database-error-section";

type DataBaseErrorInput = {
  code?: string;
  title?: string;
  message: string;
  messages?: string[];
  cause?: unknown;
};

type SerializedDataBaseResponse<T> = {
  success: boolean;
  data: T | null;
  errorMessage: string | null;
  errorCode: string | null;
  timestamp: string;
};

type RenderDataBaseErrorOptions = {
  title?: string;
  description?: string;
  className?: string;
};

export class DataBaseSuccess<T> {
  constructor(private readonly _data: T) {}

  get data(): T {
    return this._data;
  }
}

export class DataBaseError {
  private readonly _code: string;
  private readonly _title: string;
  private readonly _message: string;
  private readonly _messages: string[];
  private readonly _cause: unknown;

  constructor({
    code = "DATABASE_ERROR",
    title = "Erro de banco de dados",
    message,
    messages,
    cause,
  }: DataBaseErrorInput) {
    this._code = code;
    this._title = title;
    this._message = message;
    this._messages = messages ?? [message];
    this._cause = cause;
  }

  get code() {
    return this._code;
  }

  get title() {
    return this._title;
  }

  get message() {
    return this._message;
  }

  get messages() {
    return this._messages;
  }

  get cause() {
    return this._cause;
  }
}

export class DataBaseResponse<T> {
  constructor(
    private readonly _success: boolean,
    private readonly _response: DataBaseSuccess<T> | DataBaseError,
  ) {}

  static success<T>(data: T): DataBaseResponse<T> {
    return new DataBaseResponse(true, new DataBaseSuccess(data));
  }

  static error<T = never>(input: DataBaseErrorInput): DataBaseResponse<T> {
    return new DataBaseResponse<T>(false, new DataBaseError(input));
  }

  static async fromPromise<T>(
    operation: () => Promise<T>,
    options?: { fallbackMessage?: string },
  ): Promise<DataBaseResponse<T>> {
    try {
      const data = await operation();
      return DataBaseResponse.success(data);
    } catch (error) {
      return DataBaseResponse.error(mapDataBaseError(error, options?.fallbackMessage));
    }
  }

  get success() {
    return this._success;
  }

  get response() {
    return this._response;
  }

  get data(): T {
    return this.getValidData();
  }

  get error(): DataBaseError | null {
    return this.isError() ? this.response : null;
  }

  isSuccess(): this is DataBaseResponse<T> & { response: DataBaseSuccess<T> } {
    return this.success;
  }

  isError(): this is DataBaseResponse<T> & { response: DataBaseError } {
    return !this.success;
  }

  getValidData(): T {
    if (!this.isSuccess()) {
      throw new Error(this.getErrorMessage());
    }

    return (this.response as DataBaseSuccess<T>).data;
  }

  getRequiredData(): T {
    return this.getValidData();
  }

  getErrorTitle(): string {
    if (this.isSuccess()) return "";
    return (this.response as DataBaseError).title;
  }

  getErrorMessage(): string {
    if (this.isSuccess()) return "";
    return (this.response as DataBaseError).message;
  }

  getErrorCode(): string | null {
    if (this.isSuccess()) return null;
    return (this.response as DataBaseError).code;
  }

  renderErrors(options?: RenderDataBaseErrorOptions): ReactNode {
    if (this.isSuccess()) return null;

    return createElement(DataBaseErrorSection, {
      ...options,
      errorCode: this.getErrorCode(),
    });
  }

  serialize<E extends Record<string, unknown> = Record<string, never>>(
    extras?: E,
  ): SerializedDataBaseResponse<T> & E {
    return {
      success: this.success,
      data: this.isSuccess() ? this.getValidData() : null,
      errorMessage: this.isError() ? this.getErrorMessage() : null,
      errorCode: this.getErrorCode(),
      timestamp: new Date().toISOString(),
      ...extras,
    } as SerializedDataBaseResponse<T> & E;
  }
}

function mapDataBaseError(error: unknown, fallbackMessage?: string): DataBaseErrorInput {
  const code = getErrorCode(error);

  if (code === "P2002") {
    return {
      code,
      title: "Registro duplicado",
      message: "Já existe um registro com os dados informados.",
      cause: error,
    };
  }

  if (code === "P2025") {
    return {
      code,
      title: "Registro não encontrado",
      message: "O registro solicitado não foi encontrado.",
      cause: error,
    };
  }

  return {
    code: code ?? "DATABASE_ERROR",
    message: getErrorMessage(error, fallbackMessage),
    cause: error,
  };
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }

  return null;
}

function getErrorMessage(error: unknown, fallbackMessage?: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage ?? "Não foi possível concluir a operação no banco de dados.";
}
