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
  responseType?: "json" | "text" | "blob";
}
/**
 * Lê o corpo de uma resposta de erro fora do padrão RFC 7807 (cada API tem o seu)
 * e devolve a mensagem para o usuário, ou null para cair no padrão do adapter.
 * `corpo` é o JSON já lido ou `{ rawText }` quando a resposta não é JSON.
 */
export type ParseErrorBody = (status: number, corpo: unknown) => string | null;

export interface ApiAdapterClientConfig {
  baseUrl?: string;
  getToken?: () => Promise<string | null>;
  logger?: ApiAdapterLogger; // opcional
  /** Cabeçalhos enviados em toda requisição deste client (ex.: Accept, User-Agent). */
  defaultHeaders?: Record<string, string>;
  /** Como ler o erro das APIs que não seguem o RFC 7807. */
  parseErrorBody?: ParseErrorBody;
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
  parseErrorBody?: ParseErrorBody;
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
