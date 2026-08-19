/**
 * Configuração da requisição que o mutator recebe.
 * Evita usar objetos muito genéricos e deixa a intenção clara.
 */
export interface HttpRequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  disableCache?: boolean; // Desabilita cache automático para GET/HEAD/OPTIONS
  responseType?: 'json' | 'text' | 'blob';
}
export interface ApiAdapterClientConfig {
  baseUrl?: string;
  getToken?: () => Promise<string | null>;
  logger?: ApiAdapterLogger; // opcional
}
export interface AdapterRequestInit extends RequestInit {
  /** Query string params: client.get('/users', { params: { page: 1 } }) */
  params?: Record<string, unknown>;
  /** Opções do mutator (autenticação, rota pública, etc.) */
  mutatorOptions?: MutatorOptions;
}

/**
 * Opções adicionais do mutator.
 */
export interface MutatorOptions {
  /** Endpoint público (não envia Authorization) */
  isPublic?: boolean;

  /**
   * Função que retorna o token de autenticação.
   * Cada aplicação deve fornecer isso.
   */
  getAuthToken?: () => Promise<string | null>;
  logger?: ApiAdapterLogger; // opcional
}

/**
 * Interface do logger
 */
export interface ApiAdapterLogger {
  info: (obj: Record<string, unknown>, msg: string) => void;
  error: (obj: Record<string, unknown>, msg: string) => void;
  warn: (obj: Record<string, unknown>, msg: string) => void;
}

/**
 * Interface do retorno esperado do backend em caso de erro
 */
export interface ApiErrorBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  messages?: string[];
}

/**
 * Representa um Blob serializado para transferência server → client.
 * Pode ser incluído em qualquer SerializedApiResponseProps via serializeApiResponse.
 */
export type SerializedBlob = {
  base64: string;
  filename: string;
  mimeType: string;
};

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------

export type SerializedApiResponseProps<T> = {
  success: boolean;
  status: number;
  data: T | null;
  errorMessage: string | null;
  timestamp: string;
};

/**
 * Resultado serializado específico para respostas de download.
 * O campo `data` é omitido (Blob não é transferível como JSON);
 * no lugar, `blob` carrega base64 + filename + mimeType.
 */
export type SerializedBlobResponse = {
  success: boolean;
  status: number;
  errorMessage: string | null;
  timestamp: string;
  blob: SerializedBlob | null;
};
