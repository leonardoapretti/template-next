import { ApiError } from './api-error-response';
import { ApiResponse } from './api-response';
import { ApiSuccess } from './api-success-response';
import type { ResponseMetadata } from './response-metadata';
import type { ApiErrorBody, HttpRequestConfig } from './types';

/**
 * Concatena query params de forma segura.
 */
export const buildUrlWithParams = (
  baseUrl: string,
  params?: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    [key: string]: unknown;
  }
): string => {
  let url = baseUrl;

  const addQueryParam = (key: string, value: unknown) => {
    if (value !== undefined && value !== null) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    }
  };

  // --- path params ---
  if (params?.path) {
    for (const [key, value] of Object.entries(params.path)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
  }

  // --- fallback: junta query + resto das chaves ---
  const allQueryParams: Record<string, unknown> = { ...(params?.query ?? {}) };
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'path' && key !== 'query') {
        allQueryParams[key] = value;
      }
    }
  }

  for (const [key, value] of Object.entries(allQueryParams)) {
    addQueryParam(key, value);
  }

  return url;
};

/**
 * Constrói headers; adiciona Authorization somente quando privado e há token.
 * Também mescla com headers vindos do RequestInit (options.headers), priorizando os de options.
 */
export const buildHeaders = (
  base?: Record<string, string>,
  optionsHeaders?: HeadersInit,
  token?: string | null,
  isPublic?: boolean
): HeadersInit => {
  // Normaliza HeadersInit de options para Record<string, string>
  const normalizedOptionsHeaders: Record<string, string> = {};
  if (optionsHeaders instanceof Headers) {
    optionsHeaders.forEach((v, k) => {
      normalizedOptionsHeaders[k] = v;
    });
  } else if (Array.isArray(optionsHeaders)) {
    for (const [k, v] of optionsHeaders) {
      normalizedOptionsHeaders[k] = v;
    }
  } else if (optionsHeaders) {
    Object.assign(normalizedOptionsHeaders, optionsHeaders);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(base ?? {}),
    ...normalizedOptionsHeaders,
  };

  if (!isPublic && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Define se aplica cache automático (force-cache) baseado no método.
 */
export const shouldUseCache = (method: string): boolean => {
  const cachable = ['GET', 'HEAD', 'OPTIONS'];
  return cachable.includes(method.toUpperCase());
};

/**
 * Tenta parsear JSON do response quando o content-type for JSON.
 * Retorna null caso não seja JSON ou falhe o parse.
 */
export const parseJsonSafe = async (
  response: Response
): Promise<Record<string, unknown> | { rawText: string } | null> => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as Record<string, unknown>;
    }
    // Se não for JSON, tenta pegar texto cru
    const text = await response.text();
    return { rawText: text };
  } catch {
    // Ignora parse error
  }
  return null;
};

/**
 * Remove Content-Type do objeto de headers sem usar delete
 */
const removeContentType = (headers: HeadersInit): HeadersInit => {
  if (
    typeof headers === 'object' &&
    !Array.isArray(headers) &&
    !(headers instanceof Headers)
  ) {
    const { 'Content-Type': _, ...cleanHeaders } = headers as Record<
      string,
      string
    >;
    return cleanHeaders;
  }
  return headers;
};

/**
 * Extrai Content-Type dos headers (helper)
 */
const getContentTypeFromHeaders = (headers: HeadersInit): string | null => {
  if (headers instanceof Headers) {
    return headers.get('Content-Type');
  }

  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === 'content-type');
    return found ? found[1] : null;
  }

  if (typeof headers === 'object') {
    const record = headers as Record<string, string>;
    return record['Content-Type'] || record['content-type'] || null;
  }

  return null;
};

/**
 * Prepara headers e body para requisição
 */
export const prepareRequest = (
  requestConfig: HttpRequestConfig,
  init: RequestInit | undefined,
  token: string | null,
  isPublic: boolean
): { headers: HeadersInit; body: BodyInit | undefined } => {
  const isFormData = requestConfig.data instanceof FormData;

  if (isFormData) {
    const { 'Content-Type': _, ...baseHeaders } = requestConfig.headers ?? {};
    const builtHeaders = buildHeaders(
      baseHeaders,
      init?.headers,
      token,
      isPublic
    );

    return {
      headers: removeContentType(builtHeaders),
      body: requestConfig.data as BodyInit,
    };
  }

  // Constrói os headers primeiro
  const headers = buildHeaders(
    requestConfig.headers,
    init?.headers,
    token,
    isPublic
  );

  // Verifica se é application/x-www-form-urlencoded
  const contentType = getContentTypeFromHeaders(headers);
  const isUrlEncoded = contentType === 'application/x-www-form-urlencoded';

  if (isUrlEncoded && requestConfig.data instanceof URLSearchParams) {
    // URLSearchParams ---
    return {
      headers,
      body: requestConfig.data, // passa direto
    };
  }

  if (isUrlEncoded && typeof requestConfig.data === 'string') {
    // Se for URL encoded e data for string, passa direto sem JSON.stringify
    return {
      headers,
      body: requestConfig.data,
    };
  }

  return {
    headers,
    body: requestConfig.data ? JSON.stringify(requestConfig.data) : undefined,
  };
};

/**
 * Processa resposta de erro HTTP
 */

export const handleErrorResponse = async <T>(
  response: Response,
  responseMetadata: ResponseMetadata
): Promise<ApiResponse<T>> => {
  const body = await parseJsonSafe(response);

  // Garante que é um objeto plano (não rawText, não null)
  const isRfc7807 =
    body && !('rawText' in body) && ('title' in body || 'messages' in body);

  if (isRfc7807) {
    const err = body as ApiErrorBody;

    return new ApiResponse(
      false,
      response.status,
      new ApiError(
        Array.from(err.messages ?? []),
        err.type,
        err.title,
        err.status ?? response.status,
        err.detail,
        err.instance
      ),
      responseMetadata
    );
  }

  // Fallback: backend retornou algo fora do padrão
  const fallbackMessage =
    response.status === 401 || response.status === 403
      ? 'Não autorizado. Faça login para continuar.'
      : `Erro ${response.status}: ${response.statusText}`;

  return new ApiResponse(
    false,
    response.status,
    new ApiError([fallbackMessage]),
    responseMetadata
  );
};

/**
 * Processa resposta de sucesso HTTP
 */
export const handleSuccessResponse = async <T>(
  response: Response,
  responseMetadata: ResponseMetadata,
  responseType?: string
): Promise<ApiResponse<T>> => {
  if (responseType === 'blob') {
    const blobData = await response.blob();
    return new ApiResponse(
      true,
      response.status,
      new ApiSuccess<T>(blobData as T),
      responseMetadata
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const jsonData = await response.json();
    return new ApiResponse(
      true,
      response.status,
      new ApiSuccess<T>(jsonData as T),
      responseMetadata
    );
  }

  const text = await response.text();
  return new ApiResponse(
    true,
    response.status,
    new ApiSuccess<T>(text as unknown as T),
    responseMetadata
  );
};
