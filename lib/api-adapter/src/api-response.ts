// api-response.ts
import type { ApiError } from './api-error-response';

import type { ApiSuccess } from './api-success-response';
import type { ResponseMetadata } from './response-metadata';
import type {
  SerializedApiResponseProps,
  SerializedBlob,
  SerializedBlobResponse,
} from './types';

// Regex no escopo superior para melhor performance
const FILENAME_REGEX = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/json': '.json',
  'application/xml': '.xml',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    '.pptx',
};

export class ApiResponse<T> {
  protected _success: boolean;
  protected _status: number;
  protected _response: ApiSuccess<T> | ApiError;
  protected _metadata: ResponseMetadata;

  constructor(
    success: boolean,
    status: number,
    response: ApiSuccess<T> | ApiError,
    metadata: ResponseMetadata
  ) {
    this._success = success;
    this._status = status;
    this._response = response;
    this._metadata = metadata;
  }

  // --- Getters públicos ---
  get success(): boolean {
    return this._success;
  }

  get status(): number {
    return this._status;
  }

  get response(): ApiSuccess<T> | ApiError {
    return this._response;
  }

  get metadata(): ResponseMetadata {
    return this._metadata;
  }

  // --- Type guards ---
  isSuccess(): this is ApiResponse<T> & { response: ApiSuccess<T> } {
    return this.success;
  }

  isError(): this is ApiResponse<T> & { response: ApiError } {
    return !this.success;
  }

  // --- Utility methods ---
  getTraceId(): string | null {
    return this.metadata.headers.get('x-trace-id');
  }

  getErrorTraceMessage(): string {
    const traceId = this.getTraceId();
    return traceId
      ? ` Informe o código de rastreamento a seguir aos administradores do sistema: ${traceId}`
      : '';
  }

  getErrorMessage(): string {
    if (this.isError()) {
      return `${this.response.detail}${this.getErrorTraceMessage()}`;
    }
    return `${this.getErrorTraceMessage()}`;
  }

  getValidData(): T {
    if (!this.isSuccess()) {
      throw new Error(this.getErrorMessage());
    }
    return this.response.data;
  }

  getCreatedId(): string | null {
    const locationHeader = this._metadata.headers.get('location');
    return locationHeader?.split('/').at(-1) ?? null;
  }

  // --- Download Utils ---

  /**
   * Serializa o Blob contido na resposta para um objeto transferível
   * entre Server e Client Components (base64 + filename + mimeType).
   *
   * Deve ser chamado apenas server-side, dentro de Server Actions ou
   * Route Handlers — nunca no browser (usa Buffer, não disponível no client).
   *
   * @param fallbackFilename - Nome usado caso o header Content-Disposition esteja ausente.
   * @throws Error se a resposta for de erro ou se os dados não forem um Blob.
   */
  async serializeBlob(fallbackFilename?: string): Promise<SerializedBlob> {
    if (!this.isSuccess()) {
      throw new Error(this.getErrorMessage());
    }

    const data = this.response.data;

    if (!(data instanceof Blob)) {
      throw new Error('Os dados da resposta não são um arquivo (Blob)');
    }

    const arrayBuffer = await data.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const mimeType = data.type || 'application/octet-stream';
    const extension = this.getExtensionFromContentType(mimeType);

    const contentDisposition =
      this._metadata.headers.get('content-disposition') ?? '';
    const filenameMatch = contentDisposition.match(FILENAME_REGEX);
    const extractedFilename = filenameMatch?.at(1)?.replace(/['"]/g, '').trim();

    const filename =
      extractedFilename ??
      fallbackFilename ??
      `download_${Date.now()}${extension}`;

    return { base64, filename, mimeType };
  }

  /**
   * Obtém a extensão do arquivo baseada no Content-Type.
   */
  getExtensionFromContentType(contentType: string | null): string {
    if (!contentType) {
      return '';
    }
    const baseType = contentType.split(';')[0].trim();
    return MIME_TO_EXT[baseType] || '';
  }

  // -----------------------------------------------------------------------
  // Serialization (server-side)
  // -----------------------------------------------------------------------

  /**
   * Converte a instância para um plain object transferível entre
   * Server e Client Components no Next.js.
   */
  serialize<E extends Record<string, unknown> = Record<string, never>>(
    extras?: E
  ): SerializedApiResponseProps<T> & E {
    const base = {
      success: this.success,
      status: this.status,
      data: this.success ? this.getValidData() : null,
      errorMessage: this.isError() ? this.getErrorMessage() : null,
      timestamp: new Date().toISOString(),
      ...extras,
    };

    // Garante que o objeto é serializável (sem referências circulares, Blobs etc.)
    try {
      return JSON.parse(JSON.stringify(base));
    } catch {
      return {
        success: false,
        status: 500,
        data: null,
        errorMessage: 'Erro interno de serialização',
        timestamp: new Date().toISOString(),
        ...extras,
      } as SerializedApiResponseProps<T> & E;
    }
  }

  /**
   * Serializa uma ApiResponse<Blob> para transferência server → client.
   * Deve ser chamado apenas em Server Actions ou Route Handlers.
   */
  async serializeAsBlob(
    fallbackFilename?: string
  ): Promise<SerializedBlobResponse> {
    if (!this.isSuccess()) {
      return {
        success: false,
        status: this.status,
        errorMessage: this.getErrorMessage(),
        timestamp: new Date().toISOString(),
        blob: null,
      };
    }

    try {
      const blob = await this.serializeBlob(fallbackFilename);
      return {
        success: true,
        status: this.status,
        errorMessage: null,
        timestamp: new Date().toISOString(),
        blob,
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        errorMessage:
          error instanceof Error ? error.message : 'Erro ao serializar arquivo',
        timestamp: new Date().toISOString(),
        blob: null,
      };
    }
  }

  // --- Cache Utils ---
  isCacheHit(): boolean {
    return this._metadata.isCacheHit();
  }

  isCacheMiss(): boolean {
    return this._metadata.isCacheMiss();
  }

  getCacheAge(): number | null {
    return this._metadata.getCacheAge();
  }

  getCacheStatus(): string | null {
    return this._metadata.getCacheStatus();
  }
}
