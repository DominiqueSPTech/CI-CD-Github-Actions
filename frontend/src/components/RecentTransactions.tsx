import { formatDate, formatMoney } from "../format.ts";
import type { Transaction } from "../types.ts";

type Props = { items: Transaction[]; unavailable?: boolean };

export default function RecentTransactions({ items, unavailable }: Props) {
  return (
    <section className="box panel fade-up" style={{ animationDelay: "220ms" }}>
      <div className="panel-header">
        <h3 className="panel-title">Últimos lançamentos</h3>
        <a className="link" href="#/lancamentos">
          Ver todos →
        </a>
      </div>

      {items.length === 0 ? (
        <p className="empty">
          {unavailable
            ? "Dados indisponíveis: sem resposta do servidor."
            : "Nada por aqui. Clique em “+ Novo lançamento”!"}
        </p>
      ) : (
        <ul className="recent">
          {items.map((t, i) => (
            <li key={t.id} className="fade-up" style={{ animationDelay: `${260 + i * 50}ms` }}>
              <a className="recent-item" href="#/lancamentos" title="Ver lista completa">
                <span className={`recent-dot ${t.type}`}>{t.type === "income" ? "↗" : "↘"}</span>
                <span className="recent-main">
                  <span className="recent-desc">{t.description}</span>
                  <span className="recent-meta">
                    {formatDate(t.date)} · {t.category}
                  </span>
                </span>
                <span className={`recent-amount ${t.type}`}>
                  {t.type === "income" ? "+" : "−"} {formatMoney(t.amount)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
