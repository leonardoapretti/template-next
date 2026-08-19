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

export class ApiAdapterClient {
  private config: ApiAdapterClientConfig;

  constructor(config: ApiAdapterClientConfig) {
    this.config = config;
  }

  get baseUrl() {
    return this.config.baseUrl;
  }

  request<T>(config: HttpRequestConfig, init?: AdapterRequestInit) {
    const url = config.url.startsWith("http") ? config.url : `${this.config.baseUrl}${config.url}`;

    const { params, mutatorOptions, ...fetchInit } = init ?? {};

    const resolvedMutatorOptions: MutatorOptions = {
      getAuthToken: this.config.getToken,
      logger: this.config.logger,
      ...mutatorOptions,
    };

    return requestMutator<T>(
      { ...config, url, params: params ?? config.params },
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
