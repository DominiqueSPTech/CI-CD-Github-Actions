import type { NewTransaction, Summary, Transaction, TransactionFilters, TransactionPage } from "./types.ts";

// VITE_API_URL é embutido no build (docker build --build-arg VITE_API_URL=...).
// Vazio = mesma origem do front, ideal quando há um proxy roteando /api.
const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const API = `${BASE_URL}/api`;

const TIMEOUT_MS = 10_000;

// Erro com mensagem pensada para o usuário final (aparece no toast).
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageForStatus(status: number, serverMessage?: string): string {
  if (status === 400 && serverMessage) return serverMessage;
  if (status === 404) return serverMessage ?? "Recurso não encontrado na API (404). Verifique se o caminho /api está correto.";
  if (status === 502 || status === 503 || status === 504)
    return `O backend está indisponível (${status}). O proxy não conseguiu falar com a API. Ela está no ar?`;
  if (status >= 500) return `O servidor encontrou um erro interno (${status}). Tente de novo; se persistir, confira os logs do backend.`;
  return serverMessage ?? `A API recusou a requisição (${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...init,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ApiError("O servidor demorou demais para responder. Tente novamente em instantes.");
    }
    // fetch só lança erro assim quando não há resposta: backend fora do ar,
    // endereço errado (VITE_API_URL), CORS bloqueado ou sem internet.
    throw new ApiError(
      "Sem conexão com o servidor. Verifique se o backend está no ar e se o endereço da API está correto.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  if (!isJson) {
    // Ex.: o proxy devolveu o index.html do front no lugar da API.
    throw new ApiError(
      res.ok
        ? "A API respondeu em um formato inesperado. Verifique se /api está sendo roteado para o backend."
        : messageForStatus(res.status),
      res.status,
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(messageForStatus(res.status, body?.error), res.status);
  return body as T;
}

type ListParams = Partial<TransactionFilters> & { page?: number; pageSize?: number };

function toQuery(params: ListParams) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  listTransactions: (params: ListParams = {}) => request<TransactionPage>(`/transactions${toQuery(params)}`),
  createTransaction: (data: NewTransaction) =>
    request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  deleteTransaction: (id: number) => request<void>(`/transactions/${id}`, { method: "DELETE" }),
  getSummary: () => request<Summary>("/summary"),
  getCategories: () => request<string[]>("/categories"),
};
