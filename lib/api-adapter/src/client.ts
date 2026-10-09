import { requestMutator } from "./mutator";
import type {
  AdapterRequestInit,
  ApiAdapterClientConfig,
  HttpRequestConfig,
  MutatorOptions,
} from "./types";

/**
 * Estende o RequestInit nativo adicionando opções específicas do adapter.
 * Assim a assinatura dos métodos fica idêntica à do fetch:
 *   client.get(url, init)
 *   fetch(url, init)
 */

const ESQUEMA_DE_URL = /^[a-z][a-z\d+.-]*:/i;

export class ApiAdapterClient {
  private config: ApiAdapterClientConfig;

  constructor(config: ApiAdapterClientConfig) {
    this.config = config;
  }

  get baseUrl() {
    return this.config.baseUrl;
  }

  request<T>(config: HttpRequestConfig, init?: AdapterRequestInit) {
    // Qualquer esquema (http, blob: de arquivo local...) é uma URL absoluta.
    const url = ESQUEMA_DE_URL.test(config.url)
      ? config.url
      : `${this.config.baseUrl ?? ""}${config.url}`;

    const { params, mutatorOptions, ...fetchInit } = init ?? {};

    const resolvedMutatorOptions: MutatorOptions = {
      getAuthToken: this.config.getToken,
      logger: this.config.logger,
      parseErrorBody: this.config.parseErrorBody,
      ...mutatorOptions,
    };

    return requestMutator<T>(
      {
        ...config,
        url,
        params: params ?? config.params,
        headers: { ...this.config.defaultHeaders, ...config.headers },
      },
      fetchInit,
      resolvedMutatorOptions,
    );
  }

  get<T>(url: string, init?: AdapterRequestInit) {
    return this.request<T>({ url, method: "GET" }, init);
  }

  post<T, B = unknown>(url: string, body?: B, init?: AdapterRequestInit) {
    return this.request<T>({ url, method: "POST", data: body }, init);
  }

  put<T, B = unknown>(url: string, body?: B, init?: AdapterRequestInit) {
    return this.request<T>({ url, method: "PUT", data: body }, init);
  }

  patch<T, B = unknown>(url: string, body?: B, init?: AdapterRequestInit) {
    return this.request<T>({ url, method: "PATCH", data: body }, init);
  }

  delete<T>(url: string, init?: AdapterRequestInit) {
    return this.request<T>({ url, method: "DELETE" }, init);
  }
}
