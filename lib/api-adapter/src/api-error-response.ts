// api-error-response.ts
/**
 * Classe padronizada para representar erros da API.
 * Padrão RFC 7807
 */
export class ApiError {
  private _type: string;
  private _title: string;
  private _status: number;
  private _detail: string;
  private _instance: string;
  private _messages: string[];

  constructor(
    messages: string[],
    type = "about:blank",
    title = "Error",
    status = 0,
    detail = "",
    instance = "",
  ) {
    this._type = type;
    this._title = title;
    this._status = status;
    this._detail = detail;
    this._instance = instance;
    this._messages = messages;
  }

  get type() {
    return this._type;
  }

  get title() {
    return this._title;
  }

  get status() {
    return this._status;
  }

  get detail() {
    return this._detail;
  }

  get instance() {
    return this._instance;
  }

  get messages() {
    return this._messages;
  }
}
