import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiAdapterClient } from "@/lib/api-adapter/src/client";

const fetchMock = vi.fn();

function resposta(corpo: BodyInit | null, init: ResponseInit = {}) {
  return new Response(corpo, {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function cabecalhos(chamada = 0): Record<string, string> {
  return fetchMock.mock.calls[chamada][1].headers as Record<string, string>;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiAdapterClient — cabeçalhos", () => {
  it("GET sem corpo não manda Content-Type (evita preflight de CORS no navegador)", async () => {
    fetchMock.mockImplementation(async () => resposta(JSON.stringify({ ok: true })));

    await new ApiAdapterClient({}).get("https://exemplo.com/a");

    expect(cabecalhos()).not.toHaveProperty("Content-Type");
  });

  it("requisição com corpo manda JSON", async () => {
    fetchMock.mockImplementation(async () => resposta(JSON.stringify({})));

    await new ApiAdapterClient({}).post("https://exemplo.com/a", { x: 1 });

    expect(cabecalhos()["Content-Type"]).toBe("application/json");
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ x: 1 }));
  });

  it("aplica os cabeçalhos padrão do client e deixa o da requisição sobrescrever", async () => {
    fetchMock.mockImplementation(async () => resposta("{}"));
    const client = new ApiAdapterClient({
      defaultHeaders: { Accept: "application/json", "User-Agent": "Loja (a@b.com)" },
    });

    await client.get("https://exemplo.com/a", { headers: { Accept: "text/plain" } });

    expect(cabecalhos()).toMatchObject({ "User-Agent": "Loja (a@b.com)", Accept: "text/plain" });
  });

  it("manda o Bearer do token do client, exceto em requisição pública", async () => {
    fetchMock.mockImplementation(async () => resposta("{}"));
    const client = new ApiAdapterClient({ getToken: async () => "segredo" });

    await client.get("https://exemplo.com/a");
    await client.get("https://exemplo.com/a", { mutatorOptions: { isPublic: true } });

    expect(cabecalhos(0).Authorization).toBe("Bearer segredo");
    expect(cabecalhos(1)).not.toHaveProperty("Authorization");
  });

  it("junta o baseUrl a caminhos relativos e usa URLs absolutas como estão", async () => {
    fetchMock.mockImplementation(async () => resposta("{}"));
    const client = new ApiAdapterClient({ baseUrl: "https://api.exemplo.com" });

    await client.get("/v1/itens");
    await client.get("https://outra.com/x");

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.exemplo.com/v1/itens");
    expect(fetchMock.mock.calls[1][0]).toBe("https://outra.com/x");
  });

  it("sem baseUrl (client do navegador), caminho relativo segue relativo à origem da página", async () => {
    fetchMock.mockImplementation(async () => resposta("{}"));

    await new ApiAdapterClient({}).get("/api/dashboard/busca?q=zelda");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/dashboard/busca?q=zelda");
  });

  it("URL blob: (arquivo local) não recebe o baseUrl", async () => {
    fetchMock.mockImplementation(async () => resposta("{}"));
    const client = new ApiAdapterClient({ baseUrl: "https://api.exemplo.com" });

    await client.get("blob:http://localhost:3000/abc-123");

    expect(fetchMock.mock.calls[0][0]).toBe("blob:http://localhost:3000/abc-123");
  });
});

