import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/api.ts";

function mockFetch(impl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

afterEach(() => vi.unstubAllGlobals());

describe("api: mensagens de erro amigáveis", () => {
  it("backend fora do ar", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(api.getSummary()).rejects.toThrow(/Sem conexão com o servidor/);
  });

  it("proxy sem backend (502)", async () => {
    mockFetch(async () => new Response("<html>Bad Gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } }));
    await expect(api.getSummary()).rejects.toThrow(/backend está indisponível \(502\)/);
  });

  it("proxy devolvendo o front no lugar da API", async () => {
    mockFetch(async () => new Response("<!doctype html>", { status: 200, headers: { "Content-Type": "text/html" } }));
    await expect(api.getSummary()).rejects.toThrow(/\/api está sendo roteado para o backend/);
  });

  it("erro de validação usa a mensagem do backend", async () => {
    mockFetch(async () => Response.json({ error: "Informe uma descrição." }, { status: 400 }));
    await expect(
      api.createTransaction({ type: "expense", description: "", amount: 1, category: "Outros", date: "2026-10-01" }),
    ).rejects.toThrow("Informe uma descrição.");
  });

  it("erro interno (500)", async () => {
    mockFetch(async () => Response.json({ error: "Erro interno no servidor." }, { status: 500 }));
    await expect(api.getSummary()).rejects.toThrow(/erro interno \(500\)/);
  });
});
