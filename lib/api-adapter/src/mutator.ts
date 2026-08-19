import { ApiError } from "./api-error-response";
import { ApiResponse } from "./api-response";
import { ResponseMetadata } from "./response-metadata";
import type { HttpRequestConfig, MutatorOptions } from "./types";
import {
  buildUrlWithParams,
  handleErrorResponse,
  handleSuccessResponse,
  prepareRequest,
} from "./utils";

export const requestMutator = async <T>(
  requestConfig: HttpRequestConfig,
  init?: RequestInit,
  mutatorOptions?: MutatorOptions,
): Promise<ApiResponse<T>> => {
  const { isPublic = false, logger } = mutatorOptions ?? {};
  const url = buildUrlWithParams(requestConfig.url, requestConfig.params);
  const method = requestConfig.method;
  const startTime = Date.now();

  let token: string | null = null;
  if (!isPublic && mutatorOptions?.getAuthToken) {
    token = await mutatorOptions.getAuthToken();
  }

  const { headers, body } = prepareRequest(requestConfig, init, token, isPublic);
  const fetchOptions: RequestInit = {
    method,
    headers,
    body,
    signal: requestConfig.signal,
    ...init,
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha de rede ao comunicar com o servidor.";

    logger?.error({ method, url, error: message }, "Erro de rede");

    // Depois
    return new ApiResponse(
      false,
      500,
      new ApiError([message], "about:blank", "Network Error", 500),
      {} as ResponseMetadata,
    );
  }

  const durationMs = Date.now() - startTime;
  const responseMetadata = new ResponseMetadata(response);

  const traceId = response.headers.get("x-trace-id");

  if (!response.ok) {
    logger?.error(
      {
        method,
        url,
        status: response.status,
        durationMs,
        traceId,
        responseMetadata,
      },
      "Erro http",
    );
    return handleErrorResponse<T>(response, responseMetadata);
  }

  logger?.info(
    {
      method,
      url,
      status: response.status,
      durationMs,
      traceId,
      responseMetadata,
    },
    "Sucesso",
  );

  return handleSuccessResponse<T>(response, responseMetadata, requestConfig.responseType);
};
