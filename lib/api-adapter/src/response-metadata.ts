// response-metadata.ts
export class ResponseMetadata {
  protected _status: number;
  protected _statusText: string;
  protected _url: string;
  protected _headers: Headers;
  protected _ok: boolean;
  protected _redirected: boolean;
  protected _type: ResponseType;

  constructor(response: Response) {
    this._status = response.status;
    this._statusText = response.statusText;
    this._url = response.url;
    this._headers = response.headers; // Mantém como Headers
    this._ok = response.ok;
    this._redirected = response.redirected;
    this._type = response.type;
  }

  // --- Getters ---
  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  get url(): string {
    return this._url;
  }

  get headers(): Headers {
    return this._headers;
  }

  get ok(): boolean {
    return this._ok;
  }

  get redirected(): boolean {
    return this._redirected;
  }

  get type(): ResponseType {
    return this._type;
  }

  // --- Utils ---
  isSuccess(): this is ResponseMetadata & { _ok: true } {
    return this._ok && this._status >= 200 && this._status < 300;
  }

  isClientError(): boolean {
    return this._status >= 400 && this._status < 500;
  }

  isServerError(): boolean {
    return this._status >= 500 && this._status < 600;
  }

  isRedirect(): boolean {
    return this._status >= 300 && this._status < 400;
  }

  // --- Cache Utils ---
  getCacheStatus(): string | null {
    return this._headers.get("x-vercel-cache") || this._headers.get("x-cache");
  }

  getCacheAge(): number | null {
    const age = this._headers.get("age");
    return age ? Number.parseInt(age, 10) : null;
  }

  isCacheHit(): boolean {
    const status = this.getCacheStatus();
    return status === "HIT";
  }

  isCacheMiss(): boolean {
    const status = this.getCacheStatus();
    return status === "MISS";
  }
}