describe("ApiAdapterClient — respostas", () => {
  it("resposta JSON vem em response.data", async () => {
    fetchMock.mockImplementation(async () => resposta(JSON.stringify({ id: "1" })));

    const r = await new ApiAdapterClient({}).get<{ id: string }>("https://exemplo.com/a");

    expect(r.isSuccess() && r.response.data).toEqual({ id: "1" });
  });

  it("resposta JSON sem corpo (204, DELETE) é sucesso com dado vazio, não erro", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(null, { status: 204, headers: { "content-type": "application/json" } }),
    );

    const r = await new ApiAdapterClient({}).delete("https://exemplo.com/a");

    expect(r.isSuccess()).toBe(true);
    expect(r.isSuccess() && r.response.data).toBeUndefined();
  });

  it("resposta 200 JSON com corpo vazio também é sucesso com dado vazio", async () => {
    fetchMock.mockImplementation(async () => resposta(""));

    const r = await new ApiAdapterClient({}).get("https://exemplo.com/a");

    expect(r.isSuccess() && r.response.data).toBeUndefined();
  });

  it("o signal passado na requisição chega ao fetch (busca que aborta a cada digitação)", async () => {
    fetchMock.mockImplementation(async () => resposta("{}"));
    const controlador = new AbortController();

    await new ApiAdapterClient({}).get("https://exemplo.com/a", { signal: controlador.signal });

    expect(fetchMock.mock.calls[0][1].signal).toBe(controlador.signal);
  });

  it("responseType blob devolve o arquivo", async () => {
    fetchMock.mockImplementation(async () =>
      resposta("PNG", { headers: { "content-type": "image/png" } }),
    );

    const r = await new ApiAdapterClient({}).request<Blob>({
      url: "https://exemplo.com/a.png",
      method: "GET",
      responseType: "blob",
    });

    expect(r.isSuccess() && r.response.data).toBeInstanceOf(Blob);
  });

  it("falha de rede (ou requisição abortada) volta como erro, sem lançar", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    const r = await new ApiAdapterClient({}).get("https://exemplo.com/a");

    expect(r.isError()).toBe(true);
    expect(r.status).toBe(500);
  });
});

describe("ApiAdapterClient — log de erro", () => {
  it("o log do erro HTTP traz o motivo que a API deu", async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    fetchMock.mockImplementation(async () =>
      resposta(JSON.stringify({ message: "Server Error" }), { status: 500 }),
    );
    const client = new ApiAdapterClient({
      logger,
      parseErrorBody: (_status, corpo) => (corpo as { message: string }).message,
    });

    await client.post("https://exemplo.com/a", { x: 1 });

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, motivo: "Server Error", method: "POST" }),
      "Erro http",
    );
  });
});

describe("ApiAdapterClient — erros de APIs fora do padrão RFC 7807", () => {
  const erro = (corpo: string, status = 422) =>
    resposta(corpo, { status, headers: { "content-type": "application/json" } });

  it("sem parser, cai numa mensagem genérica com o status", async () => {
    fetchMock.mockResolvedValue(erro(JSON.stringify({ message: "Dados inválidos" })));

    const r = await new ApiAdapterClient({}).post("https://exemplo.com/a", { x: 1 });

    expect(r.isError()).toBe(true);
    expect(r.isError() && r.response.messages[0]).toContain("422");
  });

  it("com parseErrorBody, a mensagem da API vira o detalhe do erro", async () => {
    fetchMock.mockResolvedValue(erro(JSON.stringify({ message: "Dados inválidos" })));
    const client = new ApiAdapterClient({
      parseErrorBody: (status, corpo) => `API ${status}: ${(corpo as { message: string }).message}`,
    });

    const r = await client.post("https://exemplo.com/a", { x: 1 });

    expect(r.isError() && r.response.detail).toBe("API 422: Dados inválidos");
    expect(r.getErrorMessage()).toContain("API 422: Dados inválidos");
  });

  it("o parser recebe {rawText} quando o corpo não é JSON e pode declinar (null)", async () => {
    fetchMock.mockResolvedValue(
      resposta("<html>Bad gateway</html>", {
        status: 502,
        headers: { "content-type": "text/html" },
      }),
    );
    const parser = vi.fn().mockReturnValue(null);

    const r = await new ApiAdapterClient({ parseErrorBody: parser }).get("https://exemplo.com/a");

    expect(parser).toHaveBeenCalledWith(502, { rawText: "<html>Bad gateway</html>" });
    expect(r.isError() && r.response.messages[0]).toContain("502");
  });

  it("erro no padrão RFC 7807 continua funcionando", async () => {
    fetchMock.mockResolvedValue(
      erro(JSON.stringify({ title: "Falha", detail: "Detalhe", messages: ["a"] }), 400),
    );

    const r = await new ApiAdapterClient({}).get("https://exemplo.com/a");

    expect(r.isError() && r.response.detail).toBe("Detalhe");
  });
});
