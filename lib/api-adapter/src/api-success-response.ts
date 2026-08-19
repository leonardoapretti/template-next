/**
 * Classe padronizada para representar sucessos da API.
 * Inclui dados de resposta.
 */
export class ApiSuccess<T> {
  protected _data: T;

  constructor(data: T) {
    this._data = data;
  }

  /**
   * Getter para acessar os dados da resposta.
   */
  get data(): T {
    return this._data;
  }
}
