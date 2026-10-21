import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { formatDate, formatMoney } from "../format.ts";
import { useToast } from "../toast.tsx";
import type { TransactionFilters, TransactionPage } from "../types.ts";

// Telas baixas mostram menos linhas para a lista caber sem scroll.
const PAGE_SIZE = typeof window !== "undefined" && window.innerHeight < 800 ? 8 : 10;
const EMPTY_FILTERS: TransactionFilters = { type: "", category: "", from: "", to: "", q: "" };

type Props = {
  version: number;
  categories: string[];
  onChanged: () => void;
};

export default function Transactions({ version, categories, onChanged }: Props) {
  const toast = useToast();
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TransactionPage | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Busca por descrição com debounce para não chamar a API a cada tecla.
  useEffect(() => {
    if (search === filters.q) return;
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, q: search }));
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters.q]);

  useEffect(() => {
    api
      .listTransactions({ ...filters, page, pageSize: PAGE_SIZE })
      .then((result) => {
        // Se a página ficou vazia (ex.: excluiu o último item), volta uma.
        if (result.items.length === 0 && page > 1) setPage(page - 1);
        else setData(result);
        setUnavailable(false);
      })
      .catch((err) => {
        setUnavailable(true);
        toast.error(err.message, "Não foi possível carregar os lançamentos");
      });
  }, [filters, page, version, toast]);

  function updateFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteTransaction(id);
      toast.success("Lançamento excluído");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message, "Não foi possível excluir");
      onChanged();
    }
  }

  const hasFilters = search !== "" || Object.values(filters).some((v) => v !== "");

  return (
    <div className="transactions">
      <div className="box filters fade-up">
        <label className="filter-search">
          Buscar
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Descrição..." />
        </label>
        <label>
          Tipo
          <select
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value as TransactionFilters["type"])}
          >
            <option value="">Todos</option>
            <option value="expense">Gastos</option>
            <option value="income">Recebimentos</option>
          </select>
        </label>
        <label>
          Categoria
          <select value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          De
          <input type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} />
        </label>
        <label>
          Até
          <input type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} />
        </label>
        <button className="btn btn-ghost" onClick={clearFilters} disabled={!hasFilters}>
          Limpar
        </button>
      </div>

      <section className="box panel fade-up" style={{ animationDelay: "80ms" }}>
        <div className="table-wrap">
          {unavailable && !data ? (
            <p className="empty">Dados indisponíveis: sem resposta do servidor.</p>
          ) : data && data.items.length === 0 ? (
            <p className="empty">Nenhum lançamento encontrado.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th className="num">Valor</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((t, i) => (
                  <tr key={t.id} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.description}</td>
                    <td>
                      <span className="chip">{t.category}</span>
                    </td>
                    <td className={`num ${t.type}`}>
                      {t.type === "income" ? "+" : "−"} {formatMoney(t.amount)}
                    </td>
                    <td className="num">
                      <button
                        className="btn-small"
                        onClick={() => handleDelete(t.id)}
                        aria-label={`Excluir ${t.description}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="pagination">
          <span>{data ? `${data.total} lançamento(s)` : unavailable ? "—" : "Carregando..."}</span>
          <div className="pagination-controls">
            <button className="btn-small wide" onClick={() => setPage((p) => p - 1)} disabled={!data || page <= 1}>
              ← Anterior
            </button>
            <span>
              Página {data?.page ?? page} de {data?.totalPages ?? 1}
            </span>
            <button
              className="btn-small wide"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page >= data.totalPages}
            >
              Próxima →
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
